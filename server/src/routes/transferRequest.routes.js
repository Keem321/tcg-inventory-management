/**
 * Transfer Request Routes
 * Handles inventory transfer operations between stores
 */

const express = require("express");
const transferRequestController = require("../controllers/transferRequest.controller");
const { requireRole } = require("../middleware/auth");
const { USER_ROLES } = require("../constants/enums");

const router = express.Router();

/**
 * All transfer request routes require at least store-manager role
 * Employees cannot access transfer functionality
 */
router.use(requireRole([USER_ROLES.STORE_MANAGER, USER_ROLES.PARTNER]));

/**
 * POST /api/transfer-requests
 * Create a new transfer request
 * Body: { fromStoreId, toStoreId, items: [{ inventoryId, productId, requestedQuantity, cardItems? }], notes? }
 *
 * Authorization:
 *   - Managers: Can create requests involving their store
 *   - Partners: Can create any request
 */
router.post("/", transferRequestController.createTransferRequest);

/**
 * GET /api/transfer-requests
 * Get all transfer requests (filtered by user permissions)
 * Query params:
 *   - status: filter by status (open, requested, sent, complete, closed)
 *
 * Authorization:
 *   - Managers: See only requests involving their store
 *   - Partners: See all requests
 */
router.get("/", transferRequestController.getAllTransferRequests);

/**
 * GET /api/transfer-requests/:id
 * Get a specific transfer request by ID
 *
 * Authorization:
 *   - Managers: Can view requests involving their store
 *   - Partners: Can view any request
 */
router.get("/:id", transferRequestController.getTransferRequestById);

/**
 * PATCH /api/transfer-requests/:id/status
 * Update the status of a transfer request
 * Body: { status, closeReason? }
 *
 * Status transitions:
 *   - open → requested: Manager from destination store submits request
 *   - requested → sent: Manager from source store ships items
 *   - sent → complete: Manager from destination store confirms receipt
 *   - any → closed: Partner cancels request
 *
 * Authorization:
 *   - Managers: Can only transition requests involving their store (based on workflow)
 *   - Partners: Can transition any request (except complete → other statuses)
 */
router.patch("/:id/status", transferRequestController.updateTransferStatus);

/**
 * DELETE /api/transfer-requests/:id
 * Delete a transfer request (soft delete)
 * Can only delete requests with status 'open' or 'closed'
 *
 * Authorization:
 *   - Partners only
 */
router.delete(
	"/:id",
	requireRole([USER_ROLES.PARTNER]),
	transferRequestController.deleteTransferRequest
);

module.exports = router;
