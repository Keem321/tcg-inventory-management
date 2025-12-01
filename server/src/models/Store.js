/**
 * Store model - represents retail store locations
 */

const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Store name is required"],
			trim: true,
		},
		location: {
			address: {
				type: String,
				required: [true, "Address is required"],
				trim: true,
			},
			city: {
				type: String,
				required: [true, "City is required"],
				trim: true,
			},
			state: {
				type: String,
				required: [true, "State is required"],
				trim: true,
				uppercase: true,
				minlength: 2,
				maxlength: 2,
			},
			zipCode: {
				type: String,
				required: [true, "Zip code is required"],
				trim: true,
			},
		},
		maxCapacity: {
			type: Number,
			required: [true, "Max capacity is required"],
			min: [0, "Max capacity must be positive"],
		},
		currentCapacity: {
			type: Number,
			default: 0,
			min: [0, "Current capacity cannot be negative"],
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
	}
);

// Indexes
storeSchema.index({ name: 1 });
storeSchema.index({ isActive: 1 });

// Virtual for full address
storeSchema.virtual("fullAddress").get(function () {
	return `${this.location.address}, ${this.location.city}, ${this.location.state} ${this.location.zipCode}`;
});

// Ensure virtuals in JSON output
storeSchema.set("toJSON", { virtuals: true });
storeSchema.set("toObject", { virtuals: true });

const Store = mongoose.model("Store", storeSchema);

module.exports = { Store };
