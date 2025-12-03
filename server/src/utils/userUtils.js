/**
 * User utility functions
 * Helper functions for user management
 */

const bcrypt = require("bcrypt");
const { User } = require("../models/User");
const { USER_ROLES } = require("../constants/enums");

const SALT_ROUNDS = 10;

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
	return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Create a new user with hashed password
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
async function createUser(userData) {
	const { password, ...rest } = userData;

	if (!password) {
		throw new Error("Password is required");
	}

	const passwordHash = await hashPassword(password);

	const user = new User({
		...rest,
		passwordHash,
	});

	return await user.save();
}

/**
 * Seed initial users for development/testing
 */
async function seedUsers() {
	const existingUsers = await User.countDocuments();

	if (existingUsers > 0) {
		console.log("Users already exist, skipping seed");
		return;
	}

	console.log("Seeding initial users...");

	// Create a partner
	const partner = await createUser({
		username: "partner1",
		email: "partner@tcg.com",
		password: "password123",
		role: USER_ROLES.PARTNER,
		firstName: "Alex",
		lastName: "Partner",
	});

	console.log("✅ Created partner user");

	// Note: Store managers and employees will need store IDs
	// Those can be created after stores are seeded

	return { partner };
}

module.exports = {
	hashPassword,
	createUser,
	seedUsers,
};
