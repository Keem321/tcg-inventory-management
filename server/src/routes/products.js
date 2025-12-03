/**
 * Product routes
 * Handles product CRUD operations (Partner only)
 */

const express = require("express");
const { Product } = require("../models/Product");
const { Inventory } = require("../models/Inventory");
const { requireRole } = require("../middleware/auth");
const mongoose = require("mongoose");
const { USER_ROLES, LOCATIONS } = require("../constants/enums");

const router = express.Router();

// All product routes are partner-only
router.use(requireRole([USER_ROLES.PARTNER]));

/**
 * GET /api/products
 * Get all products with optional filtering
 * Query params:
 *   - productType: filter by product type
 *   - brand: filter by brand
 *   - isActive: filter by active status
 *   - search: text search in name/description
 */
router.get("/", async (req, res) => {
	try {
		const { productType, brand, isActive, search } = req.query;

		const query = {};

		// Build filter query
		if (productType) {
			query.productType = productType;
		}
		if (brand) {
			query.brand = brand;
		}
		if (isActive !== undefined) {
			query.isActive = isActive === "true";
		}

		let products;
		if (search) {
			// Text search
			products = await Product.find({
				...query,
				$text: { $search: search },
			})
				.select("-__v")
				.sort({ score: { $meta: "textScore" } });
		} else {
			// Regular query
			products = await Product.find(query)
				.select("-__v")
				.sort({ brand: 1, name: 1 });
		}

		res.json({
			success: true,
			products,
		});
	} catch (error) {
		console.error("Get products error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching products",
		});
	}
});

/**
 * GET /api/products/:id
 * Get product by ID with inventory details across all stores
 */
router.get("/:id", async (req, res) => {
	try {
		// Validate ObjectId format
		if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
			return res.status(400).json({
				success: false,
				message: "Invalid product ID format",
			});
		}

		const product = await Product.findById(req.params.id).select("-__v");

		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
			});
		}

		// Get inventory for this product across all stores
		const inventory = await Inventory.find({
			productId: req.params.id,
			isActive: true,
		})
			.populate("storeId", "name location")
			.select("storeId quantity location cardContainer");

		// Calculate total quantity and per-store breakdown
		const storeInventory = {};
		let totalQuantity = 0;

		inventory.forEach((item) => {
			const storeId = item.storeId._id.toString();
			const storeName = item.storeId.name;

			if (!storeInventory[storeId]) {
				storeInventory[storeId] = {
					storeId,
					storeName,
					location: item.storeId.location,
					floor: 0,
					back: 0,
					total: 0,
				};
			}

			// For cards, count the cards in containers
			let quantity = item.quantity;
			if (item.cardContainer?.cards) {
				quantity = item.cardContainer.cards.reduce(
					(sum, card) => sum + card.quantity,
					0
				);
			}

			if (item.location === LOCATIONS.FLOOR) {
				storeInventory[storeId].floor += quantity;
			} else {
				storeInventory[storeId].back += quantity;
			}
			storeInventory[storeId].total += quantity;
			totalQuantity += quantity;
		});

		res.json({
			success: true,
			product,
			inventory: {
				totalQuantity,
				stores: Object.values(storeInventory),
			},
		});
	} catch (error) {
		console.error("Get product error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching product",
		});
	}
});

/**
 * POST /api/products
 * Create new product
 */
router.post("/", async (req, res) => {
	try {
		const {
			sku,
			productType,
			name,
			description,
			brand,
			cardDetails,
			unitSize,
			basePrice,
			bulkQuantity,
		} = req.body;

		// Validate required fields
		if (
			!sku ||
			!productType ||
			!name ||
			!brand ||
			unitSize === undefined ||
			!basePrice
		) {
			return res.status(400).json({
				success: false,
				message: "Missing required fields",
			});
		}

		// Check for duplicate SKU
		const existingProduct = await Product.findOne({ sku });
		if (existingProduct) {
			return res.status(400).json({
				success: false,
				message: "Product with this SKU already exists",
			});
		}

		const product = new Product({
			sku,
			productType,
			name,
			description,
			brand,
			cardDetails,
			unitSize,
			basePrice,
			bulkQuantity,
		});

		await product.save();

		res.status(201).json({
			success: true,
			product,
		});
	} catch (error) {
		console.error("Create product error:", error);
		res.status(400).json({
			success: false,
			message: error.message || "Error creating product",
		});
	}
});

/**
 * PUT /api/products/:id
 * Update existing product
 */
router.put("/:id", async (req, res) => {
	try {
		// Validate ObjectId format
		if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
			return res.status(400).json({
				success: false,
				message: "Invalid product ID format",
			});
		}

		const product = await Product.findById(req.params.id);

		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
			});
		}

		const {
			name,
			description,
			brand,
			cardDetails,
			basePrice,
			bulkQuantity,
			isActive,
		} = req.body;

		// Update allowed fields (SKU, productType, and unitSize cannot be changed)
		if (name !== undefined) product.name = name;
		if (description !== undefined) product.description = description;
		if (brand !== undefined) product.brand = brand;
		if (cardDetails !== undefined) product.cardDetails = cardDetails;
		if (basePrice !== undefined) product.basePrice = basePrice;
		if (bulkQuantity !== undefined) product.bulkQuantity = bulkQuantity;
		if (isActive !== undefined) product.isActive = isActive;

		await product.save();

		res.json({
			success: true,
			product,
		});
	} catch (error) {
		console.error("Update product error:", error);
		res.status(400).json({
			success: false,
			message: error.message || "Error updating product",
		});
	}
});

/**
 * DELETE /api/products/:id
 * Delete product (only if no inventory exists)
 */
router.delete("/:id", async (req, res) => {
	try {
		// Validate ObjectId format
		if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
			return res.status(400).json({
				success: false,
				message: "Invalid product ID format",
			});
		}

		const product = await Product.findById(req.params.id);

		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
			});
		}

		// Check if any inventory exists for this product
		const inventoryCount = await Inventory.countDocuments({
			productId: req.params.id,
		});

		if (inventoryCount > 0) {
			return res.status(400).json({
				success: false,
				message: `Cannot delete product with ${inventoryCount} inventory records. Set to inactive instead.`,
			});
		}

		await Product.findByIdAndDelete(req.params.id);

		res.json({
			success: true,
			message: "Product deleted successfully",
		});
	} catch (error) {
		console.error("Delete product error:", error);
		res.status(500).json({
			success: false,
			message: "Error deleting product",
		});
	}
});

module.exports = router;
