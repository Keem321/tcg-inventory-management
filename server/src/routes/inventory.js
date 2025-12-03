/**
 * Inventory routes
 * Handles inventory viewing and management operations
 */

const express = require("express");
const { Inventory } = require("../models/Inventory");
const { Store } = require("../models/Store");
const { Product } = require("../models/Product");
const {
	requireRole,
	requireStoreAccess,
} = require("../middleware/auth");
const mongoose = require("mongoose");
const { USER_ROLES, LOCATIONS } = require("../constants/enums");

const router = express.Router();

/**
 * POST /api/inventory/check-duplicate
 * Check if inventory already exists for a product at a store
 * Body: { storeId, productId, location }
 */
router.post("/check-duplicate", async (req, res) => {
	try {
		const { storeId, productId, location } = req.body;

		// Validate inputs
		if (!storeId || !productId || !location) {
			return res.status(400).json({
				success: false,
				message: "Store ID, Product ID, and location are required",
			});
		}

		// Validate ObjectIds
		if (
			!mongoose.Types.ObjectId.isValid(storeId) ||
			!mongoose.Types.ObjectId.isValid(productId)
		) {
			return res.status(400).json({
				success: false,
				message: "Invalid store or product ID",
			});
		}

		// Check for exact match (same location)
		const exactMatch = await Inventory.findOne({
			storeId,
			productId,
			location,
			isActive: true,
		}).populate("productId", "name sku");

		// Check for same product, different location
		const otherLocation =
			location === LOCATIONS.FLOOR ? LOCATIONS.BACK : LOCATIONS.FLOOR;
		const differentLocation = await Inventory.findOne({
			storeId,
			productId,
			location: otherLocation,
			isActive: true,
		}).populate("productId", "name sku");

		res.json({
			success: true,
			exactMatch: exactMatch
				? {
						id: exactMatch._id,
						location: exactMatch.location,
						quantity: exactMatch.quantity,
						productName: exactMatch.productId?.name,
				  }
				: null,
			differentLocation: differentLocation
				? {
						id: differentLocation._id,
						location: differentLocation.location,
						quantity: differentLocation.quantity,
						productName: differentLocation.productId?.name,
				  }
				: null,
		});
	} catch (error) {
		console.error("Check duplicate inventory error:", error);
		res.status(500).json({
			success: false,
			message: "Server error checking for duplicates",
		});
	}
});

/**
 * GET /api/inventory
 * Get all inventory across all stores (partners only)
 * Query params:
 *   - location: filter by location (floor, back)
 */
router.get(
	"/",
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
	requireRole([USER_ROLES.PARTNER, USER_ROLES.STORE_MANAGER]),
	requireStoreAccess,
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

			// Check for existing inventory of this product at this store and location
			const existingInventory = await Inventory.findOne({
				storeId,
				productId,
				location,
				isActive: true,
			});

			if (existingInventory) {
				// Duplicate found - merge quantities instead of creating new record
				const newQuantity = existingInventory.quantity + quantity;
				const currentCapacity = await Inventory.calculateStoreCapacity(storeId);
				const oldSpace = product.unitSize * existingInventory.quantity;
				const newSpace = product.unitSize * newQuantity;
				const spaceChange = newSpace - oldSpace;
				const availableSpace = store.maxCapacity - currentCapacity;

				if (spaceChange > availableSpace) {
					return res.status(400).json({
						success: false,
						message: `Insufficient capacity. Required additional: ${spaceChange}, Available: ${availableSpace}`,
					});
				}

				// Update existing inventory
				existingInventory.quantity = newQuantity;
				if (
					minStockLevel !== undefined &&
					minStockLevel > existingInventory.minStockLevel
				) {
					existingInventory.minStockLevel = minStockLevel;
				}
				if (notes) {
					existingInventory.notes = notes;
				}
				await existingInventory.save();

				// Update store capacity
				const newCapacity = await Inventory.calculateStoreCapacity(storeId);
				await Store.findByIdAndUpdate(storeId, {
					currentCapacity: newCapacity,
				});

				const populated = await Inventory.findById(existingInventory._id)
					.populate("storeId", "name location fullAddress")
					.populate("productId", "name sku productType brand");

				return res.status(200).json({
					success: true,
					inventory: populated,
					merged: true,
					message: `Inventory updated - added ${quantity} units to existing stock`,
				});
			}

			// Check capacity for new inventory
			const currentCapacity = await Inventory.calculateStoreCapacity(storeId);
			const requiredSpace = product.unitSize * quantity;
			const availableSpace = store.maxCapacity - currentCapacity;

			if (requiredSpace > availableSpace) {
				return res.status(400).json({
					success: false,
					message: `Insufficient capacity. Required: ${requiredSpace}, Available: ${availableSpace}`,
				});
			}

			// Create new inventory
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
				merged: false,
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
	requireRole([USER_ROLES.PARTNER, USER_ROLES.STORE_MANAGER]),
	requireStoreAccess,
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

			// If quantity is changing, check capacity
			if (quantity !== undefined && quantity !== inventory.quantity) {
				const store = await Store.findById(inventory.storeId);
				const currentCapacity = await Inventory.calculateStoreCapacity(
					inventory.storeId
				);
				const oldSpace = inventory.productId.unitSize * inventory.quantity;
				const newSpace = inventory.productId.unitSize * quantity;
				const spaceChange = newSpace - oldSpace;
				const availableSpace = store.maxCapacity - currentCapacity;

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
	requireRole([USER_ROLES.PARTNER, USER_ROLES.STORE_MANAGER]),
	requireStoreAccess,
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
