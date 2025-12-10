/**
 * Store Service
 * Handles business logic for store operations
 */

const mongoose = require("mongoose");
const storeRepo = require("../repositories/store.repository");

/**
 * Get all stores
 * @param {Object} options - Query options
 * @param {Boolean} options.includeInactive - Include inactive stores (default: false)
 * @returns {Array} Array of stores
 */
exports.getAllStores = async (options = {}) => {
	const { includeInactive = false } = options;

	if (includeInactive) {
		return await storeRepo.findAll();
	}

	// By default, only return active stores
	return await storeRepo.findAll({ isActive: true });
};

/**
 * Get store by ID
 * @param {String} storeId - Store ID
 * @returns {Object} Store document
 * @throws {Error} If store not found or invalid ID
 */
exports.getStoreById = async (storeId) => {
	if (!mongoose.Types.ObjectId.isValid(storeId)) {
		const error = new Error("Invalid store ID format");
		error.statusCode = 400;
		throw error;
	}

	const store = await storeRepo.findById(storeId);
	if (!store) {
		const error = new Error("Store not found");
		error.statusCode = 404;
		throw error;
	}

	return store;
};

/**
 * Create new store
 * @param {Object} storeData - { name, location, maxCapacity }
 * @returns {Object} Created store
 * @throws {Error} If validation fails
 */
exports.createStore = async (storeData) => {
	const { name, location, maxCapacity } = storeData;

	// Validate required fields
	if (!name || !location || !maxCapacity) {
		const error = new Error("Missing required fields");
		error.statusCode = 400;
		throw error;
	}

	// Validate location object
	if (
		!location.address ||
		!location.city ||
		!location.state ||
		!location.zipCode
	) {
		const error = new Error("Missing required location fields");
		error.statusCode = 400;
		throw error;
	}

	// Validate maxCapacity
	if (maxCapacity <= 0) {
		const error = new Error("Max capacity must be greater than 0");
		error.statusCode = 400;
		throw error;
	}

	const store = await storeRepo.create({
		name,
		location,
		maxCapacity,
		currentCapacity: 0,
	});

	return store;
};

/**
 * Update store
 * @param {String} storeId - Store ID
 * @param {Object} updateData - Fields to update
 * @returns {Object} Updated store
 * @throws {Error} If validation fails or store not found
 */
exports.updateStore = async (storeId, updateData) => {
	const { name, location, maxCapacity } = updateData;

	// Validate ObjectId
	if (!mongoose.Types.ObjectId.isValid(storeId)) {
		const error = new Error("Invalid store ID format");
		error.statusCode = 400;
		throw error;
	}

	// Validate maxCapacity if provided
	if (maxCapacity !== undefined && maxCapacity <= 0) {
		const error = new Error("Max capacity must be greater than 0");
		error.statusCode = 400;
		throw error;
	}

	// Check if store exists
	const existingStore = await storeRepo.findById(storeId);
	if (!existingStore) {
		const error = new Error("Store not found");
		error.statusCode = 404;
		throw error;
	}

	// Validate capacity constraint
	if (
		maxCapacity !== undefined &&
		maxCapacity < existingStore.currentCapacity
	) {
		const error = new Error(
			`Cannot set max capacity below current capacity (${existingStore.currentCapacity})`
		);
		error.statusCode = 400;
		throw error;
	}

	// Build update object
	const updates = {};
	if (name) updates.name = name;
	if (location) updates.location = location;
	if (maxCapacity !== undefined) updates.maxCapacity = maxCapacity;

	const updatedStore = await storeRepo.update(storeId, updates);
	return updatedStore;
};

/**
 * Delete store (soft delete)
 * @param {String} storeId - Store ID
 * @returns {Object} Updated store document
 * @throws {Error} If store not found, has assigned users, has inventory, or invalid ID
 */
exports.deleteStore = async (storeId) => {
	// Validate ObjectId
	if (!mongoose.Types.ObjectId.isValid(storeId)) {
		const error = new Error("Invalid store ID format");
		error.statusCode = 400;
		throw error;
	}

	// Check if store exists
	const store = await storeRepo.findById(storeId);
	if (!store) {
		const error = new Error("Store not found");
		error.statusCode = 404;
		throw error;
	}

	// Check for assigned users
	const assignedUserCount = await storeRepo.countAssignedUsers(storeId);
	if (assignedUserCount > 0) {
		const error = new Error(
			`Cannot delete store with ${assignedUserCount} assigned user(s)`
		);
		error.statusCode = 400;
		throw error;
	}

	// Check for existing inventory
	const inventoryRepo = require("../repositories/inventory.repository");
	const activeInventory = await inventoryRepo.findByStore(storeId, {
		isActive: true,
	});
	if (activeInventory && activeInventory.length > 0) {
		const error = new Error("Cannot delete store with existing inventory");
		error.statusCode = 400;
		throw error;
	}

	// Soft delete
	return await storeRepo.softDelete(storeId);
};
