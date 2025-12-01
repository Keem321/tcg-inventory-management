/**
 * Authentication middleware
 * Protects routes and enforces role-based access control
 */

const { User } = require("../models/User");

/**
 * Require authentication
 * Ensures user is logged in and attaches user to request
 */
async function requireAuth(req, res, next) {
	if (!req.session.userId) {
		return res.status(401).json({
			success: false,
			message: "Authentication required",
		});
	}

	try {
		const user = await User.findById(req.session.userId);
		if (!user) {
			return res.status(401).json({
				success: false,
				message: "User not found",
			});
		}

		req.user = user;
		next();
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Error authenticating user",
		});
	}
}

/**
 * Require specific role(s)
 * @param {string[]} roles - Required role(s)
 */
function requireRole(roles) {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(403).json({
				success: false,
				message: "Insufficient permissions",
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
 * Partners can access any store, managers can only access their assigned store
 */
function requireStoreAccess(req, res, next) {
	if (!req.user) {
		return res.status(401).json({
			success: false,
			message: "Authentication required",
		});
	}

	// Partners can access any store
	if (req.user.role === "partner") {
		return next();
	}

	// Store managers can only access their assigned store
	if (req.user.role === "store-manager") {
		const requestedStoreId = req.params.id;
		const assignedStoreId =
			typeof req.user.assignedStoreId === "object"
				? req.user.assignedStoreId.toString()
				: req.user.assignedStoreId;

		if (assignedStoreId === requestedStoreId) {
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
	return requireRole(["partner"])(req, res, next);
}

/**
 * Require store manager or partner
 */
function requireManager(req, res, next) {
	return requireRole(["store-manager", "partner"])(req, res, next);
}

module.exports = {
	requireAuth,
	requireRole,
	requireStoreAccess,
	requirePartner,
	requireManager,
};
