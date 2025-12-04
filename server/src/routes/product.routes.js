/**
 * Product Routes
 * Defines API endpoints for product operations
 */

const express = require("express");
const productController = require("../controllers/product.controller");
const { requireRole } = require("../middleware/auth");
const { USER_ROLES } = require("../constants/enums");

const router = express.Router();

// All product routes are partner-only
router.use(requireRole([USER_ROLES.PARTNER]));

/**
 * GET /api/products
 * Get all products with optional filtering
 * Query params: productType, brand, isActive, search
 * Authorization: Partners only
 */
router.get("/", productController.getAllProducts);

/**
 * GET /api/products/:id
 * Get product by ID with inventory details
 * Authorization: Partners only
 */
router.get("/:id", productController.getProductById);

/**
 * POST /api/products
 * Create new product
 * Authorization: Partners only
 */
router.post("/", productController.createProduct);

/**
 * PUT /api/products/:id
 * Update existing product
 * Authorization: Partners only
 */
router.put("/:id", productController.updateProduct);

/**
 * DELETE /api/products/:id
 * Delete product (only if no inventory exists)
 * Authorization: Partners only
 */
router.delete("/:id", productController.deleteProduct);

module.exports = router;
