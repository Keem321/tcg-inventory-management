/**
 * Tests for Store Model
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Store } from "../../src/models/store.model.js";
import "../setup.js"; // Import test setup
import { storeFixtures } from "../fixtures/testData.js";

describe("Store Model", () => {
	beforeEach(async () => {
		// Clear database for test isolation
		await Store.deleteMany({});
	});

	describe("Schema Validation", () => {
		it("should create a valid store", async () => {
			const storeData = storeFixtures.downtown({
				name: "Game Haven - Portland",
				location: {
					address: "123 Main Street",
					city: "Portland",
					state: "OR",
					zipCode: "97201",
				},
				maxCapacity: 10000,
				currentCapacity: 5000,
			});

			const store = new Store(storeData);
			const savedStore = await store.save();

			expect(savedStore._id).toBeDefined();
		});

		it("should default currentCapacity to 0", async () => {
			const storeData = storeFixtures.downtown({
				currentCapacity: undefined,
			});

			const store = new Store(storeData);
			const savedStore = await store.save();

			expect(savedStore.currentCapacity).toBe(0);
		});

		it("should default isActive to true", async () => {
			const storeData = storeFixtures.downtown({
				isActive: undefined,
			});

			const store = new Store(storeData);
			const savedStore = await store.save();

			expect(savedStore.isActive).toBe(true);
		});

		it("should fail if name is missing", async () => {
			const storeData = storeFixtures.downtown({
				name: undefined,
			});

			const store = new Store(storeData);
			await expect(store.save()).rejects.toThrow();
		});

		it("should fail if location.address is missing", async () => {
			const storeData = storeFixtures.downtown();
			delete storeData.location.address;

			const store = new Store(storeData);
			await expect(store.save()).rejects.toThrow();
		});

		it("should fail if location.city is missing", async () => {
			const storeData = storeFixtures.downtown();
			delete storeData.location.city;

			const store = new Store(storeData);
			await expect(store.save()).rejects.toThrow();
		});

		it("should fail if location.state is missing", async () => {
			const storeData = storeFixtures.downtown();
			delete storeData.location.state;

			const store = new Store(storeData);
			await expect(store.save()).rejects.toThrow();
		});

		it("should fail if location.zipCode is missing", async () => {
			const storeData = storeFixtures.downtown();
			delete storeData.location.zipCode;

			const store = new Store(storeData);
			await expect(store.save()).rejects.toThrow();
		});

		it("should fail if maxCapacity is missing", async () => {
			const storeData = storeFixtures.downtown({
				maxCapacity: undefined,
			});

			const store = new Store(storeData);
			await expect(store.save()).rejects.toThrow();
		});

		it("should fail if maxCapacity is negative", async () => {
			const storeData = storeFixtures.downtown({
				maxCapacity: -100,
			});

			const store = new Store(storeData);
			await expect(store.save()).rejects.toThrow();
		});

		it("should fail if currentCapacity is negative", async () => {
			const storeData = storeFixtures.downtown({
				currentCapacity: -50,
			});

			const store = new Store(storeData);
			await expect(store.save()).rejects.toThrow();
		});

		it("should uppercase state abbreviation", async () => {
			const storeData = storeFixtures.downtown({
				location: {
					...storeFixtures.downtown().location,
					state: "il",
				},
			});

			const store = new Store(storeData);
			const savedStore = await store.save();

			expect(savedStore.location.state).toBe("IL");
		});

		it("should fail if state is not 2 characters", async () => {
			const storeData = storeFixtures.downtown({
				location: {
					...storeFixtures.downtown().location,
					state: "Oregon",
				},
			});

			const store = new Store(storeData);
			await expect(store.save()).rejects.toThrow();
		});

		it("should trim whitespace from fields", async () => {
			const storeData = storeFixtures.downtown({
				name: "  Test Store  ",
				location: {
					...storeFixtures.downtown().location,
					address: "  123 Main Street  ",
					city: "  Portland  ",
					zipCode: "  97201  ",
				},
			});

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
			const storeData = storeFixtures.downtown();

			const store = new Store(storeData);
			const savedStore = await store.save();

			expect(savedStore.fullAddress).toBe("123 Main St, Springfield, IL 62701");
		});

		it("should include fullAddress in JSON output", async () => {
			const storeData = storeFixtures.westside();

			const store = new Store(storeData);
			const savedStore = await store.save();
			const storeJSON = savedStore.toJSON();

			expect(storeJSON.fullAddress).toBe("456 Oak Ave, Springfield, IL 62702");
		});
	});

	describe("Store Queries", () => {
		beforeEach(async () => {
			// Create test data
			await Store.create([
				storeFixtures.downtown({
					name: "Game Haven - Portland",
					location: {
						address: "123 Main Street",
						city: "Portland",
						state: "OR",
						zipCode: "97201",
					},
					maxCapacity: 10000,
					currentCapacity: 6500,
				}),
				storeFixtures.westside({
					name: "Game Haven - Seattle",
					location: {
						address: "456 Pike Place",
						city: "Seattle",
						state: "WA",
						zipCode: "98101",
					},
					maxCapacity: 8000,
					currentCapacity: 7600,
				}),
				storeFixtures.downtown({
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
				}),
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
			const storeData = storeFixtures.atCapacity();

			const store = new Store(storeData);
			const savedStore = await store.save();

			expect(savedStore.currentCapacity).toBe(1000);
			expect(savedStore.maxCapacity).toBe(1000);
		});

		it("should calculate capacity percentage", async () => {
			const store = await Store.create(
				storeFixtures.downtown({
					currentCapacity: 650,
				})
			);

			const capacityPercentage =
				(store.currentCapacity / store.maxCapacity) * 100;
			expect(capacityPercentage).toBe(65);
		});
	});

	describe("Edge Cases - Capacity Boundaries", () => {
		it("should handle zero current capacity", async () => {
			const storeData = storeFixtures.empty();
			const store = new Store(storeData);
			const savedStore = await store.save();

			expect(savedStore.currentCapacity).toBe(0);
			expect(savedStore.maxCapacity).toBe(2000);
		});

		it("should handle capacity at exactly 100%", async () => {
			const storeData = storeFixtures.atCapacity();
			const store = new Store(storeData);
			const savedStore = await store.save();

			expect(savedStore.currentCapacity).toBe(savedStore.maxCapacity);
			const percentage =
				(savedStore.currentCapacity / savedStore.maxCapacity) * 100;
			expect(percentage).toBe(100);
		});

		it("should handle capacity at 99%", async () => {
			const storeData = storeFixtures.downtown({
				maxCapacity: 1000,
				currentCapacity: 990,
			});
			const store = new Store(storeData);
			const savedStore = await store.save();

			const percentage =
				(savedStore.currentCapacity / savedStore.maxCapacity) * 100;
			expect(percentage).toBe(99);
		});

		it("should handle minimum capacity (1)", async () => {
			const storeData = storeFixtures.downtown({
				maxCapacity: 1,
				currentCapacity: 0,
			});
			const store = new Store(storeData);
			const savedStore = await store.save();

			expect(savedStore.maxCapacity).toBe(1);
			expect(savedStore.currentCapacity).toBe(0);
		});

		it("should handle very large capacity values", async () => {
			const storeData = storeFixtures.downtown({
				maxCapacity: 999999,
				currentCapacity: 500000,
			});
			const store = new Store(storeData);
			const savedStore = await store.save();

			expect(savedStore.maxCapacity).toBe(999999);
			expect(savedStore.currentCapacity).toBe(500000);
		});

		it("should fail if currentCapacity exceeds maxCapacity", async () => {
			const storeData = storeFixtures.downtown({
				maxCapacity: 1000,
				currentCapacity: 1001,
			});
			const store = new Store(storeData);

			await expect(store.save()).rejects.toThrow();
		});
	});

	describe("Edge Cases - State Validation", () => {
		it("should accept all valid US state codes", async () => {
			const validStates = ["CA", "NY", "TX", "FL", "IL"];

			for (const state of validStates) {
				const storeData = storeFixtures.downtown({
					location: {
						...storeFixtures.downtown().location,
						state: state,
					},
				});
				const store = new Store(storeData);
				const savedStore = await store.save();
				expect(savedStore.location.state).toBe(state);
				await Store.deleteMany({});
			}
		});

		it("should uppercase lowercase state codes", async () => {
			const storeData = storeFixtures.downtown({
				location: {
					...storeFixtures.downtown().location,
					state: "il",
				},
			});
			const store = new Store(storeData);
			const savedStore = await store.save();
			expect(savedStore.location.state).toBe("IL");
		});

		it("should fail on single character state", async () => {
			const storeData = storeFixtures.downtown({
				location: {
					...storeFixtures.downtown().location,
					state: "O",
				},
			});
			const store = new Store(storeData);
			await expect(store.save()).rejects.toThrow();
		});

		it("should fail on three character state", async () => {
			const storeData = storeFixtures.downtown({
				location: {
					...storeFixtures.downtown().location,
					state: "ORE",
				},
			});
			const store = new Store(storeData);
			await expect(store.save()).rejects.toThrow();
		});

		it("should fail on numeric state code", async () => {
			const storeData = storeFixtures.downtown({
				location: {
					...storeFixtures.downtown().location,
					state: "12",
				},
			});
			const store = new Store(storeData);
			await expect(store.save()).rejects.toThrow();
		});
	});

	describe("Edge Cases - Zip Code Validation", () => {
		it("should accept 5-digit zip code", async () => {
			const storeData = storeFixtures.downtown();
			const store = new Store(storeData);
			const savedStore = await store.save();
			expect(savedStore.location.zipCode).toBe("62701");
		});

		it("should accept 9-digit zip code with hyphen", async () => {
			const storeData = storeFixtures.downtown({
				location: {
					...storeFixtures.downtown().location,
					zipCode: "97201-1234",
				},
			});
			const store = new Store(storeData);
			const savedStore = await store.save();
			expect(savedStore.location.zipCode).toBe("97201-1234");
		});

		it("should fail on 4-digit zip code", async () => {
			const storeData = storeFixtures.downtown({
				location: {
					...storeFixtures.downtown().location,
					zipCode: "9720",
				},
			});
			const store = new Store(storeData);
			await expect(store.save()).rejects.toThrow();
		});

		it("should fail on alphabetic zip code", async () => {
			const storeData = storeFixtures.downtown({
				location: {
					...storeFixtures.downtown().location,
					zipCode: "ABCDE",
				},
			});
			const store = new Store(storeData);
			await expect(store.save()).rejects.toThrow();
		});
	});

	describe("Edge Cases - String Field Boundaries", () => {
		it("should trim whitespace from all string fields", async () => {
			const storeData = storeFixtures.downtown({
				name: "  Test Store  ",
				location: {
					...storeFixtures.downtown().location,
					address: "  123 Main St  ",
					city: "  Portland  ",
				},
			});
			const store = new Store(storeData);
			const savedStore = await store.save();

			expect(savedStore.name).toBe("Test Store");
			expect(savedStore.location.address).toBe("123 Main St");
			expect(savedStore.location.city).toBe("Portland");
		});

		it("should handle very long store name", async () => {
			const longName = "A".repeat(200);
			const storeData = storeFixtures.downtown({ name: longName });
			const store = new Store(storeData);
			const savedStore = await store.save();
			expect(savedStore.name).toBe(longName);
		});

		it("should handle minimum length strings", async () => {
			const storeData = storeFixtures.downtown({
				name: "A",
				location: {
					...storeFixtures.downtown().location,
					address: "1",
					city: "B",
					zipCode: "12345",
				},
			});
			const store = new Store(storeData);
			const savedStore = await store.save();
			expect(savedStore.name).toBe("A");
			expect(savedStore.location.address).toBe("1");
			expect(savedStore.location.city).toBe("B");
		});

		it("should handle special characters in address", async () => {
			const storeData = storeFixtures.downtown({
				name: "Store #1 & Co.",
				location: {
					...storeFixtures.downtown().location,
					address: "123 Main St., Suite 400",
				},
			});
			const store = new Store(storeData);
			const savedStore = await store.save();
			expect(savedStore.name).toBe("Store #1 & Co.");
			expect(savedStore.location.address).toBe("123 Main St., Suite 400");
		});
	});

	describe("Edge Cases - Virtual Properties", () => {
		it("should generate fullAddress with all components", async () => {
			const storeData = storeFixtures.downtown();
			const store = new Store(storeData);
			const savedStore = await store.save();

			expect(savedStore.fullAddress).toBe("123 Main St, Springfield, IL 62701");
		});

		it("should include fullAddress in toJSON", async () => {
			const storeData = storeFixtures.downtown();
			const store = new Store(storeData);
			const savedStore = await store.save();
			const json = savedStore.toJSON();

			expect(json.fullAddress).toBeDefined();
			expect(json.fullAddress).toBe("123 Main St, Springfield, IL 62701");
		});
	});

	describe("Edge Cases - Update Operations", () => {
		it("should allow updating capacity incrementally", async () => {
			const store = await Store.create(storeFixtures.downtown());

			store.currentCapacity = 600;
			await store.save();
			expect(store.currentCapacity).toBe(600);

			store.currentCapacity = 700;
			await store.save();
			expect(store.currentCapacity).toBe(700);
		});

		it("should allow toggling isActive status", async () => {
			const store = await Store.create(storeFixtures.downtown());
			expect(store.isActive).toBe(true);

			store.isActive = false;
			await store.save();
			expect(store.isActive).toBe(false);

			store.isActive = true;
			await store.save();
			expect(store.isActive).toBe(true);
		});

		it("should preserve timestamps on update", async () => {
			const store = await Store.create(storeFixtures.downtown());
			const originalCreatedAt = store.createdAt;

			// Wait a moment and update
			await new Promise((resolve) => setTimeout(resolve, 10));
			store.currentCapacity = 600;
			await store.save();

			expect(store.createdAt.getTime()).toBe(originalCreatedAt.getTime());
		});
	});
});
