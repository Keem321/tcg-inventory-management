/**
 * Error Handler Utility
 * @module utils/errorHandler
 */

/**
 * Send standardized error response
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {string} defaultMessage - Default error message if error.message not available
 * @param {string} [logPrefix] - Optional prefix for console.error logging
 */
exports.sendErrorResponse = (res, error, defaultMessage, logPrefix = "") => {
	// Log error with context
	if (logPrefix) {
		console.error(`${logPrefix} error:`, error);
	} else {
		console.error("Error:", error);
	}

	// Extract status code and message from error
	const statusCode = error.statusCode || 500;
	const message = error.message || defaultMessage;

	// Send standardized error response
	res.status(statusCode).json({
		success: false,
		message,
	});
};
