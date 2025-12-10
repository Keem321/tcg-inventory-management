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
 * @param {Object} requestData - { fromStoreId, toStoreId, items, notes }
 * @param {Object} user - User creating the request
 * @returns {Object} Created transfer request
 * @throws {Error} If validation fails
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
 * @param {Object} user - Current user
 * @param {Object} filters - Optional filters { status }
 * @returns {Array} Array of transfer requests
 */
exports.getAllTransferRequests = async (user, filters = {}) => {
	// Partners can see all requests
	if (user.role === USER_ROLES.PARTNER) {
		return await transferRequestRepo.findAll(filters);
	}

	// Managers can only see requests involving their store
	if (user.role === USER_ROLES.STORE_MANAGER) {
		return await transferRequestRepo.findByStore(user.assignedStoreId, filters);
	}

	// Employees cannot access transfer requests
	const error = new Error("Insufficient permissions to view transfer requests");
	error.statusCode = 403;
	throw error;
};

/**
 * Get transfer request by ID
 * @param {string} id - Transfer request ID
 * @param {Object} user - Current user
 * @returns {Object} Transfer request
 * @throws {Error} If not found or insufficient permissions
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
 * @param {string} id - Transfer request ID
 * @param {string} newStatus - New status
 * @param {Object} user - Current user
 * @param {Object} additionalData - Additional data (e.g., closeReason)
 * @returns {Object} Updated transfer request
 * @throws {Error} If validation fails
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
 * @param {Object} transferRequest - Transfer request
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
 * @param {Object} transferRequest - Transfer request
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
 * Return inventory to source store if request is closed after being sent
 * @param {Object} transferRequest - Transfer request
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
 * Delete transfer request (soft delete)
 * Only partners can delete, and only if status is "open" or "closed"
 * @param {string} id - Transfer request ID
 * @param {Object} user - Current user
 * @returns {Object} Deleted transfer request
 * @throws {Error} If validation fails
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
