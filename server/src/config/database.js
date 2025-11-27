/**
 * Database configuration and connection utilities
 */

const mongoose = require("mongoose");

/**
 * Connect to MongoDB database
 * @param {string} uri
 * @returns {Promise<void>}
 */
async function connectDatabase(uri) {
	try {
		await mongoose.connect(uri);
		console.log("Connected to MongoDB");
	} catch (error) {
		console.error("MongoDB connection error:", error);
		throw error;
	}
}

/**
 * Disconnect from MongoDB database
 * @returns {Promise<void>}
 */
async function disconnectDatabase() {
	try {
		await mongoose.disconnect();
		console.log("✅ Disconnected from MongoDB");
	} catch (error) {
		console.error("❌ MongoDB disconnection error:", error);
		throw error;
	}
}

/**
 * Get database connection status
 * @returns {boolean}
 */
function isConnected() {
	return mongoose.connection.readyState === 1;
}

module.exports = {
	connectDatabase,
	disconnectDatabase,
	isConnected,
};
