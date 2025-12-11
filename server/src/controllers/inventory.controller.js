/**
 * Inventory Controller
 * Handles HTTP request/response for inventory operations
 */

const inventoryService = require("../services/inventory.service");
const { sendErrorResponse } = require("../utils/errorHandler");

/**
 * Check for duplicate inventory entries at a store
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Check parameters
 * @param {string} req.body.storeId - Store ID
 * @param {string} req.body.productId - Product ID
 * @param {string} req.body.location - Location (floor/back)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with duplicate check results
 * @throws {400} If validation fails
 */
exports.checkDuplicate = async (req, res) => {
	try {
		const result = await inventoryService.checkDuplicate(req.body);
		res.json({ success: true, ...result });
	} catch (error) {
		sendErrorResponse(res, error, "Error checking duplicates", "[InventoryController] Check duplicate");
	}
};

/**
 * Get all inventory across all stores (Partner only)
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.location] - Filter by location (floor/back)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with inventory array
 */
exports.getAllInventory = async (req, res) => {
	try {
		const inventory = await inventoryService.getAllInventory(req.query);
		res.json({ success: true, inventory });
	} catch (error) {
		sendErrorResponse(res, error, "Error fetching inventory", "[InventoryController] Get all inventory");
	}
};

/**
 * Get inventory for a specific store
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - Store ID
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.location] - Filter by location (floor/back)
 * @param {string} [req.query.productId] - Filter by product ID
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with inventory array
 * @throws {404} If store not found
 * @throws {400} If invalid store ID
 */
exports.getInventoryByStore = async (req, res) => {
	try {
		const inventory = await inventoryService.getInventoryByStore(
			req.params.id,
			req.query
		);
		res.json({ success: true, inventory });
	} catch (error) {
		sendErrorResponse(res, error, "Error fetching inventory", "[InventoryController] Get store inventory");
	}
};

/**
 * Create new inventory item or merge with existing
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Inventory data
 * @param {string} req.body.storeId - Store ID
 * @param {string} req.body.productId - Product ID (for non-container inventory)
 * @param {string} req.body.location - Location (floor/back)
 * @param {number} req.body.quantity - Quantity
 * @param {Object} [req.body.cardContainer] - Container details for card storage
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with created/merged inventory
 * @throws {400} If validation fails or capacity exceeded
 */
exports.createInventory = async (req, res) => {
	try {
		const result = await inventoryService.createInventory(req.body);
		const statusCode = result.merged ? 200 : 201;
		res.status(statusCode).json({ success: true, ...result });
	} catch (error) {
		sendErrorResponse(res, error, "Error creating inventory", "[InventoryController] Create inventory");
	}
};

/**
 * Update existing inventory item
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - Inventory ID
 * @param {Object} req.body - Updated inventory data
 * @param {number} [req.body.quantity] - New quantity
 * @param {Object} [req.body.cardContainer] - Updated container details
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with updated inventory
 * @throws {404} If inventory not found
 * @throws {400} If validation fails or capacity exceeded
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
		sendErrorResponse(res, error, "Error updating inventory", "[InventoryController] Update inventory");
	}
};

/**
 * Delete inventory item (soft delete - sets isActive to false)
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - Inventory ID
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with success message
 * @throws {404} If inventory not found
 */
exports.deleteInventory = async (req, res) => {
	try {
		await inventoryService.deleteInventory(req.params.id);
		res.json({
			success: true,
			message: "Inventory removed successfully",
		});
	} catch (error) {
		sendErrorResponse(res, error, "Error deleting inventory", "[InventoryController] Delete inventory");
	}
};
