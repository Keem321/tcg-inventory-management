/**
 * Product Model
 * Represents items in the catalog - "what exists" not "where it's stored"
 * Supports multiple product types including single cards and accessories
 */

const mongoose = require("mongoose");

// Card-specific details sub-schema
const cardDetailsSchema = new mongoose.Schema(
	{
		set: {
			type: String,
			required: true,
		},
		cardNumber: {
			type: String,
			required: true,
		},
		rarity: {
			type: String,
			required: true,
		},
		condition: {
			type: String,
			required: true,
			enum: [
				"mint",
				"near-mint",
				"lightly-played",
				"moderately-played",
				"heavily-played",
				"damaged",
			],
		},
		finish: {
			type: String,
			required: true,
			enum: ["non-foil", "foil", "etched", "holo", "reverse-holo"],
		},
	},
	{ _id: false }
);

const productSchema = new mongoose.Schema(
	{
		sku: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			index: true,
		},
		productType: {
			type: String,
			required: true,
			enum: [
				"singleCard",
				"boosterPack",
				"collectorBooster",
				"deck",
				"deckBox",
				"dice",
				"sleeves",
				"playmat",
				"binder",
				"other",
			],
			index: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
			// For cards, this is the card name
			// For other products, this is the product name
		},
		description: {
			type: String,
			trim: true,
		},
		brand: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},
		cardDetails: {
			type: cardDetailsSchema,
			required: function () {
				return this.productType === "singleCard";
			},
			default: null,
		},
		unitSize: {
			type: Number,
			required: true,
			min: 0,
			// 0 for single cards (containers hold space, not cards)
			// >0 for all other products
		},
		basePrice: {
			type: Number,
			required: true,
			min: 0,
		},
		bulkQuantity: {
			type: Number,
			min: 1,
			default: null,
			// Only present if product requires bulk purchase
			// Minimum quantity that must be ordered at once
		},
		isActive: {
			type: Boolean,
			default: true,
			index: true,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Compound indexes for common queries
productSchema.index({ productType: 1, brand: 1 });
productSchema.index({ brand: 1, isActive: 1 });
productSchema.index({ productType: 1, isActive: 1 });

// Text index for search functionality
productSchema.index({ name: "text", description: "text" });

// Validation: Cards must have unitSize of 0, non-cards cannot have cardDetails
productSchema.pre("save", function () {
	if (this.productType === "singleCard" && this.unitSize !== 0) {
		throw new Error("Single cards must have unitSize of 0");
	} else if (this.productType !== "singleCard" && this.unitSize === 0) {
		throw new Error("Non-card products must have unitSize greater than 0");
	}

	// Non-card products should not have cardDetails
	if (this.productType !== "singleCard" && this.cardDetails) {
		throw new Error("Non-card products cannot have cardDetails");
	}
});

// Virtual: Display name with brand
productSchema.virtual("fullName").get(function () {
	return `${this.brand} - ${this.name}`;
});

// Virtual: Card identifier (for single cards)
productSchema.virtual("cardIdentifier").get(function () {
	if (this.productType === "singleCard" && this.cardDetails) {
		return `${this.name} (${this.cardDetails.set} #${this.cardDetails.cardNumber})`;
	}
	return null;
});

// Static method: Find products by type and brand
productSchema.statics.findByTypeAndBrand = function (productType, brand) {
	return this.find({ productType, brand, isActive: true }).sort({ name: 1 });
};

// Static method: Find single cards by set
productSchema.statics.findCardsBySet = function (setName) {
	return this.find({
		productType: "singleCard",
		"cardDetails.set": setName,
		isActive: true,
	}).sort({ "cardDetails.cardNumber": 1 });
};

// Static method: Search products by name or description
productSchema.statics.searchProducts = function (searchTerm) {
	return this.find(
		{
			$text: { $search: searchTerm },
			isActive: true,
		},
		{
			score: { $meta: "textScore" },
		}
	).sort({ score: { $meta: "textScore" } });
};

const Product = mongoose.model("Product", productSchema);

module.exports = { Product };
