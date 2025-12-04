/**
 * Inventory Model
 * Represents physical storage units in stores - "where things are" and "how they're stored"
 *
 * KEY CONCEPT: For cards, inventory documents represent CONTAINERS (display cases, bulk boxes, bins).
 * For non-card products, inventory documents represent the products themselves.
 */

const mongoose = require("mongoose");

// Sub-schema for individual cards stored in a container
const cardItemSchema = new mongoose.Schema(
	{
		productId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
			required: true,
			// Reference to the card product (must be productType: "singleCard")
		},
		quantity: {
			type: Number,
			required: true,
			min: [1, "Card quantity must be at least 1"],
			// Number of this specific card in the container
		},
	},
	{ _id: false }
);

// Sub-schema for card container details
const cardContainerSchema = new mongoose.Schema(
	{
		containerType: {
			type: String,
			required: true,
			enum: ["display-case", "bulk-box", "bulk-bin"],
			// display-case: Locked showcase for premium cards
			// bulk-box: Organized storage box (often by set/type)
			// bulk-bin: Large floor bin for customer browsing (mixed cards)
		},
		containerName: {
			type: String,
			trim: true,
			required: true,
			// User-friendly label (e.g., "Display Case A3", "Bulk Bin - Floor 1")
		},
		containerUnitSize: {
			type: Number,
			min: [0, "Container unit size cannot be negative"],
			default: 0,
			// Physical space the container itself occupies (regardless of contents)
			// Used for capacity calculations: store capacity includes container sizes
		},
		cardInventory: {
			type: [cardItemSchema],
			default: [],
			// Array of cards stored in this container
			// Empty array = empty container (valid state)
		},
	},
	{ _id: false }
);

