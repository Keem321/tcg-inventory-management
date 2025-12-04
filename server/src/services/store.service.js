/**
 * Store Service
 * Handles business logic for store operations
 */

const mongoose = require("mongoose");
const storeRepo = require("../repositories/store.repository");

/**
 * Format a store for API response
 * @param {Object} store - Store document
 * @returns {Object} Formatted store
 */
const formatStoreResponse = (store) => {
	if (!store) return null;

	return {
		id: store._id,
		name: store.name,
		location: store.location,
		fullAddress: store.fullAddress,
		maxCapacity: store.maxCapacity,
		currentCapacity: store.currentCapacity || 0,
		availableCapacity: store.maxCapacity - (store.currentCapacity || 0),
		assignedUsers: store.assignedUsers || [],
		createdAt: store.createdAt,
		updatedAt: store.updatedAt,
	};
};

/**
 * Get all stores
 * @returns {Array} Array of formatted stores
 */
exports.getAllStores = async () => {
	const stores = await storeRepo.findAll();
	return stores.map(formatStoreResponse);
};

/**
 * Get store by ID
 * @param {String} storeId - Store ID
 * @returns {Object} Formatted store
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

	return formatStoreResponse(store);
};

/**
 * Create new store
 * @param {Object} storeData - { name, location, fullAddress, maxCapacity }
 * @returns {Object} Created store
 * @throws {Error} If validation fails
 */
exports.createStore = async (storeData) => {
	const { name, location, fullAddress, maxCapacity } = storeData;

	// Validate required fields
	if (!name || !location || !fullAddress || !maxCapacity) {
		const error = new Error("Missing required fields");
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
		fullAddress,
		maxCapacity,
		currentCapacity: 0,
	});

	return formatStoreResponse(store);
};

/**
 * Update store
 * @param {String} storeId - Store ID
 * @param {Object} updateData - Fields to update
 * @returns {Object} Updated store
 * @throws {Error} If validation fails or store not found
 */
exports.updateStore = async (storeId, updateData) => {
	const { name, location, fullAddress, maxCapacity } = updateData;

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
	if (fullAddress) updates.fullAddress = fullAddress;
	if (maxCapacity !== undefined) updates.maxCapacity = maxCapacity;

	const updatedStore = await storeRepo.update(storeId, updates);
	return formatStoreResponse(updatedStore);
};

/**
 * Delete store
 * @param {String} storeId - Store ID
 * @throws {Error} If store not found or has assigned users
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

	await storeRepo.delete(storeId);
};
