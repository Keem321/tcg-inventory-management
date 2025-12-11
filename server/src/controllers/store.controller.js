/**
 * Store Controller
 * Handles HTTP request/response for store operations
 */

const storeService = require("../services/store.service");
const { sendErrorResponse } = require("../utils/errorHandler");

/**
 * Get all active stores
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with stores array
 */
exports.getAllStores = async (req, res) => {
	try {
		const stores = await storeService.getAllStores();
		res.json({ success: true, stores });
	} catch (error) {
		sendErrorResponse(res, error, "Error fetching stores", "[StoreController] Get all stores");
	}
};

/**
 * Get store by ID with current capacity
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - Store ID
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with store details
 * @throws {404} If store not found
 * @throws {400} If invalid store ID
 */
exports.getStoreById = async (req, res) => {
	try {
		const store = await storeService.getStoreById(req.params.id);
		res.json({ success: true, store });
	} catch (error) {
		sendErrorResponse(res, error, "Error fetching store", "[StoreController] Get store by ID");
	}
};

/**
 * Create new store
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Store data
 * @param {string} req.body.name - Store name
 * @param {Object} req.body.location - Store location details
 * @param {number} req.body.maxCapacity - Maximum storage capacity
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with created store
 * @throws {400} If validation fails
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
		sendErrorResponse(res, error, "Error creating store", "[StoreController] Create store");
	}
};

/**
 * Update existing store
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - Store ID
 * @param {Object} req.body - Updated store data
 * @param {string} [req.body.name] - Updated store name
 * @param {number} [req.body.maxCapacity] - Updated maximum capacity
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with updated store
 * @throws {404} If store not found
 * @throws {400} If new capacity is less than current inventory
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
		sendErrorResponse(res, error, "Error updating store", "[StoreController] Update store");
	}
};

/**
 * Delete store (soft delete - sets isActive to false)
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - Store ID
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with success message
 * @throws {404} If store not found
 * @throws {400} If store has active inventory
 */
exports.deleteStore = async (req, res) => {
	try {
		await storeService.deleteStore(req.params.id);
		res.json({
			success: true,
			message: "Store deleted successfully",
		});
	} catch (error) {
		sendErrorResponse(res, error, "Error deleting store", "[StoreController] Delete store");
	}
};
