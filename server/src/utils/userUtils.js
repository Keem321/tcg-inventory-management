/**
 * User utility functions
 * Helper functions for user management
 */

const bcrypt = require("bcrypt");
const { User } = require("../models/user.model");
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

module.exports = {
	hashPassword,
	createUser,
};
