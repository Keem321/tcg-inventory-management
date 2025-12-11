/**
 * Transfer Request Service
 * Handles business logic for transfer requests and inventory movement
 */

const mongoose = require("mongoose");
const transferRequestRepo = require("../repositories/transferRequest.repository");
const inventoryRepo = require("../repositories/inventory.repository");
const { USER_ROLES, LOCATIONS } = require("../constants/enums");

/**
 * Create a new transfer request
 * Validates permissions, inventory availability, and generates request number
 * Store managers can only create requests involving their assigned store
 * @async
 * @param {Object} requestData - Request data
 * @param {string} requestData.fromStoreId - Source store ID
 * @param {string} requestData.toStoreId - Destination store ID
 * @param {Array<Object>} requestData.items - Items to transfer
 * @param {string} requestData.items[].inventoryId - Inventory item ID
 * @param {number} requestData.items[].requestedQuantity - Quantity to transfer
 * @param {string} [requestData.notes] - Additional notes
 * @param {Object} user - User creating the request
 * @param {string} user._id - User ID
 * @param {string} user.role - User role ('partner' or 'storeManager')
 * @param {string} [user.assignedStoreId] - Assigned store ID (for managers)
 * @returns {Promise<Object>} Created transfer request with generated request number
 * @throws {400} If required fields missing or invalid
 * @throws {400} If attempting to transfer to same store
 * @throws {403} If manager creating request not involving their store
 * @throws {404} If inventory items not found
 * @throws {400} If insufficient quantity available
 */
exports.createTransferRequest = async (requestData, user) => {
	const { fromStoreId, toStoreId, items, notes } = requestData;

	// Validate required fields
	if (!fromStoreId || !toStoreId || !items || items.length === 0) {
		const error = new Error(
			"Source store, destination store, and items are required"
		);
		error.statusCode = 400;
		throw error;
	}

	// Validate ObjectIds
	if (
		!mongoose.Types.ObjectId.isValid(fromStoreId) ||
		!mongoose.Types.ObjectId.isValid(toStoreId)
	) {
		const error = new Error("Invalid store ID");
		error.statusCode = 400;
		throw error;
	}

	// Can't transfer to same store
	if (fromStoreId === toStoreId) {
		const error = new Error("Cannot transfer inventory to the same store");
		error.statusCode = 400;
		throw error;
	}

	// Check permissions
	if (user.role === USER_ROLES.STORE_MANAGER) {
		// Managers can only create requests involving their store
		if (
			user.assignedStoreId.toString() !== fromStoreId &&
			user.assignedStoreId.toString() !== toStoreId
		) {
			const error = new Error(
				"Managers can only create requests involving their own store"
			);
			error.statusCode = 403;
			throw error;
		}
	}

	// Validate all inventory items exist and belong to fromStore
	for (const item of items) {
		if (!mongoose.Types.ObjectId.isValid(item.inventoryId)) {
			const error = new Error(`Invalid inventory ID: ${item.inventoryId}`);
			error.statusCode = 400;
			throw error;
		}

		const inventory = await inventoryRepo.findById(item.inventoryId);
		if (!inventory) {
			const error = new Error(`Inventory item not found: ${item.inventoryId}`);
			error.statusCode = 404;
			throw error;
		}

		// Verify inventory belongs to the source store
		if (inventory.storeId.toString() !== fromStoreId) {
			const error = new Error(
				`Inventory item ${item.inventoryId} does not belong to source store`
			);
			error.statusCode = 400;
			throw error;
		}

		// Verify requested quantity is available
		if (item.requestedQuantity > inventory.quantity) {
			const error = new Error(
				`Insufficient quantity for ${
					inventory.productId?.name || "product"
				}. Requested: ${item.requestedQuantity}, Available: ${
					inventory.quantity
				}`
			);
			error.statusCode = 400;
			throw error;
		}

		// Set productId from inventory if not provided
		item.productId = inventory.productId._id || inventory.productId;
	}

	// Generate request number
	const requestNumber = await transferRequestRepo.generateRequestNumber();

	// Create the request
	const transferRequest = await transferRequestRepo.create({
		requestNumber,
		fromStoreId,
		toStoreId,
		items,
		notes,
		status: "open",
		createdBy: user._id,
		statusHistory: [
			{
				status: "open",
				changedBy: user._id,
				changedAt: new Date(),
			},
		],
	});

	return transferRequest;
};

