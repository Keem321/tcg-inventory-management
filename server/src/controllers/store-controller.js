/**
 * Store Controller
 * Handles HTTP request/response for store operations
 */

const storeService = require("../services/store-service");

/**
 * Get all stores
 */
exports.getAllStores = async (req, res) => {
	try {
		const stores = await storeService.getAllStores();
		res.json({ success: true, stores });
	} catch (error) {
		console.error("Get all stores error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching stores",
		});
	}
};

/**
 * GET /api/stores/:id
 * Get store by ID
 */
exports.getStoreById = async (req, res) => {
	try {
		const store = await storeService.getStoreById(req.params.id);
		res.json({ success: true, store });
	} catch (error) {
		console.error("Get store by ID error:", error);
		const statusCode = error.statusCode || 500;
		res.status(statusCode).json({
			success: false,
			message: error.message || "Error fetching store",
		});
	}
};

/**
 * POST /api/stores
 * Create new store
 */
exports.createStore = async (req, res) => {
	try {
		const store = await storeService.createStore(req.body);
		res.status(201).json({
			success: true,
			store,
			message: "Store created successfully",
		});
	} catch (error) {
		console.error("Create store error:", error);
		const statusCode = error.statusCode || 500;
		res.status(statusCode).json({
			success: false,
			message: error.message || "Error creating store",
		});
	}
};

/**
 * PUT /api/stores/:id
 * Update store
 */
exports.updateStore = async (req, res) => {
	try {
		const store = await storeService.updateStore(req.params.id, req.body);
		res.json({
			success: true,
			store,
			message: "Store updated successfully",
		});
	} catch (error) {
		console.error("Update store error:", error);
		const statusCode = error.statusCode || 500;
		res.status(statusCode).json({
			success: false,
			message: error.message || "Error updating store",
		});
	}
};

/**
 * DELETE /api/stores/:id
 * Delete store
 */
exports.deleteStore = async (req, res) => {
	try {
		await storeService.deleteStore(req.params.id);
		res.json({
			success: true,
			message: "Store deleted successfully",
		});
	} catch (error) {
		console.error("Delete store error:", error);
		const statusCode = error.statusCode || 500;
		res.status(statusCode).json({
			success: false,
			message: error.message || "Error deleting store",
		});
	}
};