const inventorySchema = new mongoose.Schema(
	{
		storeId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Store",
			required: [true, "Store ID is required"],
		},
		productId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
			required: function () {
				// Required for non-card products, null for card containers
				return !this.isCardContainer;
			},
		},
		cardContainer: {
			type: cardContainerSchema,
			default: null,
			// Only present for card containers (display cases, bulk boxes, bulk bins)
			// If null, this is a standard inventory item (booster packs, accessories, etc.)
		},
		quantity: {
			type: Number,
			required: function () {
				// Required for non-card products, not used for card containers
				return !this.isCardContainer;
			},
			min: [0, "Quantity cannot be negative"],
			// For standard products: number of units in this inventory entry
			// For card containers: not used (use cardInventory array instead)
		},
		location: {
			type: String,
			required: [true, "Location is required"],
			enum: {
				values: ["floor", "back"],
				message: "Location must be either 'floor' or 'back'",
			},
			// floor: Sales floor (visible to customers)
			// back: Back storage/warehouse area
		},
		minStockLevel: {
			type: Number,
			min: [0, "Minimum stock level cannot be negative"],
			default: 0,
			// Threshold for low-stock alerts
			// Store managers can configure per-inventory-item
		},
		lastRestocked: {
			type: Date,
			default: null,
			// Track when inventory was last replenished
			// Useful for turnover analysis and reorder timing
		},
		notes: {
			type: String,
			trim: true,
			// Free-form notes for employees (e.g., "Damaged box", "Reserved for tournament", "Promotional display")
		},
		isActive: {
			type: Boolean,
			default: true,
			index: true,
			// false = archived/discontinued inventory item
			// Allows soft deletion while preserving historical data
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Compound indexes for common queries
inventorySchema.index({ storeId: 1, productId: 1 }); // Find all inventory of a product at a store
inventorySchema.index({ storeId: 1, location: 1 }); // Floor vs. back queries per store
inventorySchema.index({ storeId: 1, isActive: 1 }); // Active inventory at a store
inventorySchema.index({ productId: 1, isActive: 1 }); // Cross-store product availability
inventorySchema.index({ "cardContainer.cardInventory.productId": 1 }); // Find all containers holding a specific card
inventorySchema.index({ quantity: 1 }); // Low-stock queries
inventorySchema.index({ minStockLevel: 1 }); // Alert threshold queries

// Virtual: Check if this is a card container
inventorySchema.virtual("isCardContainer").get(function () {
	return this.cardContainer !== null && this.cardContainer !== undefined;
});

// Virtual: Total card count in container (for card containers only)
inventorySchema.virtual("totalCards").get(function () {
	if (!this.cardContainer?.cardInventory) {
		return 0;
	}
	return this.cardContainer.cardInventory.reduce(
		(sum, card) => sum + card.quantity,
		0
	);
});

// Virtual: Unique card types in container (for card containers only)
inventorySchema.virtual("uniqueCardTypes").get(function () {
	if (!this.cardContainer?.cardInventory) {
		return 0;
	}
	return this.cardContainer.cardInventory.length;
});

// Virtual: Calculate effective unit size for capacity tracking
inventorySchema.virtual("effectiveUnitSize").get(function () {
	if (this.cardContainer) {
		// For card containers, only the container itself occupies space
		return this.cardContainer.containerUnitSize || 0;
	} else {
		// For standard products, multiply quantity by product's unitSize
		// Note: Requires population of productId to access unitSize
		if (this.populated("productId") && this.productId?.unitSize) {
			return this.quantity * this.productId.unitSize;
		}
		return 0;
	}
});

// Pre-save validation: Ensure card containers and standard inventory are mutually exclusive
inventorySchema.pre("save", function () {
	const isContainer =
		this.cardContainer !== null && this.cardContainer !== undefined;

	if (isContainer) {
		// Card containers should not have productId or quantity
		if (this.productId) {
			throw new Error(
				"Card containers cannot have a productId (cards are stored in cardContainer.cardInventory)"
			);
		}

		if (this.quantity !== undefined && this.quantity !== null) {
			throw new Error(
				"Card containers cannot have a quantity (use cardContainer.cardInventory instead)"
			);
		}
	} else {
		// Standard inventory must have productId and quantity
		if (!this.productId) {
			throw new Error("Standard inventory items must have a productId");
		}

		if (this.quantity === undefined || this.quantity === null) {
			throw new Error("Standard inventory items must have a quantity");
		}
	}
});

// Static method: Find all inventory at a specific store
inventorySchema.statics.findByStore = function (storeId, options = {}) {
	const query = { storeId, isActive: true };

	if (options.location) {
		query.location = options.location; // Filter by floor or back
	}

	if (options.productId) {
		query.productId = options.productId;
	}

	return this.find(query)
		.populate("productId")
		.populate("storeId")
		.sort({ location: 1, createdAt: -1 });
};

// Static method: Find all containers holding a specific card
inventorySchema.statics.findContainersWithCard = function (
	cardProductId,
	storeId = null
) {
	const query = {
		"cardContainer.cardInventory.productId": cardProductId,
		isActive: true,
	};

	if (storeId) {
		query.storeId = storeId;
	}

	return this.find(query)
		.populate("storeId")
		.populate("cardContainer.cardInventory.productId")
		.sort({ storeId: 1, location: 1 });
};

// Static method: Get low-stock items (quantity below minStockLevel)
inventorySchema.statics.findLowStock = function (storeId = null) {
	const query = {
		cardContainer: null, // Only check standard inventory items (not containers)
		isActive: true,
		$expr: { $lt: ["$quantity", "$minStockLevel"] },
	};

	if (storeId) {
		query.storeId = storeId;
	}

	return this.find(query)
		.populate("productId")
		.populate("storeId")
		.sort({ quantity: 1 });
};

// Static method: Calculate total capacity used at a store
inventorySchema.statics.calculateStoreCapacity = async function (storeId) {
	const inventory = await this.find({ storeId, isActive: true }).populate(
		"productId"
	);

	let totalCapacity = 0;

	for (const item of inventory) {
		if (item.cardContainer) {
			// Add container's physical size
			totalCapacity += item.cardContainer.containerUnitSize || 0;
		} else {
			// Add product quantity × unitSize
			if (item.productId?.unitSize) {
				totalCapacity += item.quantity * item.productId.unitSize;
			}
		}
	}

	return totalCapacity;
};

// Static method: Get floor display quantities by product type, brand, or specific product
inventorySchema.statics.getFloorDisplayQuantities = async function (storeId) {
	const query = {
		storeId,
		location: "floor",
		isActive: true,
		cardContainer: null, // Only count standard products for floor display minimums
	};

	const inventory = await this.find(query).populate("productId");

	const quantities = {
		byProduct: {}, // productId -> quantity
		byProductType: {}, // productType -> total quantity
		byBrand: {}, // brand -> total quantity
		byProductTypeAndBrand: {}, // "productType:brand" -> quantity
	};

	for (const item of inventory) {
		if (!item.productId) continue;

		const product = item.productId;
		const qty = item.quantity || 0;

		// By specific product
		const productKey = product._id.toString();
		quantities.byProduct[productKey] =
			(quantities.byProduct[productKey] || 0) + qty;

		// By product type
		if (product.productType) {
			quantities.byProductType[product.productType] =
				(quantities.byProductType[product.productType] || 0) + qty;
		}

		// By brand
		if (product.brand) {
			quantities.byBrand[product.brand] =
				(quantities.byBrand[product.brand] || 0) + qty;
		}

		// By product type + brand combination
		if (product.productType && product.brand) {
			const comboKey = `${product.productType}:${product.brand}`;
			quantities.byProductTypeAndBrand[comboKey] =
				(quantities.byProductTypeAndBrand[comboKey] || 0) + qty;
		}
	}

	return quantities;
};

const Inventory =
	mongoose.models.Inventory || mongoose.model("Inventory", inventorySchema);

module.exports = { Inventory };
