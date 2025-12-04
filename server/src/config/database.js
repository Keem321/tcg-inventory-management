/**
 * Database configuration and connection utilities
 */

const mongoose = require("mongoose");

/**
 * Connect to MongoDB database
 * @param {string} uri - MongoDB connection URI
 * @returns {Promise<void>}
 */
async function connectDatabase(uri) {
	try {
		// Set up connection event listeners before connecting
		mongoose.connection.on("connected", () => {
			console.log("✅ Mongoose connected to MongoDB");
		});

		mongoose.connection.on("error", (err) => {
			console.error("❌ Mongoose connection error:", err);
		});

		mongoose.connection.on("disconnected", () => {
			console.log("⚠️  Mongoose disconnected from MongoDB");
		});

		// Graceful shutdown handlers
		process.on("SIGINT", async () => {
			await mongoose.connection.close();
			console.log("🛑 Mongoose connection closed through app termination");
			process.exit(0);
		});

		// Connect to MongoDB
		await mongoose.connect(uri);
		console.log("🚀 MongoDB connection established");
	} catch (error) {
		console.error("💥 MongoDB connection error:", error);
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
 * @returns {string} Connection state description
 */
function getConnectionStatus() {
	const states = {
		0: "disconnected",
		1: "connected",
		2: "connecting",
		3: "disconnecting",
	};
	return states[mongoose.connection.readyState] || "unknown";
}

/**
 * Get connection statistics
 * @returns {Object} Connection pool statistics
 */
function getConnectionStats() {
	return {
		state: getConnectionStatus(),
		host: mongoose.connection.host,
		name: mongoose.connection.name,
		collections: Object.keys(mongoose.connection.collections),
	};
}

module.exports = {
	connectDatabase,
	disconnectDatabase,
	getConnectionStatus,
	getConnectionStats,
};