/**
 * Get all transfer requests (filtered by user permissions)
 * Partners can see all requests (optionally filtered by store)
 * Store managers only see requests involving their assigned store
 * @async
 * @param {Object} user - Current user
 * @param {string} user.role - User role ('partner' or 'storeManager')
 * @param {string} [user.assignedStoreId] - Assigned store ID (for managers)
 * @param {Object} [filters={}] - Filter options
 * @param {string} [filters.status] - Filter by status ('open', 'approved', 'in-transit', 'completed', 'cancelled')
 * @param {string} [filters.storeId] - Filter by store ID (for partners)
 * @returns {Promise<Array>} Array of transfer request documents
 */
exports.getAllTransferRequests = async (user, filters = {}) => {
	// Partners can see all requests
	if (user.role === USER_ROLES.PARTNER) {
		// If storeId filter is provided, filter by store
		if (filters.storeId) {
			return await transferRequestRepo.findByStore(filters.storeId, {
				status: filters.status,
			});
		}
		return await transferRequestRepo.findAll({ status: filters.status });
	}

	// Managers can only see requests involving their store
	if (user.role === USER_ROLES.STORE_MANAGER) {
		return await transferRequestRepo.findByStore(user.assignedStoreId, {
			status: filters.status,
		});
	}

	// Employees cannot access transfer requests
	const error = new Error("Insufficient permissions to view transfer requests");
	error.statusCode = 403;
	throw error;
};

/**
 * Get transfer request by ID
 * Store managers can only view requests involving their assigned store
 * @async
 * @param {string} id - Transfer request ID
 * @param {Object} user - Current user
 * @param {string} user.role - User role
 * @param {string} [user.assignedStoreId] - Assigned store ID (for managers)
 * @returns {Promise<Object>} Transfer request document with populated stores and items
 * @throws {400} If transfer request ID format is invalid
 * @throws {404} If transfer request not found
 * @throws {403} If manager accessing request not involving their store
 */
exports.getTransferRequestById = async (id, user) => {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		const error = new Error("Invalid transfer request ID");
		error.statusCode = 400;
		throw error;
	}

	const transferRequest = await transferRequestRepo.findById(id);

	if (!transferRequest) {
		const error = new Error("Transfer request not found");
		error.statusCode = 404;
		throw error;
	}

	// Check permissions
	if (user.role === USER_ROLES.STORE_MANAGER) {
		const userStoreId = user.assignedStoreId.toString();
		const fromStoreId = transferRequest.fromStoreId._id.toString();
		const toStoreId = transferRequest.toStoreId._id.toString();

		if (userStoreId !== fromStoreId && userStoreId !== toStoreId) {
			const error = new Error("Insufficient permissions to view this request");
			error.statusCode = 403;
			throw error;
		}
	}

	return transferRequest;
};

/**
 * Update transfer request status
 * Enforces state transition rules and role permissions
 * State transitions:
 * - open → approved (partner only)
 * - approved → in-transit (from store manager)
 * - in-transit → completed (to store manager)
 * - any status → cancelled (creator, partner, or involved managers)
 * @async
 * @param {string} id - Transfer request ID
 * @param {string} newStatus - New status ('approved', 'in-transit', 'completed', 'cancelled')
 * @param {Object} user - Current user
 * @param {string} user._id - User ID
 * @param {string} user.role - User role
 * @param {string} [user.assignedStoreId] - Assigned store ID (for managers)
 * @param {Object} [additionalData={}] - Additional data
 * @param {string} [additionalData.closeReason] - Reason for closing/cancelling
 * @returns {Promise<Object>} Updated transfer request
 * @throws {403} If invalid state transition or insufficient permissions
 * @throws {400} If completing request with unprocessed items
 */
