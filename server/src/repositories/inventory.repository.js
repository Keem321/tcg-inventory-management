/**
 * Inventory Repository
 * Handles all database operations for inventory
 */

const { Inventory } = require("../models/inventory.model");
const { Store } = require("../models/store.model");
const { Product } = require("../models/product.model");
const { LOCATIONS } = require("../constants/enums");

/**
 * Find all inventory with optional filters
 * @param {Object} filters - Query filters
 * @returns {Promise<Array>} Array of inventory documents
 */
exports.findAll = async (filters = {}) => {
	return await Inventory.find(filters)
		.populate("storeId", "name location fullAddress")
		.populate("productId", "name sku productType brand")
		.sort({ storeId: 1, location: 1, productId: 1 });
};

/**
 * Find inventory by store ID
 * @param {string} storeId - Store ID
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} Array of inventory documents
 */
exports.findByStore = async (storeId, filters = {}) => {
	return await Inventory.find({ storeId, ...filters })
		.populate("storeId", "name location fullAddress")
		.populate("productId", "name sku productType brand")
		.sort({ location: 1, productId: 1 });
};

/**
 * Find inventory by ID
 * @param {string} id - Inventory ID
 * @returns {Promise<Object|null>} Inventory document or null
 */
exports.findById = async (id) => {
	return await Inventory.findById(id).populate("productId");
};

/**
 * Find duplicate inventory
 * @param {string} storeId - Store ID
 * @param {string} productId - Product ID
 * @param {string} location - Location (floor/back)
 * @returns {Promise<Object|null>} Existing inventory or null
 */
exports.findDuplicate = async (storeId, productId, location) => {
	return await Inventory.findOne({
		storeId,
		productId,
		location,
		isActive: true,
	}).populate("productId", "name sku");
};

/**
 * Find inventory at different location
 * @param {string} storeId - Store ID
 * @param {string} productId - Product ID
 * @param {string} excludeLocation - Location to exclude
 * @returns {Promise<Object|null>} Inventory at different location or null
 */
exports.findAtDifferentLocation = async (
	storeId,
	productId,
	excludeLocation
) => {
	const otherLocation =
		excludeLocation === LOCATIONS.FLOOR ? LOCATIONS.BACK : LOCATIONS.FLOOR;
	return await Inventory.findOne({
		storeId,
		productId,
		location: otherLocation,
		isActive: true,
	}).populate("productId", "name sku");
};

/**
 * Create new inventory
 * @param {Object} inventoryData - Inventory data
 * @returns {Promise<Object>} Created inventory document
 */
exports.create = async (inventoryData) => {
	return await Inventory.create(inventoryData);
};

/**
 * Update inventory by ID
 * @param {string} id - Inventory ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated inventory document or null
 */
exports.update = async (id, updates) => {
	const inventory = await Inventory.findById(id).populate("productId");
	if (!inventory) return null;

	// Apply updates
	Object.keys(updates).forEach((key) => {
		if (updates[key] !== undefined) {
			inventory[key] = updates[key];
		}
	});

	return await inventory.save();
};

/**
 * Soft delete inventory (set isActive to false)
 * @param {string} id - Inventory ID
 * @returns {Promise<Object|null>} Updated inventory document or null
 */
exports.softDelete = async (id) => {
	const inventory = await Inventory.findById(id);
	if (!inventory) return null;

	inventory.isActive = false;
	return await inventory.save();
};

/**
 * Find populated inventory by ID
 * @param {string} id - Inventory ID
 * @returns {Promise<Object|null>} Populated inventory document or null
 */
exports.findByIdPopulated = async (id) => {
	return await Inventory.findById(id)
		.populate("storeId", "name location fullAddress")
		.populate("productId", "name sku productType brand");
};

/**
 * Find store by ID
 * @param {string} storeId - Store ID
 * @returns {Promise<Object|null>} Store document or null
 */
exports.findStoreById = async (storeId) => {
	return await Store.findById(storeId);
};

/**
 * Find product by ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object|null>} Product document or null
 */
exports.findProductById = async (productId) => {
	return await Product.findById(productId);
};

/**
 * Update store capacity
 * @param {string} storeId - Store ID
 * @param {number} newCapacity - New current capacity
 * @returns {Promise<Object|null>} Updated store document or null
 */
exports.updateStoreCapacity = async (storeId, newCapacity) => {
	return await Store.findByIdAndUpdate(
		storeId,
		{ currentCapacity: newCapacity },
		{ new: true }
	);
};

/**
 * Calculate total capacity used at a store
 * @param {string} storeId - Store ID
 * @returns {Promise<number>} Total capacity used
 */
exports.calculateStoreCapacity = async (storeId) => {
	return await Inventory.calculateStoreCapacity(storeId);
};
