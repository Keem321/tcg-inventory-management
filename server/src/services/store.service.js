/**
 * Store Service
 * Handles business logic for store operations
 */

const mongoose = require("mongoose");
const storeRepo = require("../repositories/store.repository");

/**
 * Get all stores
 * @async
 * @param {Object} [options={}] - Query options
 * @param {boolean} [options.includeInactive=false] - Include inactive stores
 * @returns {Promise<Array>} Array of store documents
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
 * @async
 * @param {string} storeId - Store ID
 * @returns {Promise<Object>} Store document
 * @throws {400} If store ID format is invalid
 * @throws {404} If store not found
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
 * @async
 * @param {Object} storeData - Store data
 * @param {string} storeData.name - Store name
 * @param {Object} storeData.location - Store location
 * @param {string} storeData.location.address - Street address
 * @param {string} storeData.location.city - City
 * @param {string} storeData.location.state - State
 * @param {string} storeData.location.zipCode - ZIP code
 * @param {number} storeData.maxCapacity - Maximum capacity in cubic units
 * @returns {Promise<Object>} Created store document
 * @throws {400} If required fields missing or invalid
 * @throws {400} If maxCapacity is not greater than 0
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
 * Validates that new maxCapacity is not below current capacity
 * @async
 * @param {string} storeId - Store ID
 * @param {Object} updateData - Fields to update
 * @param {string} [updateData.name] - Store name
 * @param {Object} [updateData.location] - Store location
 * @param {number} [updateData.maxCapacity] - Maximum capacity
 * @returns {Promise<Object>} Updated store document
 * @throws {400} If store ID format is invalid
 * @throws {404} If store not found
 * @throws {400} If maxCapacity is below current capacity
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
 * Delete store (soft delete - sets isActive to false)
 * Prevents deletion if store has assigned users or active inventory
 * @async
 * @param {string} storeId - Store ID
 * @returns {Promise<Object>} Updated store document with isActive set to false
 * @throws {400} If store ID format is invalid
 * @throws {404} If store not found
 * @throws {400} If store has assigned users
 * @throws {400} If store has active inventory
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
