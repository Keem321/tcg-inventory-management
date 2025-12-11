/**
 * Inventory Service
 * Handles business logic for inventory operations
 */

const mongoose = require("mongoose");
const inventoryRepo = require("../repositories/inventory.repository");
const { LOCATIONS } = require("../constants/enums");

/**
 * Check if inventory already exists for a product at a store
 * Used before creating new inventory to prevent duplicates and suggest merge
 * @async
 * @param {Object} checkData - Check parameters
 * @param {string} checkData.storeId - Store ID to check
 * @param {string} checkData.productId - Product ID to check
 * @param {string} checkData.location - Location ('floor' or 'back')
 * @returns {Promise<Object>} Object with exactMatch and differentLocation properties
 * @returns {Object|null} return.exactMatch - Exact match (same location) if found
 * @returns {Object|null} return.differentLocation - Match at different location if found
 * @throws {400} If required fields missing or invalid IDs
 */
exports.checkDuplicate = async (checkData) => {
	const { storeId, productId, location } = checkData;

	// Validate inputs
	if (!storeId || !productId || !location) {
		const error = new Error("Store ID, Product ID, and location are required");
		error.statusCode = 400;
		throw error;
	}

	// Validate ObjectIds
	if (
		!mongoose.Types.ObjectId.isValid(storeId) ||
		!mongoose.Types.ObjectId.isValid(productId)
	) {
		const error = new Error("Invalid store or product ID");
		error.statusCode = 400;
		throw error;
	}

	// Check for exact match (same location)
	const exactMatch = await inventoryRepo.findDuplicate(
		storeId,
		productId,
		location
	);

	// Check for same product, different location
	const differentLocation = await inventoryRepo.findAtDifferentLocation(
		storeId,
		productId,
		location
	);

	return {
		exactMatch: exactMatch
			? {
					id: exactMatch._id,
					location: exactMatch.location,
					quantity: exactMatch.quantity,
					productName: exactMatch.productId?.name,
			  }
			: null,
		differentLocation: differentLocation
			? {
					id: differentLocation._id,
					location: differentLocation.location,
					quantity: differentLocation.quantity,
					productName: differentLocation.productId?.name,
			  }
			: null,
	};
};

/**
 * Get all inventory across all stores
 * @async
 * @param {Object} [filters={}] - Filter options
 * @param {string} [filters.location] - Filter by location ('floor' or 'back')
 * @returns {Promise<Array>} Array of inventory items with populated product and store data
 */
exports.getAllInventory = async (filters = {}) => {
	const { location } = filters;

	// Build query
	const query = {};
	if (location && [LOCATIONS.FLOOR, LOCATIONS.BACK].includes(location)) {
		query.location = location;
	}

	return inventoryRepo.findAll(query);
};

/**
 * Get inventory for a specific store
 * @async
 * @param {string} storeId - Store ID
 * @param {Object} [filters={}] - Filter options
 * @param {string} [filters.location] - Filter by location ('floor' or 'back')
 * @returns {Promise<Array>} Array of inventory items with populated product data
 * @throws {400} If store ID format is invalid
 */
exports.getInventoryByStore = async (storeId, filters = {}) => {
	const { location } = filters;

	// Validate ObjectId format
	if (!mongoose.Types.ObjectId.isValid(storeId)) {
		const error = new Error("Invalid store ID format");
		error.statusCode = 400;
		throw error;
	}

	// Build query
	const query = {};
	if (location && [LOCATIONS.FLOOR, LOCATIONS.BACK].includes(location)) {
		query.location = location;
	}

	return inventoryRepo.findByStore(storeId, query);
};