exports.updateTransferStatus = async (
	id,
	newStatus,
	user,
	additionalData = {}
) => {
	const transferRequest = await exports.getTransferRequestById(id, user);

	// Check if user can transition to new status
	const userStoreId = user.assignedStoreId?.toString();
	if (!transferRequest.canTransitionTo(newStatus, user, userStoreId)) {
		const error = new Error(
			`Cannot transition from ${transferRequest.status} to ${newStatus}`
		);
		error.statusCode = 403;
		throw error;
	}

	const updateData = { status: newStatus };

	// Add to status history
	const statusHistoryEntry = {
		status: newStatus,
		changedBy: user._id,
		changedAt: new Date(),
	};

	// Update tracking fields based on status
	switch (newStatus) {
		case "requested":
			updateData.requestedBy = user._id;
			updateData.requestedAt = new Date();
			break;

		case "sent":
			updateData.sentBy = user._id;
			updateData.sentAt = new Date();
			// Deduct inventory from source store
			await exports.deductInventoryFromSource(transferRequest);
			break;

		case "complete":
			updateData.completedBy = user._id;
			updateData.completedAt = new Date();
			// Add inventory to destination store
			await exports.addInventoryToDestination(transferRequest);
			break;

		case "closed":
			updateData.closedBy = user._id;
			updateData.closedAt = new Date();
			if (additionalData.closeReason) {
				updateData.closeReason = additionalData.closeReason;
			}
			// If was already sent, return inventory to source
			if (transferRequest.status === "sent") {
				await exports.returnInventoryToSource(transferRequest);
			}
			break;
	}

	// Push new status to history
	updateData.$push = { statusHistory: statusHistoryEntry };

	return await transferRequestRepo.update(id, updateData);
};

/**
 * Deduct inventory from source store when marked as "sent"
 * Soft deletes inventory items when quantity reaches 0
 * @async
 * @param {Object} transferRequest - Transfer request object
 * @param {Array<Object>} transferRequest.items - Items to deduct
 * @returns {Promise<void>}
 * @throws {404} If inventory item not found
 * @throws {400} If insufficient inventory quantity
 */
exports.deductInventoryFromSource = async (transferRequest) => {
	for (const item of transferRequest.items) {
		const inventory = await inventoryRepo.findById(item.inventoryId);

		if (!inventory) {
			const error = new Error(`Inventory item ${item.inventoryId} not found`);
			error.statusCode = 404;
			throw error;
		}

		const newQuantity = inventory.quantity - item.requestedQuantity;

		if (newQuantity < 0) {
			const error = new Error(
				`Insufficient inventory for ${inventory.productId?.name || "product"}`
			);
			error.statusCode = 400;
			throw error;
		}

		if (newQuantity === 0) {
			// Soft delete if quantity reaches 0
			await inventoryRepo.delete(item.inventoryId);
		} else {
			// Update quantity
			await inventoryRepo.update(item.inventoryId, { quantity: newQuantity });
		}
	}
};

/**
 * Add inventory to destination store when marked as "complete"
 * Merges with existing inventory at same location or creates new
 * Preserves container and card item data from source
 * @async
 * @param {Object} transferRequest - Transfer request object
 * @param {Object} transferRequest.toStoreId - Destination store
 * @param {Array<Object>} transferRequest.items - Items to add
 * @returns {Promise<void>}
 */
