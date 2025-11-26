/**
 * Database configuration and connection utilities
 */

import mongoose from "mongoose";

/**
 * Connect to MongoDB database
 * @param {string} uri
 * @returns {Promise<void>}
 */
export async function connectDatabase(uri) {
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
export async function disconnectDatabase() {
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
export function isConnected() {
	return mongoose.connection.readyState === 1;
}
