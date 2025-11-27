/**
 * User model - handles authentication and role-based access
 * Roles: employee, store-manager, partner
 */

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: [true, "Username is required"],
			unique: true,
			trim: true,
			minlength: [3, "Username must be at least 3 characters"],
			maxlength: [30, "Username must not exceed 30 characters"],
		},
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			trim: true,
			lowercase: true,
			match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
		},
		passwordHash: {
			type: String,
			required: [true, "Password hash is required"],
		},
		role: {
			type: String,
			required: [true, "Role is required"],
			enum: {
				values: ["employee", "store-manager", "partner"],
				message: "{VALUE} is not a valid role",
			},
		},
		assignedStoreId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Store",
			required: function () {
				// Required for employees and store managers
				return this.role !== "partner";
			},
			validate: {
				validator: function (value) {
					if (this.role === "partner" && value != null) {
						return false;
					}
					return true;
				},
				message: "Partners cannot have an assigned store!",
			},
		},
		firstName: {
			type: String,
			required: [true, "First name is required"],
			trim: true,
		},
		lastName: {
			type: String,
			required: [true, "Last name is required"],
			trim: true,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		lastLogin: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: true, // Automatically adds createdAt and updatedAt .o.
	}
);

// Indexes (username and email already have unique indexes from schema definition)
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ assignedStoreId: 1 });

// Virtual for full name
userSchema.virtual("fullName").get(function () {
	return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals in JSON output
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

const User = mongoose.model("User", userSchema);

module.exports = { User };
