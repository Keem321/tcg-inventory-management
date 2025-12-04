/**
 * Product Controller
 * Handles HTTP request/response for product operations
 */

const productService = require("../services/product.service");

/**
 * Get all products with optional filtering
 */
exports.getAllProducts = async (req, res) => {
	try {
		const products = await productService.getAllProducts(req.query);
		res.json({ success: true, products });
	} catch (error) {
		console.error("Get products error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching products",
		});
	}
};

/**
 * Get product by ID with inventory details
 */
exports.getProductById = async (req, res) => {
	try {
		const result = await productService.getProductById(req.params.id);
		res.json({ success: true, ...result });
	} catch (error) {
		console.error("Get product error:", error);
		const statusCode = error.statusCode || 500;
		res.status(statusCode).json({
			success: false,
			message: error.message || "Error fetching product",
		});
	}
};

/**
 * Create new product
 */
exports.createProduct = async (req, res) => {
	try {
		const product = await productService.createProduct(req.body);
		res.status(201).json({ success: true, product });
	} catch (error) {
		console.error("Create product error:", error);
		const statusCode = error.statusCode || 500;
		res.status(statusCode).json({
			success: false,
			message: error.message || "Error creating product",
		});
	}
};

/**
 * Update existing product
 */
exports.updateProduct = async (req, res) => {
	try {
		const product = await productService.updateProduct(req.params.id, req.body);
		res.json({ success: true, product });
	} catch (error) {
		console.error("Update product error:", error);
		const statusCode = error.statusCode || 500;
		res.status(statusCode).json({
			success: false,
			message: error.message || "Error updating product",
		});
	}
};

/**
 * Delete product
 */
exports.deleteProduct = async (req, res) => {
	try {
		await productService.deleteProduct(req.params.id);
		res.json({ success: true, message: "Product deleted successfully" });
	} catch (error) {
		console.error("Delete product error:", error);
		const statusCode = error.statusCode || 500;
		res.status(statusCode).json({
			success: false,
			message: error.message || "Error deleting product",
		});
	}
};
