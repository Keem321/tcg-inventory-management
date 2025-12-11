/**
 * Transfer Request Controller
 * Handles HTTP request/response for transfer request operations
 */

const transferRequestService = require("../services/transferRequest.service");
const { sendErrorResponse } = require("../utils/errorHandler");

/**
 * Create new transfer request
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Transfer request data
 * @param {string} req.body.fromStoreId - Source store ID
 * @param {string} req.body.toStoreId - Destination store ID
 * @param {Array} req.body.items - Array of items to transfer
 * @param {string} [req.body.notes] - Optional notes
 * @param {Object} req.user - Current authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with created transfer request
 * @throws {400} If validation fails or insufficient inventory
 * @throws {403} If user lacks permission
 */
exports.createTransferRequest = async (req, res) => {
	try {
		const transferRequest = await transferRequestService.createTransferRequest(
			req.body,
			req.user
		);
		res.status(201).json({ success: true, transferRequest });
	} catch (error) {
		sendErrorResponse(res, error, "Error creating transfer request", "[TransferRequestController] Create transfer request");
	}
};

/**
 * Get all transfer requests filtered by user permissions
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.status] - Filter by status (open, requested, sent, complete, closed)
 * @param {string} [req.query.storeId] - Filter by store ID (partners only)
 * @param {Object} req.user - Current authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with transfer requests array
 * @throws {403} If user lacks permission
 */
exports.getAllTransferRequests = async (req, res) => {
	try {
		const transferRequests =
			await transferRequestService.getAllTransferRequests(req.user, req.query);
		res.json({ success: true, transferRequests });
	} catch (error) {
		sendErrorResponse(res, error, "Error fetching transfer requests", "[TransferRequestController] Get transfer requests");
	}
};

/**
 * Get transfer request by ID with full details
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - Transfer request ID
 * @param {Object} req.user - Current authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with transfer request details
 * @throws {404} If transfer request not found
 * @throws {403} If user lacks permission to view this request
 */
exports.getTransferRequestById = async (req, res) => {
	try {
		const transferRequest = await transferRequestService.getTransferRequestById(
			req.params.id,
			req.user
		);
		res.json({ success: true, transferRequest });
	} catch (error) {
		sendErrorResponse(res, error, "Error fetching transfer request", "[TransferRequestController] Get transfer request");
	}
};

/**
 * Update transfer request status with state transitions
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - Transfer request ID
 * @param {Object} req.body - Update data
 * @param {string} req.body.status - New status (requested, sent, complete, closed)
 * @param {string} [req.body.closeReason] - Reason if closing
 * @param {Object} req.user - Current authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with updated transfer request
 * @throws {400} If invalid status transition
 * @throws {403} If user lacks permission for this transition
 * @throws {404} If transfer request not found
 */
exports.updateTransferStatus = async (req, res) => {
	try {
		const { status, closeReason } = req.body;
		const transferRequest = await transferRequestService.updateTransferStatus(
			req.params.id,
			status,
			req.user,
			{ closeReason }
		);
		res.json({ success: true, transferRequest });
	} catch (error) {
		sendErrorResponse(res, error, "Error updating transfer status", "[TransferRequestController] Update transfer status");
	}
};

/**
 * Delete transfer request (soft delete - sets isActive to false)
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - Transfer request ID
 * @param {Object} req.user - Current authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with deleted transfer request
 * @throws {404} If transfer request not found
 * @throws {403} If user lacks permission (partners only)
 */
exports.deleteTransferRequest = async (req, res) => {
	try {
		const transferRequest = await transferRequestService.deleteTransferRequest(
			req.params.id,
			req.user
		);
		res.json({ success: true, transferRequest });
	} catch (error) {
		sendErrorResponse(res, error, "Error deleting transfer request", "[TransferRequestController] Delete transfer request");
	}
};
