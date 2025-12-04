/**
 * Product Repository
 * Handles all database operations for products
 */

const { Product } = require("../models/Product");
const { Inventory } = require("../models/Inventory");

/**
 * Find all products with optional filters
 * @param {Object} filters - Query filters
 * @param {string} searchText - Text search query
 * @returns {Promise<Array>} Array of product documents
 */
exports.findAll = async (filters = {}, searchText = null) => {
	if (searchText) {
		return await Product.find({
			...filters,
			$text: { $search: searchText },
		})
			.select("-__v")
			.sort({ score: { $meta: "textScore" } });
	}

	return await Product.find(filters).select("-__v").sort({ brand: 1, name: 1 });
};

/**
 * Find product by ID
 * @param {string} id - Product ID
 * @returns {Promise<Object|null>} Product document or null
 */
exports.findById = async (id) => {
	return await Product.findById(id).select("-__v");
};

/**
 * Find product by SKU
 * @param {string} sku - Product SKU
 * @returns {Promise<Object|null>} Product document or null
 */
exports.findBySku = async (sku) => {
	return await Product.findOne({ sku });
};

/**
 * Create new product
 * @param {Object} productData - Product data
 * @returns {Promise<Object>} Created product document
 */
exports.create = async (productData) => {
	const product = new Product(productData);
	return await product.save();
};

/**
 * Update product by ID
 * @param {string} id - Product ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated product document or null
 */
exports.update = async (id, updates) => {
	const product = await Product.findById(id);
	if (!product) return null;

	// Apply updates
	Object.keys(updates).forEach((key) => {
		if (updates[key] !== undefined) {
			product[key] = updates[key];
		}
	});

	return await product.save();
};

/**
 * Delete product by ID (hard delete)
 * @param {string} id - Product ID
 * @returns {Promise<Object|null>} Deleted product document or null
 */
exports.delete = async (id) => {
	return await Product.findByIdAndDelete(id);
};

/**
 * Count inventory records for a product
 * @param {string} productId - Product ID
 * @returns {Promise<number>} Number of inventory records
 */
exports.countInventory = async (productId) => {
	return await Inventory.countDocuments({ productId });
};

/**
 * Find inventory for a product across all stores
 * @param {string} productId - Product ID
 * @returns {Promise<Array>} Array of inventory documents
 */
exports.findInventoryByProduct = async (productId) => {
	return await Inventory.find({
		productId,
		isActive: true,
	})
		.populate("storeId", "name location")
		.select("storeId quantity location cardContainer");
};

/**
 * Check if product exists
 * @param {string} id - Product ID
 * @returns {Promise<boolean>} True if product exists
 */
exports.exists = async (id) => {
	const count = await Product.countDocuments({ _id: id });
	return count > 0;
};