exports.addInventoryToDestination = async (transferRequest) => {
	for (const item of transferRequest.items) {
		const sourceInventory = await inventoryRepo.findById(item.inventoryId);

		if (!sourceInventory) {
			// If source inventory was deleted, we still have the data from the request
			// Use the item data to create new inventory
		}

		// Check if inventory already exists at destination with same location
		const existingInventory = await inventoryRepo.findDuplicate(
			transferRequest.toStoreId._id,
			item.productId,
			sourceInventory?.location || LOCATIONS.FLOOR // Default to floor if source not found
		);

		if (existingInventory) {
			// Add to existing inventory
			const newQuantity = existingInventory.quantity + item.requestedQuantity;
			await inventoryRepo.update(existingInventory._id, {
				quantity: newQuantity,
			});
		} else {
			// Create new inventory at destination
			const newInventoryData = {
				storeId: transferRequest.toStoreId._id,
				productId: item.productId,
				location: sourceInventory?.location || LOCATIONS.FLOOR,
				quantity: item.requestedQuantity,
			};

			// Copy container data if applicable
			if (sourceInventory?.containerType) {
				newInventoryData.containerType = sourceInventory.containerType;
				newInventoryData.containerName = sourceInventory.containerName;
				newInventoryData.containerUnitSize = sourceInventory.containerUnitSize;
			}

			// Copy card items if applicable
			if (item.cardItems && item.cardItems.length > 0) {
				newInventoryData.cardItems = item.cardItems;
			}

			await inventoryRepo.create(newInventoryData);
		}
	}
};

/**
 * Return inventory to source store if request is cancelled after being sent
 * Reactivates soft-deleted inventory or creates new inventory entry
 * Returned items default to back location
 * @async
 * @param {Object} transferRequest - Transfer request object
 * @param {Object} transferRequest.fromStoreId - Source store
 * @param {Array<Object>} transferRequest.items - Items to return
 * @returns {Promise<void>}
 */
exports.returnInventoryToSource = async (transferRequest) => {
	for (const item of transferRequest.items) {
		// Try to find existing inventory at source
		const existingInventory = await inventoryRepo.findById(item.inventoryId);

		if (existingInventory && existingInventory.isActive) {
			// Inventory still exists, add back the quantity
			const newQuantity = existingInventory.quantity + item.requestedQuantity;
			await inventoryRepo.update(existingInventory._id, {
				quantity: newQuantity,
			});
		} else if (existingInventory && !existingInventory.isActive) {
			// Inventory was soft deleted, reactivate and update quantity
			await inventoryRepo.update(existingInventory._id, {
				quantity: item.requestedQuantity,
				isActive: true,
			});
		} else {
			// Inventory doesn't exist anymore, recreate it
			const newInventoryData = {
				storeId: transferRequest.fromStoreId._id,
				productId: item.productId,
				location: LOCATIONS.BACK, // Return to back by default
				quantity: item.requestedQuantity,
			};

			// Add container data if available from item
			if (item.cardItems && item.cardItems.length > 0) {
				newInventoryData.cardItems = item.cardItems;
			}

			await inventoryRepo.create(newInventoryData);
		}
	}
};

/**
 * Delete transfer request (soft delete - sets isDeleted to true)
 * Only partners can delete, and only if status is "open" or "closed"
 * @async
 * @param {string} id - Transfer request ID
 * @param {Object} user - Current user
 * @param {string} user.role - User role (must be 'partner')
 * @returns {Promise<Object>} Deleted transfer request
 * @throws {403} If user is not a partner
 * @throws {400} If transfer request ID format is invalid
 * @throws {404} If transfer request not found
 * @throws {400} If request status prevents deletion
 */
exports.deleteTransferRequest = async (id, user) => {
	if (user.role !== USER_ROLES.PARTNER) {
		const error = new Error("Only partners can delete transfer requests");
		error.statusCode = 403;
		throw error;
	}

	const transferRequest = await exports.getTransferRequestById(id, user);

	if (!["open", "closed"].includes(transferRequest.status)) {
		const error = new Error(
			"Can only delete requests with status 'open' or 'closed'"
		);
		error.statusCode = 400;
		throw error;
	}

	return await transferRequestRepo.delete(id);
};

module.exports = exports;
