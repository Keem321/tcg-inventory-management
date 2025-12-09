/**
 * Transfer Request Model
 * Manages inventory transfers between stores with multi-stage workflow
 *
 * Workflow:
 * 1. open - Draft request being created
 * 2. requested - Manager/Partner has submitted the request
 * 3. sent - Source store has shipped the inventory
 * 4. complete - Destination store has received the inventory
 * 5. closed - Cancelled/closed by partner
 */

const mongoose = require("mongoose");

// Sub-schema for individual items in the transfer
const transferItemSchema = new mongoose.Schema(
	{
		inventoryId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Inventory",
			required: true,
			// Reference to the specific inventory record being transferred
		},
		productId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
			required: true,
			// Reference to the product for easy querying/display
		},
		requestedQuantity: {
			type: Number,
			required: true,
			min: [1, "Requested quantity must be at least 1"],
			// How many units are being requested
		},
		// For card containers, which specific cards are being transferred
		cardItems: [
			{
				productId: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Product",
					required: true,
				},
				quantity: {
					type: Number,
					required: true,
					min: [1, "Card quantity must be at least 1"],
				},
			},
		],
	},
	{ _id: false }
);

const transferRequestSchema = new mongoose.Schema(
	{
		requestNumber: {
			type: String,
			required: true,
			unique: true,
			// Format: TR-YYYYMMDD-XXXX (e.g., TR-20231215-0001)
		},
		fromStoreId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Store",
			required: true,
			// Store sending the inventory
		},
		toStoreId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Store",
			required: true,
			// Store receiving the inventory
		},
		status: {
			type: String,
			required: true,
			enum: ["open", "requested", "sent", "complete", "closed"],
			default: "open",
		},
		items: {
			type: [transferItemSchema],
			required: true,
			validate: {
				validator: function (items) {
					return items && items.length > 0;
				},
				message: "Transfer request must have at least one item",
			},
		},
		// Tracking who performed each action
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		requestedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			// User who submitted the request (moved from open to requested)
		},
		requestedAt: {
			type: Date,
			// When the request was submitted
		},
		sentBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			// User who marked items as sent
		},
		sentAt: {
			type: Date,
			// When items were marked as sent
		},
		completedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			// User who confirmed receipt
		},
		completedAt: {
			type: Date,
			// When items were received
		},
		closedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			// Partner who closed the request
		},
		closedAt: {
			type: Date,
		},
		closeReason: {
			type: String,
			trim: true,
			maxlength: [500, "Close reason must not exceed 500 characters"],
		},
		notes: {
			type: String,
			trim: true,
			maxlength: [1000, "Notes must not exceed 1000 characters"],
		},
		isActive: {
			type: Boolean,
			default: true,
			// For soft deletes
		},
	},
	{
		timestamps: true,
		// Adds createdAt and updatedAt
	}
);

transferRequestSchema.index({ fromStoreId: 1, status: 1 });
transferRequestSchema.index({ toStoreId: 1, status: 1 });
transferRequestSchema.index({ status: 1, createdAt: -1 });
transferRequestSchema.index({ isActive: 1 });

// Validation: Can't transfer to the same store
transferRequestSchema.pre("save", function () {
	if (this.fromStoreId.equals(this.toStoreId)) {
		throw new Error("Cannot transfer inventory to the same store");
	}
});

// Virtual for checking if user can modify this request based on store
transferRequestSchema.methods.canUserModify = function (user, storeId) {
	// Partners can modify any request
	if (user.role === "partner") {
		return true;
	}

	// Managers can only modify requests involving their store
	if (user.role === "store-manager") {
		return this.fromStoreId.equals(storeId) || this.toStoreId.equals(storeId);
	}

	return false;
};

// Method to check if user can transition to a specific status
transferRequestSchema.methods.canTransitionTo = function (
	newStatus,
	user,
	storeId
) {
	const currentStatus = this.status;

	// Only partners can close requests
	if (newStatus === "closed") {
		return user.role === "partner";
	}

	// Partners can do anything except close→complete
	if (user.role === "partner") {
		// Can't uncomplete a request
		if (currentStatus === "complete" && newStatus !== "closed") {
			return false;
		}
		return true;
	}

	// Managers can only work with their store
	if (user.role === "store-manager") {
		// Can submit request if they're from the requesting (to) store
		if (currentStatus === "open" && newStatus === "requested") {
			return this.toStoreId.equals(storeId);
		}

		// Can mark as sent if they're from the source (from) store
		if (currentStatus === "requested" && newStatus === "sent") {
			return this.fromStoreId.equals(storeId);
		}

		// Can mark as complete if they're from the destination (to) store
		if (currentStatus === "sent" && newStatus === "complete") {
			return this.toStoreId.equals(storeId);
		}
	}

	return false;
};

module.exports = mongoose.model("TransferRequest", transferRequestSchema);
