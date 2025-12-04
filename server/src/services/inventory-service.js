/**
 * Inventory Service
 * Handles business logic for inventory operations
 */

const mongoose = require("mongoose");
const inventoryRepo = require("../repositories/inventory-repository");
const { LOCATIONS } = require("../constants/enums");

/**
 * Check if inventory already exists for a product at a store
 * @param {Object} checkData - { storeId, productId, location }
 * @returns {Object} - { exactMatch, differentLocation }
 * @throws {Error} If validation fails
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
 * @param {Object} filters - { location }
 * @returns {Array} Array of inventory items
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
 * @param {String} storeId - Store ID
 * @param {Object} filters - { location }
 * @returns {Array} Array of inventory items
 * @throws {Error} If invalid store ID
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
 * Create new inventory item
 * @param {Object} inventoryData - { storeId, productId, quantity, location, minStockLevel, notes }
 * @returns {Object} Created/updated inventory item with merge status
 * @throws {Error} If validation fails or capacity exceeded
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
 * @param {String} inventoryId - Inventory ID
 * @param {Object} updateData - { quantity, location, minStockLevel, notes }
 * @returns {Object} Updated inventory item
 * @throws {Error} If validation fails or capacity exceeded
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
 * Delete inventory item (soft delete)
 * @param {String} inventoryId - Inventory ID
 * @throws {Error} If inventory not found
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