/**
 * Create new inventory item or merge with existing
 * Supports both direct inventory and card containers
 * Automatically merges with existing inventory at same location
 * @async
 * @param {Object} inventoryData - Inventory data
 * @param {string} inventoryData.storeId - Store ID
 * @param {string} inventoryData.productId - Product ID (or container details)
 * @param {number} inventoryData.quantity - Quantity
 * @param {string} inventoryData.location - Location ('floor' or 'back')
 * @param {number} [inventoryData.minStockLevel] - Minimum stock level alert threshold
 * @param {string} [inventoryData.notes] - Additional notes
 * @param {Object} [inventoryData.cardContainer] - Card container details (for mixed inventory)
 * @returns {Promise<Object>} Result object with inventory, merged flag, and merge details
 * @throws {400} If required fields missing or invalid IDs
 * @throws {404} If store or product not found
 * @throws {400} If store capacity exceeded
 */
exports.createInventory = async (inventoryData) => {
	const { storeId, productId, quantity, location, minStockLevel, notes } =
		inventoryData;

	// Validate required fields
	if (!storeId || !productId || quantity === undefined || !location) {
		const error = new Error("Missing required fields");
		error.statusCode = 400;
		throw error;
	}

	// Validate ObjectId formats
	if (
		!mongoose.Types.ObjectId.isValid(storeId) ||
		!mongoose.Types.ObjectId.isValid(productId)
	) {
		const error = new Error("Invalid ID format");
		error.statusCode = 400;
		throw error;
	}

	// Verify store exists
	const store = await inventoryRepo.findStoreById(storeId);
	if (!store) {
		const error = new Error("Store not found");
		error.statusCode = 404;
		throw error;
	}

	// Verify product exists
	const product = await inventoryRepo.findProductById(productId);
	if (!product) {
		const error = new Error("Product not found");
		error.statusCode = 404;
		throw error;
	}

	// Check for existing inventory at same location
	const existingInventory = await inventoryRepo.findDuplicate(
		storeId,
		productId,
		location
	);

	if (existingInventory) {
		// Duplicate found - merge quantities instead of creating new record
		const newQuantity = existingInventory.quantity + quantity;
		const currentCapacity = await inventoryRepo.calculateStoreCapacity(storeId);
		const oldSpace = product.unitSize * existingInventory.quantity;
		const newSpace = product.unitSize * newQuantity;
		const spaceChange = newSpace - oldSpace;
		const availableSpace = store.maxCapacity - currentCapacity;

		if (spaceChange > availableSpace) {
			const error = new Error(
				`Insufficient capacity. Required additional: ${spaceChange}, Available: ${availableSpace}`
			);
			error.statusCode = 400;
			throw error;
		}

		// Update existing inventory
		const updateData = {
			quantity: newQuantity,
		};
		if (
			minStockLevel !== undefined &&
			minStockLevel > existingInventory.minStockLevel
		) {
			updateData.minStockLevel = minStockLevel;
		}
		if (notes) {
			updateData.notes = notes;
		}

		const updated = await inventoryRepo.update(
			existingInventory._id,
			updateData
		);

		// Update store capacity
		const newCapacity = await inventoryRepo.calculateStoreCapacity(storeId);
		await inventoryRepo.updateStoreCapacity(storeId, newCapacity);

		const populated = await inventoryRepo.findByIdPopulated(updated._id);

		return {
			inventory: populated,
			merged: true,
			message: `Inventory updated - added ${quantity} units to existing stock`,
		};
	}

	// Check capacity for new inventory
	const currentCapacity = await inventoryRepo.calculateStoreCapacity(storeId);
	const requiredSpace = product.unitSize * quantity;
	const availableSpace = store.maxCapacity - currentCapacity;

	if (requiredSpace > availableSpace) {
		const error = new Error(
			`Insufficient capacity. Required: ${requiredSpace}, Available: ${availableSpace}`
		);
		error.statusCode = 400;
		throw error;
	}

	// Create new inventory
	const newInventory = await inventoryRepo.create({
		storeId,
		productId,
		quantity,
		location,
		minStockLevel: minStockLevel || 0,
		notes,
	});

	// Update store's current capacity
	const newCapacity = await inventoryRepo.calculateStoreCapacity(storeId);
	await inventoryRepo.updateStoreCapacity(storeId, newCapacity);

	const populated = await inventoryRepo.findByIdPopulated(newInventory._id);

	return {
		inventory: populated,
		merged: false,
		message: "Inventory created successfully",
	};
};

