/**
 * Authentication middleware
 * Protects routes and enforces role-based access control
 */

const { USER_ROLES } = require("../constants/enums");
const { User } = require("../models/User");

/**
 * Helper: Normalize ObjectId to string for comparison
 * @param {ObjectId|string} id - The ID to normalize
 * @returns {string} - String representation of the ID
 */
function normalizeId(id) {
	return typeof id === "object" && id !== null ? id.toString() : String(id);
}

/**
 * Require authentication
 * Ensures user is logged in and attaches user to request
 */
async function requireAuth(req, res, next) {
	if (!req.session || !req.session.userId) {
		return res.status(401).json({
			success: false,
			message: "Authentication required",
		});
	}

	try {
		// Select all fields except passwordHash for security
		const user = await User.findById(req.session.userId).select(
			"-passwordHash"
		);
		
		if (!user) {
			// User was deleted but session still exists
			req.session.destroy();
			return res.status(401).json({
				success: false,
				message: "User not found",
			});
		}

		if (!user.isActive) {
			// User account was deactivated
			return res.status(403).json({
				success: false,
				message: "Account is inactive. Please contact administrator.",
			});
		}

		// Attach user to request (passwordHash excluded)
		req.user = user;
		next();
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Error authenticating user: " + error.message,
		});
	}
}

/**
 * Require specific role(s)
 * @param {string[]} roles - Required role(s)
 * NOTE: This middleware requires requireAuth to be called first
 */
function requireRole(roles) {
	return (req, res, next) => {
		// This should never happen if requireAuth is used first
		if (!req.user) {
			return res.status(401).json({
				success: false,
				message: "Authentication required",
			});
		}

		if (!roles.includes(req.user.role)) {
			return res.status(403).json({
				success: false,
				message: "Insufficient permissions",
			});
		}

		next();
	};
}

/**
 * Require access to a specific store
 * Partners can access any store, managers and employees can only access their assigned store
 * NOTE: This middleware requires requireAuth to be called first
 *
 * This checks the store ID from req.params.id OR req.body.storeId
 */
function requireStoreAccess(req, res, next) {
	if (!req.user) {
		return res.status(401).json({
			success: false,
			message: "Authentication required",
		});
	}

	// Partners can access any store
	if (req.user.role === USER_ROLES.PARTNER) {
		return next();
	}

	// Store managers and employees can only access their assigned store
	if (
		req.user.role === USER_ROLES.STORE_MANAGER ||
		req.user.role === USER_ROLES.EMPLOYEE
	) {
		// Check params.id first (for GET/PUT/DELETE), then body.storeId (for POST)
		const requestedStoreId = req.params.id || req.body.storeId;

		if (!requestedStoreId) {
			return res.status(400).json({
				success: false,
				message: "Store ID is required",
			});
		}

		if (!req.user.assignedStoreId) {
			return res.status(403).json({
				success: false,
				message: "No store assigned to your account",
			});
		}

		// Use helper to normalize IDs for comparison
		if (normalizeId(req.user.assignedStoreId) === normalizeId(requestedStoreId)) {
			return next();
		} else {
			return res.status(403).json({
				success: false,
				message: "You can only access your assigned store",
			});
		}
	}

	// All other roles denied
	return res.status(403).json({
		success: false,
		message: "Insufficient permissions",
	});
}

/**
 * Require partner role
 */
function requirePartner(req, res, next) {
	return requireRole([USER_ROLES.PARTNER])(req, res, next);
}

/**
 * Require store manager or partner
 */
function requireManager(req, res, next) {
	return requireRole([USER_ROLES.STORE_MANAGER, USER_ROLES.PARTNER])(
		req,
		res,
		next
	);
}

module.exports = {
	requireAuth,
	requireRole,
	requireStoreAccess,
	requirePartner,
	requireManager,
};
