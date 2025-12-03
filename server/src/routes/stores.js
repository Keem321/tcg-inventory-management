/**
 * Store routes
 * Handles store CRUD operations (Warehouse Management)
 */

const express = require("express");
const { Store } = require("../models/Store");
const { User } = require("../models/User");
const {
	requireAuth,
	requireRole,
	requireStoreAccess,
} = require("../middleware/auth");
const mongoose = require("mongoose");
const { USER_ROLES } = require("../constants/enums");

const router = express.Router();

/**
 * GET /api/stores
 * List all stores (partners and managers only)
 */
router.get(
	"/",
	requireAuth,
	requireRole([USER_ROLES.PARTNER, USER_ROLES.STORE_MANAGER]),
	async (req, res) => {
		try {
			const stores = await Store.find().sort({ name: 1 });

			res.json({
				success: true,
				stores: stores.map((store) => ({
					_id: store._id,
					name: store.name,
					location: store.location,
					fullAddress: store.fullAddress,
					maxCapacity: store.maxCapacity,
					currentCapacity: store.currentCapacity,
					isActive: store.isActive,
				})),
			});
		} catch (error) {
			console.error("List stores error:", error);
			res.status(500).json({
				success: false,
				message: "Error fetching stores",
			});
		}
	}
);

/**
 * GET /api/stores/:id
 * Get store by ID (partners can view any, managers only their assigned store)
 */
router.get(
	"/:id",
	requireAuth,
	requireRole([USER_ROLES.PARTNER, USER_ROLES.STORE_MANAGER]),
	requireStoreAccess,
	async (req, res) => {
		try {
			// Validate ObjectId format
			if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
				return res.status(400).json({
					success: false,
					message: "Invalid store ID format",
				});
			}

			const store = await Store.findById(req.params.id);

			if (!store) {
				return res.status(404).json({
					success: false,
					message: "Store not found",
				});
			}

			res.json({
				success: true,
				store: {
					_id: store._id,
					name: store.name,
					location: store.location,
					fullAddress: store.fullAddress,
					maxCapacity: store.maxCapacity,
					currentCapacity: store.currentCapacity,
					isActive: store.isActive,
				},
			});
		} catch (error) {
			console.error("Get store error:", error);
			res.status(500).json({
				success: false,
				message: "Error fetching store",
			});
		}
	}
);

/**
 * POST /api/stores
 * Create new store (partners only)
 */
router.post(
	"/",
	requireAuth,
	requireRole([USER_ROLES.PARTNER]),
	async (req, res) => {
		try {
			const { name, location, maxCapacity } = req.body;

			// Validate required fields
			if (!name || !location || !maxCapacity) {
				return res.status(400).json({
					success: false,
					message: "Missing required fields: name, location, maxCapacity",
				});
			}

			// Validate location fields
			if (
				!location.address ||
				!location.city ||
				!location.state ||
				!location.zipCode
			) {
				return res.status(400).json({
					success: false,
					message:
						"Missing required location fields: address, city, state, zipCode",
				});
			}

			// Validate maxCapacity
			if (maxCapacity <= 0) {
				return res.status(400).json({
					success: false,
					message: "Max capacity must be greater than 0",
				});
			}

			const store = new Store({
				name,
				location,
				maxCapacity,
			});

			await store.save();

			res.status(201).json({
				success: true,
				store: {
					_id: store._id,
					name: store.name,
					location: store.location,
					fullAddress: store.fullAddress,
					maxCapacity: store.maxCapacity,
					currentCapacity: store.currentCapacity,
					isActive: store.isActive,
				},
			});
		} catch (error) {
			console.error("Create store error:", error);
			res.status(400).json({
				success: false,
				message: error.message || "Error creating store",
			});
		}
	}
);

/**
 * PUT /api/stores/:id
 * Update store (partners can update any, managers only their assigned store)
 */
router.put(
	"/:id",
	requireAuth,
	requireRole([USER_ROLES.PARTNER, USER_ROLES.STORE_MANAGER]),
	requireStoreAccess,
	async (req, res) => {
		try {
			// Validate ObjectId format
			if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
				return res.status(400).json({
					success: false,
					message: "Invalid store ID format",
				});
			}

			const store = await Store.findById(req.params.id);

			if (!store) {
				return res.status(404).json({
					success: false,
					message: "Store not found",
				});
			}

			// Extract allowed update fields (exclude currentCapacity - that's managed by inventory)
			const { name, location, maxCapacity } = req.body;

			// Validate if provided
			if (maxCapacity !== undefined && maxCapacity <= 0) {
				return res.status(400).json({
					success: false,
					message: "Max capacity must be greater than 0",
				});
			}

			// Update fields
			if (name !== undefined) store.name = name;
			if (location !== undefined) store.location = location;
			if (maxCapacity !== undefined) store.maxCapacity = maxCapacity;

			await store.save();

			res.json({
				success: true,
				store: {
					_id: store._id,
					name: store.name,
					location: store.location,
					fullAddress: store.fullAddress,
					maxCapacity: store.maxCapacity,
					currentCapacity: store.currentCapacity,
					isActive: store.isActive,
				},
			});
		} catch (error) {
			console.error("Update store error:", error);
			res.status(400).json({
				success: false,
				message: error.message || "Error updating store",
			});
		}
	}
);

/**
 * DELETE /api/stores/:id
 * Delete store (partners only)
 */
router.delete(
	"/:id",
	requireAuth,
	requireRole([USER_ROLES.PARTNER]),
	async (req, res) => {
		try {
			// Validate ObjectId format
			if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
				return res.status(400).json({
					success: false,
					message: "Invalid store ID format",
				});
			}

			const store = await Store.findById(req.params.id);

			if (!store) {
				return res.status(404).json({
					success: false,
					message: "Store not found",
				});
			}

			// Check if any users are assigned to this store
			const assignedUsers = await User.find({ assignedStoreId: req.params.id });

			if (assignedUsers.length > 0) {
				return res.status(400).json({
					success: false,
					message: `Cannot delete store with ${assignedUsers.length} assigned users`,
				});
			}

			await Store.findByIdAndDelete(req.params.id);

			res.json({
				success: true,
				message: "Store deleted successfully",
			});
		} catch (error) {
			console.error("Delete store error:", error);
			res.status(500).json({
				success: false,
				message: "Error deleting store",
			});
		}
	}
);

module.exports = router;