/**
 * Update inventory item
 * Validates capacity constraints when quantity changes
 * @async
 * @param {string} inventoryId - Inventory ID
 * @param {Object} updateData - Fields to update
 * @param {number} [updateData.quantity] - New quantity
 * @param {string} [updateData.location] - New location ('floor' or 'back')
 * @param {number} [updateData.minStockLevel] - Minimum stock level
 * @param {string} [updateData.notes] - Additional notes
 * @returns {Promise<Object>} Updated inventory item with populated product data
 * @throws {400} If inventory ID format is invalid
 * @throws {404} If inventory not found
 * @throws {400} If capacity exceeded when increasing quantity
 */
exports.updateInventory = async (inventoryId, updateData) => {
	const { quantity, location, minStockLevel, notes } = updateData;

	// Validate ObjectId format
	if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
		const error = new Error("Invalid inventory ID format");
		error.statusCode = 400;
		throw error;
	}

	// Find existing inventory (with product for capacity calculations)
	const inventory = await inventoryRepo.findByIdPopulated(inventoryId);
	if (!inventory) {
		const error = new Error("Inventory not found");
		error.statusCode = 404;
		throw error;
	}

	// If quantity is changing, check capacity
	if (quantity !== undefined && quantity !== inventory.quantity) {
		const store = await inventoryRepo.findStoreById(inventory.storeId);
		const currentCapacity = await inventoryRepo.calculateStoreCapacity(
			inventory.storeId
		);
		const oldSpace = inventory.productId.unitSize * inventory.quantity;
		const newSpace = inventory.productId.unitSize * quantity;
		const spaceChange = newSpace - oldSpace;
		const availableSpace = store.maxCapacity - currentCapacity;

		if (spaceChange > availableSpace) {
			const error = new Error(
				`Insufficient capacity. Required additional: ${spaceChange}, Available: ${availableSpace}`
			);
			error.statusCode = 400;
			throw error;
		}
	}

	// Build update object
	const updates = {};
	if (quantity !== undefined) updates.quantity = quantity;
	if (location) updates.location = location;
	if (minStockLevel !== undefined) updates.minStockLevel = minStockLevel;
	if (notes !== undefined) updates.notes = notes;

	// Update inventory
	await inventoryRepo.update(inventoryId, updates);

	// Update store's current capacity
	const newCapacity = await inventoryRepo.calculateStoreCapacity(
		inventory.storeId
	);
	await inventoryRepo.updateStoreCapacity(inventory.storeId, newCapacity);

	// Return updated inventory
	return inventoryRepo.findByIdPopulated(inventoryId);
};

/**
 * Delete inventory item (soft delete - sets isDeleted to true)
 * Updates store capacity after deletion
 * @async
 * @param {string} inventoryId - Inventory ID
 * @returns {Promise<Object>} Deleted inventory item
 * @throws {400} If inventory ID format is invalid
 * @throws {404} If inventory not found
 */
exports.deleteInventory = async (inventoryId) => {
	// Validate ObjectId format
	if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
		const error = new Error("Invalid inventory ID format");
		error.statusCode = 400;
		throw error;
	}

	// Find inventory
	const inventory = await inventoryRepo.findById(inventoryId);
	if (!inventory) {
		const error = new Error("Inventory not found");
		error.statusCode = 404;
		throw error;
	}

	// Soft delete
	await inventoryRepo.softDelete(inventoryId);

	// Update store's current capacity
	const newCapacity = await inventoryRepo.calculateStoreCapacity(
		inventory.storeId
	);
	await inventoryRepo.updateStoreCapacity(inventory.storeId, newCapacity);
};
