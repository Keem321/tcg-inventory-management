/**
 * Inventory Routes
 * Handles inventory viewing and management operations
 */

const express = require("express");
const inventoryController = require("../controllers/inventory-controller");
const { requireRole, requireStoreAccess } = require("../middleware/auth");
const { USER_ROLES } = require("../constants/enums");

const router = express.Router();

// Routes that don't need store access control (must be defined BEFORE applying middleware)

/**
 * POST /api/inventory/check-duplicate
 * Check if inventory already exists for a product at a store
 * Body: { storeId, productId, location }
 * Note: This validates storeId internally but doesn't enforce store access restrictions
 */
router.post("/check-duplicate", inventoryController.checkDuplicate);

/**
 * GET /api/inventory
 * Get all inventory across all stores (partners only)
 * Query params:
 *   - location: filter by location (floor, back)
 * Note: Partners-only route, no store access restriction needed
 */
router.get(
	"/",
	requireRole([USER_ROLES.PARTNER]),
	inventoryController.getAllInventory
);

/**
 *
 * Apply store access control to all remaining routes
 * This ensures non-partners can only access their assigned store
 *
 */
router.use(requireStoreAccess);

/**
 * GET /api/inventory/store/:id
 * Get inventory for a specific store
 * Query params:
 *   - location: filter by location (floor, back)
 *
 * Authorization:
 *   - Partners can access any store
 *   - Store managers can only access their assigned store
 *   - Employees can only access their assigned store
 */
router.get("/store/:id", inventoryController.getInventoryByStore);

/**
 * POST /api/inventory
 * Create new inventory item
 * Body: { storeId, productId, quantity, location, minStockLevel, notes }
 *
 * Authorization:
 *   - Partners can add to any store
 *   - Store managers can add to their assigned store
 */
router.post(
	"/",
	requireRole([USER_ROLES.PARTNER, USER_ROLES.STORE_MANAGER]),
	inventoryController.createInventory
);

/**
 * PUT /api/inventory/:id
 * Update inventory item
 * Body: { quantity, location, minStockLevel, notes }
 *
 * Authorization:
 *   - Partners can update any inventory
 *   - Store managers can update inventory at their assigned store
 */
router.put(
	"/:id",
	requireRole([USER_ROLES.PARTNER, USER_ROLES.STORE_MANAGER]),
	inventoryController.updateInventory
);

/**
 * DELETE /api/inventory/:id
 * Delete inventory item (soft delete - sets isActive to false)
 *
 * Authorization:
 *   - Partners can delete any inventory
 *   - Store managers can delete inventory at their assigned store
 */
router.delete(
	"/:id",
	requireRole([USER_ROLES.PARTNER, USER_ROLES.STORE_MANAGER]),
	inventoryController.deleteInventory
);

module.exports = router;
