/**
 * Transfer Request Controller
 * Handles HTTP request/response for transfer request operations
 */

const transferRequestService = require("../services/transferRequest.service");

/**
 * Create new transfer request
 */
exports.createTransferRequest = async (req, res) => {
	try {
		const transferRequest = await transferRequestService.createTransferRequest(
			req.body,
			req.user
		);
		res.status(201).json({ success: true, transferRequest });
	} catch (error) {
		console.error("Create transfer request error:", error);
		const statusCode = error.statusCode || 500;
		res.status(statusCode).json({
			success: false,
			message: error.message || "Error creating transfer request",
		});
	}
};

/**
 * Get all transfer requests
 */
exports.getAllTransferRequests = async (req, res) => {
	try {
		const transferRequests =
			await transferRequestService.getAllTransferRequests(req.user, req.query);
		res.json({ success: true, transferRequests });
	} catch (error) {
		console.error("Get transfer requests error:", error);
		const statusCode = error.statusCode || 500;
		res.status(statusCode).json({
			success: false,
			message: error.message || "Error fetching transfer requests",
		});
	}
};

/**
 * Get transfer request by ID
 */
exports.getTransferRequestById = async (req, res) => {
	try {
		const transferRequest = await transferRequestService.getTransferRequestById(
			req.params.id,
			req.user
		);
		res.json({ success: true, transferRequest });
	} catch (error) {
		console.error("Get transfer request error:", error);
		const statusCode = error.statusCode || 500;
		res.status(statusCode).json({
			success: false,
			message: error.message || "Error fetching transfer request",
		});
	}
};

/**
 * Update transfer request status
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
		console.error("Update transfer status error:", error);
		const statusCode = error.statusCode || 500;
		res.status(statusCode).json({
			success: false,
			message: error.message || "Error updating transfer status",
		});
	}
};

/**
 * Delete transfer request (soft delete)
 */
exports.deleteTransferRequest = async (req, res) => {
	try {
		const transferRequest = await transferRequestService.deleteTransferRequest(
			req.params.id,
			req.user
		);
		res.json({ success: true, transferRequest });
	} catch (error) {
		console.error("Delete transfer request error:", error);
		const statusCode = error.statusCode || 500;
		res.status(statusCode).json({
			success: false,
			message: error.message || "Error deleting transfer request",
		});
	}
};
