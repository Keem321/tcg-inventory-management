/**
 * Store Routes
 * Defines API endpoints for store operations
 */

const express = require("express");
const storeController = require("../controllers/store.controller");
const { requireRole, requireStoreAccess } = require("../middleware/auth");
const { USER_ROLES } = require("../constants/enums");

const router = express.Router();

/**
 * GET /api/stores
 * List all stores
 * Authorization: All authenticated users
 */
router.get("/", storeController.getAllStores);

/**
 * GET /api/stores/:id
 * Get store by ID
 * Authorization: Partners (all stores), Managers/Employees (assigned store only)
 */
router.get("/:id", requireStoreAccess, storeController.getStoreById);

/**
 * POST /api/stores
 * Create new store
 * Authorization: Partners only
 */
router.post(
	"/",
	requireRole([USER_ROLES.PARTNER]),
	storeController.createStore
);

/**
 * PUT /api/stores/:id
 * Update store
 * Authorization: Partners (all stores), Managers (assigned store only)
 */
router.put(
	"/:id",
	requireRole([USER_ROLES.PARTNER, USER_ROLES.STORE_MANAGER]),
	requireStoreAccess,
	storeController.updateStore
);

/**
 * DELETE /api/stores/:id
 * Delete store
 * Authorization: Partners only
 */
router.delete(
	"/:id",
	requireRole([USER_ROLES.PARTNER]),
	storeController.deleteStore
);

module.exports = router;
