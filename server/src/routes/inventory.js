/**
 * Inventory routes
 * Handles inventory viewing and management operations
 */

const express = require("express");
const { Inventory } = require("../models/Inventory");
const {
	requireAuth,
	requireRole,
	requireStoreAccess,
} = require("../middleware/auth");
const mongoose = require("mongoose");
const { USER_ROLES, LOCATIONS } = require("../constants/enums");

const router = express.Router();

/**
 * GET /api/inventory
 * Get all inventory across all stores (partners only)
 * Query params:
 *   - location: filter by location (floor, back)
 */
router.get(
	"/",
	requireAuth,
	requireRole([USER_ROLES.PARTNER]),
	async (req, res) => {
		try {
			const { location } = req.query;

			// Build query
			const query = { isActive: true };
			if (location && [LOCATIONS.FLOOR, LOCATIONS.BACK].includes(location)) {
				query.location = location;
			}

			const inventory = await Inventory.find(query)
				.populate("storeId", "name location fullAddress")
				.populate("productId", "name sku productType brand")
				.sort({ storeId: 1, location: 1, productId: 1 });

			res.json({
				success: true,
				inventory,
			});
		} catch (error) {
			console.error("Get all inventory error:", error);
			res.status(500).json({
				success: false,
				message: "Error fetching inventory",
			});
		}
	}
);

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
router.get(
	"/store/:id",
	requireAuth,
	requireRole([
		USER_ROLES.PARTNER,
		USER_ROLES.STORE_MANAGER,
		USER_ROLES.EMPLOYEE,
	]),
	requireStoreAccess,
	async (req, res) => {
		try {
			const { location } = req.query;

			// Validate ObjectId format
			if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
				return res.status(400).json({
					success: false,
					message: "Invalid store ID format",
				});
			}

			// Build query
			const query = {
				storeId: req.params.id,
				isActive: true,
			};

			if (location && [LOCATIONS.FLOOR, LOCATIONS.BACK].includes(location)) {
				query.location = location;
			}

			const inventory = await Inventory.find(query)
				.populate("storeId", "name location fullAddress")
				.populate("productId", "name sku productType brand")
				.sort({ location: 1, productId: 1 });

			res.json({
				success: true,
				inventory,
			});
		} catch (error) {
			console.error("Get store inventory error:", error);
			res.status(500).json({
				success: false,
				message: "Error fetching inventory",
			});
		}
	}
);

module.exports = router;
