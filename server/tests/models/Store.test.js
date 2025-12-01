/**
 * Tests for Store Model
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Store } from "../../src/models/Store.js";
import "../setup.js"; // Import test setup

describe("Store Model", () => {
	describe("Schema Validation", () => {
		it("should create a valid store", async () => {
			const storeData = {
				name: "Game Haven - Portland",
				location: {
					address: "123 Main Street",
					city: "Portland",
					state: "OR",
					zipCode: "97201",
				},
				maxCapacity: 10000,
				currentCapacity: 5000,
			};

			const store = new Store(storeData);
			const savedStore = await store.save();

			expect(savedStore._id).toBeDefined();
			expect(savedStore.name).toBe("Game Haven - Portland");
			expect(savedStore.location.address).toBe("123 Main Street");
			expect(savedStore.location.city).toBe("Portland");
			expect(savedStore.location.state).toBe("OR");
			expect(savedStore.location.zipCode).toBe("97201");
			expect(savedStore.maxCapacity).toBe(10000);
			expect(savedStore.currentCapacity).toBe(5000);
			expect(savedStore.isActive).toBe(true);
			expect(savedStore.createdAt).toBeInstanceOf(Date);
		});

		it("should default currentCapacity to 0", async () => {
			const storeData = {
				name: "New Store",
				location: {
					address: "456 Oak Ave",
					city: "Seattle",
					state: "WA",
					zipCode: "98101",
				},
				maxCapacity: 8000,
			};

			const store = new Store(storeData);
			const savedStore = await store.save();

			expect(savedStore.currentCapacity).toBe(0);
		});

		it("should default isActive to true", async () => {
			const storeData = {
				name: "New Store",
				location: {
					address: "789 Pine St",
					city: "Denver",
					state: "CO",
					zipCode: "80201",
				},
				maxCapacity: 12000,
			};

			const store = new Store(storeData);
			const savedStore = await store.save();

			expect(savedStore.isActive).toBe(true);
		});

		it("should fail if name is missing", async () => {
			const storeData = {
				location: {
					address: "123 Main Street",
					city: "Portland",
					state: "OR",
					zipCode: "97201",
				},
				maxCapacity: 10000,
			};

			const store = new Store(storeData);
			await expect(store.save()).rejects.toThrow();
		});

		it("should fail if location.address is missing", async () => {
			const storeData = {
				name: "Test Store",
				location: {
					city: "Portland",
					state: "OR",
					zipCode: "97201",
				},
				maxCapacity: 10000,
			};

			const store = new Store(storeData);
			await expect(store.save()).rejects.toThrow();
		});

		it("should fail if location.city is missing", async () => {
			const storeData = {
				name: "Test Store",
				location: {
					address: "123 Main Street",
					state: "OR",
					zipCode: "97201",
				},
				maxCapacity: 10000,
			};

			const store = new Store(storeData);
			await expect(store.save()).rejects.toThrow();
		});

		it("should fail if location.state is missing", async () => {
			const storeData = {
				name: "Test Store",
				location: {
					address: "123 Main Street",
					city: "Portland",
					zipCode: "97201",
				},
				maxCapacity: 10000,
			};

			const store = new Store(storeData);
			await expect(store.save()).rejects.toThrow();
		});

		it("should fail if location.zipCode is missing", async () => {
			const storeData = {
				name: "Test Store",
				location: {
					address: "123 Main Street",
					city: "Portland",
					state: "OR",
				},
				maxCapacity: 10000,
			};

			const store = new Store(storeData);
			await expect(store.save()).rejects.toThrow();
		});

		it("should fail if maxCapacity is missing", async () => {
			const storeData = {
				name: "Test Store",
				location: {
					address: "123 Main Street",
					city: "Portland",
					state: "OR",
					zipCode: "97201",
				},
			};

			const store = new Store(storeData);
			await expect(store.save()).rejects.toThrow();
		});

		it("should fail if maxCapacity is negative", async () => {
			const storeData = {
				name: "Test Store",
				location: {
					address: "123 Main Street",
					city: "Portland",
					state: "OR",
					zipCode: "97201",
				},
				maxCapacity: -100,
			};

			const store = new Store(storeData);
			await expect(store.save()).rejects.toThrow();
		});

		it("should fail if currentCapacity is negative", async () => {
			const storeData = {
				name: "Test Store",
				location: {
					address: "123 Main Street",
					city: "Portland",
					state: "OR",
					zipCode: "97201",
				},
				maxCapacity: 10000,
				currentCapacity: -50,
			};

			const store = new Store(storeData);
			await expect(store.save()).rejects.toThrow();
		});

		it("should uppercase state abbreviation", async () => {
			const storeData = {
				name: "Test Store",
				location: {
					address: "123 Main Street",
					city: "Portland",
					state: "or",
					zipCode: "97201",
				},
				maxCapacity: 10000,
			};

			const store = new Store(storeData);
			const savedStore = await store.save();

			expect(savedStore.location.state).toBe("OR");
		});

		it("should fail if state is not 2 characters", async () => {
			const storeData = {
				name: "Test Store",
				location: {
					address: "123 Main Street",
					city: "Portland",
					state: "Oregon",
					zipCode: "97201",
				},
				maxCapacity: 10000,
			};

			const store = new Store(storeData);
			await expect(store.save()).rejects.toThrow();
		});

		it("should trim whitespace from fields", async () => {
			const storeData = {
				name: "  Test Store  ",
				location: {
					address: "  123 Main Street  ",
					city: "  Portland  ",
					state: "OR",
					zipCode: "  97201  ",
				},
				maxCapacity: 10000,
			};

			const store = new Store(storeData);
			const savedStore = await store.save();

			expect(savedStore.name).toBe("Test Store");
			expect(savedStore.location.address).toBe("123 Main Street");
			expect(savedStore.location.city).toBe("Portland");
			expect(savedStore.location.zipCode).toBe("97201");
		});
	});

	describe("Virtual Properties", () => {
		it("should generate fullAddress virtual property", async () => {
			const storeData = {
				name: "Game Haven",
				location: {
					address: "123 Main Street",
					city: "Portland",
					state: "OR",
					zipCode: "97201",
				},
				maxCapacity: 10000,
			};

			const store = new Store(storeData);
			const savedStore = await store.save();

			expect(savedStore.fullAddress).toBe(
				"123 Main Street, Portland, OR 97201"
			);
		});

		it("should include fullAddress in JSON output", async () => {
			const storeData = {
				name: "Game Haven",
				location: {
					address: "456 Oak Ave",
					city: "Seattle",
					state: "WA",
					zipCode: "98101",
				},
				maxCapacity: 8000,
			};

			const store = new Store(storeData);
			const savedStore = await store.save();
			const storeJSON = savedStore.toJSON();

			expect(storeJSON.fullAddress).toBe("456 Oak Ave, Seattle, WA 98101");
		});
	});

	describe("Store Queries", () => {
		beforeEach(async () => {
			// Create test data
			await Store.create([
				{
					name: "Game Haven - Portland",
					location: {
						address: "123 Main Street",
						city: "Portland",
						state: "OR",
						zipCode: "97201",
					},
					maxCapacity: 10000,
					currentCapacity: 6500,
					isActive: true,
				},
				{
					name: "Game Haven - Seattle",
					location: {
						address: "456 Pike Place",
						city: "Seattle",
						state: "WA",
						zipCode: "98101",
					},
					maxCapacity: 8000,
					currentCapacity: 7600,
					isActive: true,
				},
				{
					name: "Game Haven - Denver",
					location: {
						address: "789 Colfax Ave",
						city: "Denver",
						state: "CO",
						zipCode: "80202",
					},
					maxCapacity: 12000,
					currentCapacity: 3000,
					isActive: false,
				},
			]);
		});

		it("should find all active stores", async () => {
			const activeStores = await Store.find({ isActive: true });
			expect(activeStores).toHaveLength(2);
		});

		it("should find stores by city", async () => {
			const portlandStores = await Store.find({ "location.city": "Portland" });
			expect(portlandStores).toHaveLength(1);
			expect(portlandStores[0].name).toBe("Game Haven - Portland");
		});

		it("should find stores by state", async () => {
			const waStores = await Store.find({ "location.state": "WA" });
			expect(waStores).toHaveLength(1);
			expect(waStores[0].name).toBe("Game Haven - Seattle");
		});

		it("should find stores nearing capacity (>90%)", async () => {
			const nearCapacityStores = await Store.find({
				$expr: {
					$gte: ["$currentCapacity", { $multiply: ["$maxCapacity", 0.9] }],
				},
			});
			expect(nearCapacityStores).toHaveLength(1);
			expect(nearCapacityStores[0].name).toBe("Game Haven - Seattle");
		});

		it("should find stores by name", async () => {
			const store = await Store.findOne({ name: "Game Haven - Portland" });
			expect(store).toBeDefined();
			expect(store.location.city).toBe("Portland");
		});

		it("should update currentCapacity", async () => {
			const store = await Store.findOne({ name: "Game Haven - Portland" });
			store.currentCapacity = 7000;
			await store.save();

			const updatedStore = await Store.findById(store._id);
			expect(updatedStore.currentCapacity).toBe(7000);
		});

		it("should deactivate store", async () => {
			const store = await Store.findOne({ name: "Game Haven - Portland" });
			store.isActive = false;
			await store.save();

			const updatedStore = await Store.findById(store._id);
			expect(updatedStore.isActive).toBe(false);
		});
	});

	describe("Capacity Management", () => {
		it("should allow currentCapacity equal to maxCapacity", async () => {
			const storeData = {
				name: "Full Store",
				location: {
					address: "123 Main St",
					city: "Portland",
					state: "OR",
					zipCode: "97201",
				},
				maxCapacity: 10000,
				currentCapacity: 10000,
			};

			const store = new Store(storeData);
			const savedStore = await store.save();

			expect(savedStore.currentCapacity).toBe(10000);
			expect(savedStore.maxCapacity).toBe(10000);
		});

		it("should calculate capacity percentage", async () => {
			const store = await Store.create({
				name: "Test Store",
				location: {
					address: "123 Main St",
					city: "Portland",
					state: "OR",
					zipCode: "97201",
				},
				maxCapacity: 10000,
				currentCapacity: 6500,
			});

			const capacityPercentage =
				(store.currentCapacity / store.maxCapacity) * 100;
			expect(capacityPercentage).toBe(65);
		});
	});
});
