/**
 * Inventory routes
 * Handles inventory viewing and management operations
 */

const express = require("express");
const { Inventory } = require("../models/Inventory");
const { Store } = require("../models/Store");
const { Product } = require("../models/Product");
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
	requireAuth,
	requireRole([USER_ROLES.PARTNER, USER_ROLES.STORE_MANAGER]),
	async (req, res) => {
		try {
			const { storeId, productId, quantity, location, minStockLevel, notes } =
				req.body;

			// Validate required fields
			if (!storeId || !productId || quantity === undefined || !location) {
				return res.status(400).json({
					success: false,
					message: "Missing required fields",
				});
			}

			// Validate ObjectId formats
			if (
				!mongoose.Types.ObjectId.isValid(storeId) ||
				!mongoose.Types.ObjectId.isValid(productId)
			) {
				return res.status(400).json({
					success: false,
					message: "Invalid ID format",
				});
			}

			// Check store access for non-partners
			if (req.user.role !== USER_ROLES.PARTNER) {
				const assignedStoreId =
					typeof req.user.assignedStoreId === "object"
						? req.user.assignedStoreId.toString()
						: req.user.assignedStoreId;

				if (assignedStoreId !== storeId) {
					return res.status(403).json({
						success: false,
						message: "You can only add inventory to your assigned store",
					});
				}
			}

			// Verify store exists
			const store = await Store.findById(storeId);
			if (!store) {
				return res.status(404).json({
					success: false,
					message: "Store not found",
				});
			}

			// Verify product exists
			const product = await Product.findById(productId);
			if (!product) {
				return res.status(404).json({
					success: false,
					message: "Product not found",
				});
			}

			// Check capacity
			const currentCapacity = await Inventory.calculateStoreCapacity(storeId);
			const requiredSpace = product.unitSize * quantity;
			const availableSpace = store.capacity - currentCapacity;

			if (requiredSpace > availableSpace) {
				return res.status(400).json({
					success: false,
					message: `Insufficient capacity. Required: ${requiredSpace}, Available: ${availableSpace}`,
				});
			}

			// Create inventory
			const inventory = await Inventory.create({
				storeId,
				productId,
				quantity,
				location,
				minStockLevel: minStockLevel || 0,
				notes,
			});

			// Update store's current capacity
			const newCapacity = await Inventory.calculateStoreCapacity(storeId);
			await Store.findByIdAndUpdate(storeId, {
				currentCapacity: newCapacity,
			});

			const populated = await Inventory.findById(inventory._id)
				.populate("storeId", "name location fullAddress")
				.populate("productId", "name sku productType brand");

			res.status(201).json({
				success: true,
				inventory: populated,
				message: "Inventory created successfully",
			});
		} catch (error) {
			console.error("Create inventory error:", error);
			res.status(500).json({
				success: false,
				message: "Error creating inventory: " + error.message,
			});
		}
	}
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
	requireAuth,
	requireRole([USER_ROLES.PARTNER, USER_ROLES.STORE_MANAGER]),
	async (req, res) => {
		try {
			const { quantity, location, minStockLevel, notes } = req.body;

			// Validate ObjectId format
			if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
				return res.status(400).json({
					success: false,
					message: "Invalid inventory ID format",
				});
			}

			// Find existing inventory
			const inventory = await Inventory.findById(req.params.id).populate(
				"productId"
			);
			if (!inventory) {
				return res.status(404).json({
					success: false,
					message: "Inventory not found",
				});
			}

			// Check store access for non-partners
			if (req.user.role !== USER_ROLES.PARTNER) {
				const assignedStoreId =
					typeof req.user.assignedStoreId === "object"
						? req.user.assignedStoreId.toString()
						: req.user.assignedStoreId;

				const inventoryStoreId =
					typeof inventory.storeId === "object"
						? inventory.storeId.toString()
						: inventory.storeId;

				if (assignedStoreId !== inventoryStoreId) {
					return res.status(403).json({
						success: false,
						message: "You can only update inventory at your assigned store",
					});
				}
			}

			// If quantity is changing, check capacity
			if (quantity !== undefined && quantity !== inventory.quantity) {
				const store = await Store.findById(inventory.storeId);
				const currentCapacity = await Inventory.calculateStoreCapacity(
					inventory.storeId
				);
				const oldSpace = inventory.productId.unitSize * inventory.quantity;
				const newSpace = inventory.productId.unitSize * quantity;
				const spaceChange = newSpace - oldSpace;
				const availableSpace = store.capacity - currentCapacity;

				if (spaceChange > availableSpace) {
					return res.status(400).json({
						success: false,
						message: `Insufficient capacity. Required additional: ${spaceChange}, Available: ${availableSpace}`,
					});
				}
			}

			// Update fields
			if (quantity !== undefined) inventory.quantity = quantity;
			if (location) inventory.location = location;
			if (minStockLevel !== undefined) inventory.minStockLevel = minStockLevel;
			if (notes !== undefined) inventory.notes = notes;

			await inventory.save();

			// Update store's current capacity
			const newCapacity = await Inventory.calculateStoreCapacity(
				inventory.storeId
			);
			await Store.findByIdAndUpdate(inventory.storeId, {
				currentCapacity: newCapacity,
			});

			const updated = await Inventory.findById(inventory._id)
				.populate("storeId", "name location fullAddress")
				.populate("productId", "name sku productType brand");

			res.json({
				success: true,
				inventory: updated,
				message: "Inventory updated successfully",
			});
		} catch (error) {
			console.error("Update inventory error:", error);
			res.status(500).json({
				success: false,
				message: "Error updating inventory: " + error.message,
			});
		}
	}
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
	requireAuth,
	requireRole([USER_ROLES.PARTNER, USER_ROLES.STORE_MANAGER]),
	async (req, res) => {
		try {
			// Validate ObjectId format
			if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
				return res.status(400).json({
					success: false,
					message: "Invalid inventory ID format",
				});
			}

			// Find inventory
			const inventory = await Inventory.findById(req.params.id);
			if (!inventory) {
				return res.status(404).json({
					success: false,
					message: "Inventory not found",
				});
			}

			// Check store access for non-partners
			if (req.user.role !== USER_ROLES.PARTNER) {
				const assignedStoreId =
					typeof req.user.assignedStoreId === "object"
						? req.user.assignedStoreId.toString()
						: req.user.assignedStoreId;

				const inventoryStoreId =
					typeof inventory.storeId === "object"
						? inventory.storeId.toString()
						: inventory.storeId;

				if (assignedStoreId !== inventoryStoreId) {
					return res.status(403).json({
						success: false,
						message: "You can only delete inventory at your assigned store",
					});
				}
			}

			// Soft delete
			inventory.isActive = false;
			await inventory.save();

			// Update store's current capacity
			const newCapacity = await Inventory.calculateStoreCapacity(
				inventory.storeId
			);
			await Store.findByIdAndUpdate(inventory.storeId, {
				currentCapacity: newCapacity,
			});

			res.json({
				success: true,
				message: "Inventory removed successfully",
			});
		} catch (error) {
			console.error("Delete inventory error:", error);
			res.status(500).json({
				success: false,
				message: "Error deleting inventory: " + error.message,
			});
		}
	}
);

module.exports = router;
