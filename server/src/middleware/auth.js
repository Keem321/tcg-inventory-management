/**
 * Authentication middleware
 * Protects routes and enforces role-based access control
 */

/**
 * Require authentication
 * Ensures user is logged in
 */
function requireAuth(req, res, next) {
	if (!req.session.userId) {
		return res.status(401).json({
			success: false,
			message: "Authentication required",
		});
	}
	next();
}

/**
 * Require specific role(s)
 * @param {string|string[]} roles - Required role(s)
 */
function requireRole(...roles) {
	return (req, res, next) => {
		if (!req.session.userId) {
			return res.status(401).json({
				success: false,
				message: "Authentication required",
			});
		}

		if (!roles.includes(req.session.role)) {
			return res.status(403).json({
				success: false,
				message: "Insufficient permissions",
			});
		}

		next();
	};
}

/**
 * Require partner role
 */
function requirePartner(req, res, next) {
	return requireRole("partner")(req, res, next);
}

/**
 * Require store manager or partner
 */
function requireManager(req, res, next) {
	return requireRole("store-manager", "partner")(req, res, next);
}

module.exports = {
	requireAuth,
	requireRole,
	requirePartner,
	requireManager,
};
