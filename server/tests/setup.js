/**
 * Test setup for MongoDB integration tests
 */

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { beforeAll, afterAll, afterEach } from "vitest";

let mongoServer;

/**
 * Connect to MongoDB before all tests
 */
beforeAll(async () => {
	// Create MongoDB instance
	mongoServer = await MongoMemoryServer.create();
	const mongoUri = mongoServer.getUri();

	// Connect mongoose to database
	await mongoose.connect(mongoUri);
});

/**
 * Clear all collections after each test for isolation
 */
afterEach(async () => {
	const collections = mongoose.connection.collections;

	for (const key in collections) {
		await collections[key].deleteMany();
	}
});

/**
 * Disconnect and stop MongoDB after all tests
 */
afterAll(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
});
