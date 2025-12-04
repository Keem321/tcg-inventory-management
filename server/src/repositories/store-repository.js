/**
 * Store Repository
 * Handles all database operations for stores
 */

const { Store } = require("../models/Store");
const { User } = require("../models/User");

/**
 * Find all stores
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} Array of store documents
 */
exports.findAll = async (filters = {}) => {
	return await Store.find(filters).sort({ name: 1 });
};

/**
 * Find store by ID
 * @param {string} id - Store ID
 * @returns {Promise<Object|null>} Store document or null
 */
exports.findById = async (id) => {
	return await Store.findById(id);
};

/**
 * Create new store
 * @param {Object} storeData - Store data
 * @returns {Promise<Object>} Created store document
 */
exports.create = async (storeData) => {
	const store = new Store(storeData);
	return await store.save();
};

/**
 * Update store by ID
 * @param {string} id - Store ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated store document or null
 */
exports.update = async (id, updates) => {
	const store = await Store.findById(id);
	if (!store) return null;

	// Apply updates
	Object.keys(updates).forEach((key) => {
		if (updates[key] !== undefined) {
			store[key] = updates[key];
		}
	});

	return await store.save();
};

/**
 * Delete store by ID (hard delete)
 * @param {string} id - Store ID
 * @returns {Promise<Object|null>} Deleted store document or null
 */
exports.delete = async (id) => {
	return await Store.findByIdAndDelete(id);
};

/**
 * Count users assigned to a store
 * @param {string} storeId - Store ID
 * @returns {Promise<number>} Number of assigned users
 */
exports.countAssignedUsers = async (storeId) => {
	return await User.countDocuments({ assignedStoreId: storeId });
};

/**
 * Find users assigned to a store
 * @param {string} storeId - Store ID
 * @returns {Promise<Array>} Array of user documents
 */
exports.findAssignedUsers = async (storeId) => {
	return await User.find({ assignedStoreId: storeId });
};

/**
 * Check if store exists
 * @param {string} id - Store ID
 * @returns {Promise<boolean>} True if store exists
 */
exports.exists = async (id) => {
	const count = await Store.countDocuments({ _id: id });
	return count > 0;
};
