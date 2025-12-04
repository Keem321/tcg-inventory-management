/**
 * Central API Router
 * Aggregates all route modules and applies middleware
 */

const express = require("express");
const { requireAuth } = require("../middleware/auth");

// Import individual route modules
const authRoutes = require("./auth");
const storeRoutes = require("./store.routes");
const inventoryRoutes = require("./inventory.routes");
const productRoutes = require("./product.routes");

const router = express.Router();

// Public routes (no authentication required)
router.use("/auth", authRoutes);

// Apply authentication middleware to all routes below
router.use(requireAuth);

// Protected routes (authentication required)
router.use("/stores", storeRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/products", productRoutes);

// API health check
router.get("/health", (req, res) => {
	res.json({
		status: "ok",
		message: "Server is running",
		timestamp: new Date().toISOString(),
	});
});

module.exports = router;
