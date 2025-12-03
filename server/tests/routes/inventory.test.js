/**
 * Inventory Routes Tests
 * Tests for inventory viewing endpoints with role-based access control
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import session from "express-session";
import { Inventory } from "../../src/models/Inventory.js";
import { Product } from "../../src/models/Product.js";
import { Store } from "../../src/models/Store.js";
import { User } from "../../src/models/User.js";
import inventoryRoutes from "../../src/routes/inventory.js";
import "../setup.js";
import {
	userFixtures,
	storeFixtures,
	productFixtures,
	inventoryFixtures,
	edgeCases,
} from "../fixtures/testData.js";

describe("Inventory Routes", () => {
	let app;
	let partnerUser;
	let managerUser;
	let employeeUser;
	let store1;
	let store2;
	let product1;
	let product2;
	let inventory1;
	let inventory2;

	beforeEach(async () => {
		// Clear database
		await User.deleteMany({});
		await Store.deleteMany({});
		await Product.deleteMany({});
		await Inventory.deleteMany({});

		// Create test stores
		store1 = await Store.create({
			name: "Downtown TCG Store",
			location: {
				address: "123 Main St",
				city: "Springfield",
				state: "IL",
				zipCode: "62701",
			},
			maxCapacity: 1000,
		});

		store2 = await Store.create({
			name: "Westside TCG Store",
			location: {
				address: "456 Oak Ave",
				city: "Springfield",
				state: "IL",
				zipCode: "62702",
			},
			maxCapacity: 1500,
		});

		// Create test users
		partnerUser = await User.create({
			username: "partner1",
			email: "partner@tcg.com",
			passwordHash: "hashedpassword",
			firstName: "Partner",
			lastName: "User",
			role: "partner",
		});

		managerUser = await User.create({
			username: "manager1",
			email: "manager@tcg.com",
			passwordHash: "hashedpassword",
			firstName: "Manager",
			lastName: "User",
			role: "store-manager",
			assignedStoreId: store1._id,
		});

		employeeUser = await User.create({
			username: "employee1",
			email: "employee@tcg.com",
			passwordHash: "hashedpassword",
			firstName: "Employee",
			lastName: "User",
			role: "employee",
			assignedStoreId: store1._id,
		});

		// Create test products
		product1 = await Product.create({
			sku: "DECK-001",
			productType: "deck",
			name: "Commander Deck",
			brand: "Wizards of the Coast",
			unitSize: 100,
			basePrice: 39.99,
		});

		product2 = await Product.create({
			sku: "SLEEVES-001",
			productType: "sleeves",
			name: "Dragon Shield Sleeves",
			brand: "Dragon Shield",
			unitSize: 100,
			basePrice: 9.99,
		});

		// Create test inventory
		inventory1 = await Inventory.create({
			storeId: store1._id,
			productId: product1._id,
			location: "floor",
			quantity: 10,
			minStockLevel: 5,
		});

		inventory2 = await Inventory.create({
			storeId: store2._id,
			productId: product2._id,
			location: "back",
			quantity: 25,
			minStockLevel: 10,
		});

		// Setup Express app
		app = express();
		app.use(express.json());
		app.use(
			session({
				secret: "test-secret",
				resave: false,
				saveUninitialized: false,
			})
		);

		app.use((req, res, next) => {
			if (req.headers["x-test-user-id"]) {
				req.session.userId = req.headers["x-test-user-id"];
			}
			next();
		});

		app.use("/api/inventory", inventoryRoutes);
	});

	describe("GET /api/inventory", () => {
		describe("Authorization", () => {
			it("should require authentication", async () => {
				const response = await request(app).get("/api/inventory");

				expect(response.status).toBe(401);
				expect(response.body.success).toBe(false);
			});

			it("should allow partner access", async () => {
				const response = await request(app)
					.get("/api/inventory")
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);
			});

			it("should deny manager access", async () => {
				const response = await request(app)
					.get("/api/inventory")
					.set("x-test-user-id", managerUser._id.toString());

				expect(response.status).toBe(403);
			});

			it("should deny employee access", async () => {
				const response = await request(app)
					.get("/api/inventory")
					.set("x-test-user-id", employeeUser._id.toString());

				expect(response.status).toBe(403);
			});
		});

		describe("Functionality", () => {
			it("should return all inventory across all stores", async () => {
				const response = await request(app)
					.get("/api/inventory")
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(200);
				expect(response.body.inventory).toHaveLength(2);
			});

			it("should filter by location", async () => {
				const response = await request(app)
					.get("/api/inventory?location=floor")
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(200);
				expect(response.body.inventory).toHaveLength(1);
				expect(response.body.inventory[0].location).toBe("floor");
			});

			it("should populate store and product details", async () => {
				const response = await request(app)
					.get("/api/inventory")
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(200);
				expect(response.body.inventory[0].storeId.name).toBeDefined();
				expect(response.body.inventory[0].productId.name).toBeDefined();
			});

			it("should only return active inventory", async () => {
				await Inventory.create({
					storeId: store1._id,
					productId: product1._id,
					location: "floor",
					quantity: 5,
					isActive: false,
				});

				const response = await request(app)
					.get("/api/inventory")
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.body.inventory.every((item) => item.isActive)).toBe(
					true
				);
			});
		});
	});

	describe("GET /api/inventory/store/:id", () => {
		describe("Authorization", () => {
			it("should require authentication", async () => {
				const response = await request(app).get(
					`/api/inventory/store/${store1._id}`
				);

				expect(response.status).toBe(401);
			});

			it("should allow partner to access any store", async () => {
				const response = await request(app)
					.get(`/api/inventory/store/${store1._id}`)
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);
			});

			it("should allow manager to access assigned store", async () => {
				const response = await request(app)
					.get(`/api/inventory/store/${store1._id}`)
					.set("x-test-user-id", managerUser._id.toString());

				expect(response.status).toBe(200);
			});

			it("should deny manager access to non-assigned store", async () => {
				const response = await request(app)
					.get(`/api/inventory/store/${store2._id}`)
					.set("x-test-user-id", managerUser._id.toString());

				expect(response.status).toBe(403);
				expect(response.body.message).toContain("assigned store");
			});

			it("should allow employee to access assigned store", async () => {
				const response = await request(app)
					.get(`/api/inventory/store/${store1._id}`)
					.set("x-test-user-id", employeeUser._id.toString());

				expect(response.status).toBe(200);
			});

			it("should deny employee access to non-assigned store", async () => {
				const response = await request(app)
					.get(`/api/inventory/store/${store2._id}`)
					.set("x-test-user-id", employeeUser._id.toString());

				expect(response.status).toBe(403);
			});
		});

		describe("Functionality", () => {
			it("should return inventory for specific store", async () => {
				const response = await request(app)
					.get(`/api/inventory/store/${store1._id}`)
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(200);
				expect(response.body.inventory).toHaveLength(1);
				expect(response.body.inventory[0].storeId._id.toString()).toBe(
					store1._id.toString()
				);
			});

			it("should filter by location", async () => {
				// Add more inventory to store1
				await Inventory.create({
					storeId: store1._id,
					productId: product2._id,
					location: "back",
					quantity: 15,
				});

				const response = await request(app)
					.get(`/api/inventory/store/${store1._id}?location=back`)
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(200);
				expect(response.body.inventory).toHaveLength(1);
				expect(response.body.inventory[0].location).toBe("back");
			});

			it("should return 400 for invalid store ID", async () => {
				const response = await request(app)
					.get("/api/inventory/store/invalid-id")
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(400);
				expect(response.body.message).toContain("Invalid store ID");
			});

			it("should return empty array for store with no inventory", async () => {
				const emptyStore = await Store.create({
					name: "Empty Store",
					location: {
						address: "789 Pine St",
						city: "Springfield",
						state: "IL",
						zipCode: "62703",
					},
					maxCapacity: 500,
				});

				const response = await request(app)
					.get(`/api/inventory/store/${emptyStore._id}`)
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(200);
				expect(response.body.inventory).toHaveLength(0);
			});

			it("should populate store and product details", async () => {
				const response = await request(app)
					.get(`/api/inventory/store/${store1._id}`)
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(200);
				const item = response.body.inventory[0];
				expect(item.storeId.name).toBe("Downtown TCG Store");
				expect(item.productId.name).toBeDefined();
				expect(item.productId.sku).toBeDefined();
			});
		});
	});

	describe("Edge Cases - Invalid Store IDs", () => {
		it("should return 400 for malformed store ID", async () => {
			const response = await request(app)
				.get(`/api/inventory/store/${edgeCases.invalidIds.malformed}`)
				.set("x-test-user-id", partnerUser._id.toString());

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it("should return empty array for non-existent store ID", async () => {
			const response = await request(app)
				.get(`/api/inventory/store/${edgeCases.invalidIds.nonExistent}`)
				.set("x-test-user-id", partnerUser._id.toString());

			// Could be 404 or empty array depending on implementation
			expect([200, 404]).toContain(response.status);
		});
	});

	describe("Edge Cases - Low Stock Scenarios", () => {
		beforeEach(async () => {
			// Create low stock inventory
			await Inventory.create(
				inventoryFixtures.lowStock(store1._id, product1._id)
			);
		});

		it("should return low stock items", async () => {
			const response = await request(app)
				.get(`/api/inventory/store/${store1._id}`)
				.set("x-test-user-id", partnerUser._id.toString());

			expect(response.status).toBe(200);
			const lowStockItem = response.body.inventory.find(
				(item) => item.quantity < item.minStockLevel
			);
			expect(lowStockItem).toBeDefined();
		});
	});

	describe("Edge Cases - Out of Stock Scenarios", () => {
		beforeEach(async () => {
			// Clear existing inventory and create out of stock item
			await Inventory.deleteMany({});
			await Inventory.create(
				inventoryFixtures.outOfStock(store1._id, product1._id)
			);
		});

		it("should include out of stock items (quantity 0)", async () => {
			const response = await request(app)
				.get(`/api/inventory/store/${store1._id}`)
				.set("x-test-user-id", partnerUser._id.toString());

			expect(response.status).toBe(200);
			expect(response.body.inventory).toHaveLength(1);
			expect(response.body.inventory[0].quantity).toBe(0);
		});
	});
});
