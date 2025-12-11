/**
 * Product Controller
 * Handles HTTP request/response for product operations
 */

const productService = require("../services/product.service");
const { sendErrorResponse } = require("../utils/errorHandler");

/**
 * Get all products with optional filtering
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters for filtering (isActive, brand, productType)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with products array
 */
exports.getAllProducts = async (req, res) => {
	try {
		const products = await productService.getAllProducts(req.query);
		res.json({ success: true, products });
	} catch (error) {
		sendErrorResponse(res, error, "Error fetching products", "[ProductController] Get all products");
	}
};

/**
 * Get all unique brands from active products
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with brands array
 */
exports.getAllBrands = async (req, res) => {
	try {
		const brands = await productService.getAllBrands();
		res.json({ success: true, brands });
	} catch (error) {
		sendErrorResponse(res, error, "Error fetching brands", "[ProductController] Get all brands");
	}
};

/**
 * Get product by ID with inventory details across all stores
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - Product ID
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with product and inventory details
 * @throws {404} If product not found
 */
exports.getProductById = async (req, res) => {
	try {
		const result = await productService.getProductById(req.params.id);
		res.json({ success: true, ...result });
	} catch (error) {
		sendErrorResponse(res, error, "Error fetching product", "[ProductController] Get product by ID");
	}
};

/**
 * Create new product
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Product data
 * @param {string} req.body.sku - Product SKU (must be unique)
 * @param {string} req.body.name - Product name
 * @param {string} req.body.productType - Product type (singleCard, boosterPack, etc.)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with created product
 * @throws {400} If SKU already exists or validation fails
 */
exports.createProduct = async (req, res) => {
	try {
		const product = await productService.createProduct(req.body);
		res.status(201).json({ success: true, product });
	} catch (error) {
		sendErrorResponse(res, error, "Error creating product", "[ProductController] Create product");
	}
};

/**
 * Update existing product
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - Product ID
 * @param {Object} req.body - Updated product data
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with updated product
 * @throws {404} If product not found
 * @throws {400} If SKU conflict or validation fails
 */
exports.updateProduct = async (req, res) => {
	try {
		const product = await productService.updateProduct(req.params.id, req.body);
		res.json({ success: true, product });
	} catch (error) {
		sendErrorResponse(res, error, "Error updating product", "[ProductController] Update product");
	}
};

/**
 * Delete product (soft delete - sets isActive to false)
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - Product ID
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with success message
 * @throws {404} If product not found
 */
exports.deleteProduct = async (req, res) => {
	try {
		await productService.deleteProduct(req.params.id);
		res.json({ success: true, message: "Product deleted successfully" });
	} catch (error) {
		sendErrorResponse(res, error, "Error deleting product", "[ProductController] Delete product");
	}
};
