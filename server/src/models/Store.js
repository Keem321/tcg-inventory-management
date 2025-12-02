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
			index: true,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Indexes for common queries
storeSchema.index({ name: 1 });
storeSchema.index({ isActive: 1 });

// Virtual: Full address string
storeSchema.virtual("fullAddress").get(function () {
	return `${this.location.address}, ${this.location.city}, ${this.location.state} ${this.location.zipCode}`;
});

const Store = mongoose.models.Store || mongoose.model("Store", storeSchema);

module.exports = { Store };
