/**
 * Inventory Controller
 * Handles HTTP request/response for inventory operations
 */

const inventoryService = require("../services/inventory-service");

/**
 * Check for duplicate inventory
 */
exports.checkDuplicate = async (req, res) => {
	try {
		const result = await inventoryService.checkDuplicate(req.body);
		res.json({ success: true, ...result });
	} catch (error) {
		console.error("Check duplicate error:", error);
		const statusCode = error.statusCode || 500;
		res.status(statusCode).json({
			success: false,
			message: error.message || "Error checking duplicates",
		});
	}
};

/**
 * Get all inventory
 */
exports.getAllInventory = async (req, res) => {
	try {
		const inventory = await inventoryService.getAllInventory(req.query);
		res.json({ success: true, inventory });
	} catch (error) {
		console.error("Get all inventory error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching inventory",
		});
	}
};

/**
 * Get inventory by store
 */
exports.getInventoryByStore = async (req, res) => {
	try {
		const inventory = await inventoryService.getInventoryByStore(
			req.params.id,
			req.query
		);
		res.json({ success: true, inventory });
	} catch (error) {
		console.error("Get store inventory error:", error);
		const statusCode = error.statusCode || 500;
		res.status(statusCode).json({
			success: false,
			message: error.message || "Error fetching inventory",
		});
	}
};

/**
 * Create new inventory
 */
exports.createInventory = async (req, res) => {
	try {
		const result = await inventoryService.createInventory(req.body);
		const statusCode = result.merged ? 200 : 201;
		res.status(statusCode).json({ success: true, ...result });
	} catch (error) {
		console.error("Create inventory error:", error);
		const statusCode = error.statusCode || 500;
		res.status(statusCode).json({
			success: false,
			message: error.message || "Error creating inventory",
		});
	}
};

/**
 * Update inventory
 */
exports.updateInventory = async (req, res) => {
	try {
		const inventory = await inventoryService.updateInventory(
			req.params.id,
			req.body
		);
		res.json({
			success: true,
			inventory,
			message: "Inventory updated successfully",
		});
	} catch (error) {
		console.error("Update inventory error:", error);
		const statusCode = error.statusCode || 500;
		res.status(statusCode).json({
			success: false,
			message: error.message || "Error updating inventory",
		});
	}
};

/**
 * Delete inventory
 */
exports.deleteInventory = async (req, res) => {
	try {
		await inventoryService.deleteInventory(req.params.id);
		res.json({
			success: true,
			message: "Inventory removed successfully",
		});
	} catch (error) {
		console.error("Delete inventory error:", error);
		const statusCode = error.statusCode || 500;
		res.status(statusCode).json({
			success: false,
			message: error.message || "Error deleting inventory",
		});
	}
};
