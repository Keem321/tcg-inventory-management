/**
 * Warehouse/Store Routes Tests
 * Tests for warehouse management endpoints with role-based access control
 */

const { describe, it, expect, beforeEach, afterEach } = require("vitest");
const request = require("supertest");
const express = require("express");
const session = require("express-session");
const Store = require("../../src/models/Store");
const User = require("../../src/models/User");

describe("Store Routes - Warehouse Management", () => {
	let app;
	let partnerUser;
	let managerUser;
	let employeeUser;
	let store1;
	let store2;
	let partnerSession;
	let managerSession;
	let employeeSession;

	beforeEach(async () => {
		// Clear database
		await User.deleteMany({});
		await Store.deleteMany({});

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
			currentCapacity: 500,
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
			currentCapacity: 750,
		});

		// Create test users
		partnerUser = await User.create({
			username: "partner1",
			email: "partner@tcg.com",
			password: "hashedpassword",
			firstName: "Partner",
			lastName: "User",
			role: "partner",
		});

		managerUser = await User.create({
			username: "manager1",
			email: "manager@tcg.com",
			password: "hashedpassword",
			firstName: "Manager",
			lastName: "User",
			role: "store-manager",
			assignedStoreId: store1._id,
		});

		employeeUser = await User.create({
			username: "employee1",
			email: "employee@tcg.com",
			password: "hashedpassword",
			firstName: "Employee",
			lastName: "User",
			role: "employee",
			assignedStoreId: store1._id,
		});

		// Setup Express app with session
		app = express();
		app.use(express.json());
		app.use(
			session({
				secret: "test-secret",
				resave: false,
				saveUninitialized: false,
			})
		);

		// Import and use the store routes
		const storeRoutes = require("../../src/routes/stores");
		app.use("/api/stores", storeRoutes);

		// Helper middleware to simulate authenticated sessions
		app.use((req, res, next) => {
			if (req.headers["x-test-user-id"]) {
				req.session.userId = req.headers["x-test-user-id"];
			}
			next();
		});
	});

	describe("GET /api/stores - List All Warehouses", () => {
		it("should allow partners to view all stores", async () => {
			const response = await request(app)
				.get("/api/stores")
				.set("x-test-user-id", partnerUser._id.toString());

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.stores).toHaveLength(2);
			expect(response.body.stores[0].name).toBeDefined();
			expect(response.body.stores[0].currentCapacity).toBeDefined();
			expect(response.body.stores[0].maxCapacity).toBeDefined();
		});

		it("should allow managers to view all stores", async () => {
			const response = await request(app)
				.get("/api/stores")
				.set("x-test-user-id", managerUser._id.toString());

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.stores).toHaveLength(2);
		});

		it("should deny access to employees", async () => {
			const response = await request(app)
				.get("/api/stores")
				.set("x-test-user-id", employeeUser._id.toString());

			expect(response.status).toBe(403);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain("access");
		});

		it("should deny access to unauthenticated users", async () => {
			const response = await request(app).get("/api/stores");

			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		it("should return stores with fullAddress virtual", async () => {
			const response = await request(app)
				.get("/api/stores")
				.set("x-test-user-id", partnerUser._id.toString());

			expect(response.body.stores[0].fullAddress).toBeDefined();
			expect(response.body.stores[0].fullAddress).toContain("Main St");
		});

		it("should return stores sorted by name", async () => {
			const response = await request(app)
				.get("/api/stores")
				.set("x-test-user-id", partnerUser._id.toString());

			const names = response.body.stores.map((s) => s.name);
			const sortedNames = [...names].sort();
			expect(names).toEqual(sortedNames);
		});
	});

	describe("GET /api/stores/:id - View Warehouse Details", () => {
		it("should allow partners to view any store details", async () => {
			const response = await request(app)
				.get(`/api/stores/${store1._id}`)
				.set("x-test-user-id", partnerUser._id.toString());

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.store.name).toBe("Downtown TCG Store");
			expect(response.body.store.location).toBeDefined();
			expect(response.body.store.maxCapacity).toBe(1000);
		});

		it("should allow managers to view their assigned store", async () => {
			const response = await request(app)
				.get(`/api/stores/${store1._id}`)
				.set("x-test-user-id", managerUser._id.toString());

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.store.name).toBe("Downtown TCG Store");
		});

		it("should deny managers access to other stores", async () => {
			const response = await request(app)
				.get(`/api/stores/${store2._id}`)
				.set("x-test-user-id", managerUser._id.toString());

			expect(response.status).toBe(403);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain("access");
		});

		it("should deny access to employees", async () => {
			const response = await request(app)
				.get(`/api/stores/${store1._id}`)
				.set("x-test-user-id", employeeUser._id.toString());

			expect(response.status).toBe(403);
			expect(response.body.success).toBe(false);
		});

		it("should return 404 for non-existent store", async () => {
			const fakeId = "507f1f77bcf86cd799439011";
			const response = await request(app)
				.get(`/api/stores/${fakeId}`)
				.set("x-test-user-id", partnerUser._id.toString());

			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
		});

		it("should return 400 for invalid store ID format", async () => {
			const response = await request(app)
				.get("/api/stores/invalid-id")
				.set("x-test-user-id", partnerUser._id.toString());

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});
	});

	describe("POST /api/stores - Create New Warehouse", () => {
		it("should allow partners to create a new store", async () => {
			const newStore = {
				name: "Northside TCG Store",
				location: {
					address: "789 Pine Rd",
					city: "Springfield",
					state: "IL",
					zipCode: "62703",
				},
				maxCapacity: 2000,
			};

			const response = await request(app)
				.post("/api/stores")
				.set("x-test-user-id", partnerUser._id.toString())
				.send(newStore);

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.store.name).toBe("Northside TCG Store");
			expect(response.body.store.maxCapacity).toBe(2000);
			expect(response.body.store.currentCapacity).toBe(0);

			// Verify it was actually created
			const created = await Store.findById(response.body.store._id);
			expect(created).toBeTruthy();
		});

		it("should deny managers from creating stores", async () => {
			const newStore = {
				name: "Test Store",
				location: {
					address: "123 Test St",
					city: "Test City",
					state: "IL",
					zipCode: "12345",
				},
				maxCapacity: 1000,
			};

			const response = await request(app)
				.post("/api/stores")
				.set("x-test-user-id", managerUser._id.toString())
				.send(newStore);

			expect(response.status).toBe(403);
			expect(response.body.success).toBe(false);
		});

		it("should deny employees from creating stores", async () => {
			const newStore = {
				name: "Test Store",
				location: {
					address: "123 Test St",
					city: "Test City",
					state: "IL",
					zipCode: "12345",
				},
				maxCapacity: 1000,
			};

			const response = await request(app)
				.post("/api/stores")
				.set("x-test-user-id", employeeUser._id.toString())
				.send(newStore);

			expect(response.status).toBe(403);
			expect(response.body.success).toBe(false);
		});

		it("should validate required fields", async () => {
			const invalidStore = {
				name: "Test Store",
				// missing location and maxCapacity
			};

			const response = await request(app)
				.post("/api/stores")
				.set("x-test-user-id", partnerUser._id.toString())
				.send(invalidStore);

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toBeDefined();
		});

		it("should validate location fields", async () => {
			const invalidStore = {
				name: "Test Store",
				location: {
					address: "123 Test St",
					// missing city, state, zipCode
				},
				maxCapacity: 1000,
			};

			const response = await request(app)
				.post("/api/stores")
				.set("x-test-user-id", partnerUser._id.toString())
				.send(invalidStore);

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it("should validate maxCapacity is positive", async () => {
			const invalidStore = {
				name: "Test Store",
				location: {
					address: "123 Test St",
					city: "Test City",
					state: "IL",
					zipCode: "12345",
				},
				maxCapacity: -100,
			};

			const response = await request(app)
				.post("/api/stores")
				.set("x-test-user-id", partnerUser._id.toString())
				.send(invalidStore);

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});
	});

	describe("PUT /api/stores/:id - Update Warehouse", () => {
		it("should allow partners to update any store", async () => {
			const updates = {
				maxCapacity: 1200,
				location: {
					address: "123 Main St",
					city: "Springfield",
					state: "IL",
					zipCode: "62701",
				},
			};

			const response = await request(app)
				.put(`/api/stores/${store1._id}`)
				.set("x-test-user-id", partnerUser._id.toString())
				.send(updates);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.store.maxCapacity).toBe(1200);

			// Verify update
			const updated = await Store.findById(store1._id);
			expect(updated.maxCapacity).toBe(1200);
		});

		it("should allow managers to update their assigned store", async () => {
			const updates = {
				maxCapacity: 1100,
			};

			const response = await request(app)
				.put(`/api/stores/${store1._id}`)
				.set("x-test-user-id", managerUser._id.toString())
				.send(updates);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.store.maxCapacity).toBe(1100);
		});

		it("should deny managers from updating other stores", async () => {
			const updates = {
				maxCapacity: 1600,
			};

			const response = await request(app)
				.put(`/api/stores/${store2._id}`)
				.set("x-test-user-id", managerUser._id.toString())
				.send(updates);

			expect(response.status).toBe(403);
			expect(response.body.success).toBe(false);
		});

		it("should deny employees from updating stores", async () => {
			const updates = {
				maxCapacity: 1100,
			};

			const response = await request(app)
				.put(`/api/stores/${store1._id}`)
				.set("x-test-user-id", employeeUser._id.toString())
				.send(updates);

			expect(response.status).toBe(403);
			expect(response.body.success).toBe(false);
		});

		it("should validate update data", async () => {
			const invalidUpdates = {
				maxCapacity: -500,
			};

			const response = await request(app)
				.put(`/api/stores/${store1._id}`)
				.set("x-test-user-id", partnerUser._id.toString())
				.send(invalidUpdates);

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it("should not allow updating currentCapacity directly", async () => {
			const updates = {
				currentCapacity: 999,
			};

			const response = await request(app)
				.put(`/api/stores/${store1._id}`)
				.set("x-test-user-id", partnerUser._id.toString())
				.send(updates);

			expect(response.status).toBe(200);
			const updated = await Store.findById(store1._id);
			expect(updated.currentCapacity).toBe(500); // Should remain unchanged
		});

		it("should return 404 for non-existent store", async () => {
			const fakeId = "507f1f77bcf86cd799439011";
			const response = await request(app)
				.put(`/api/stores/${fakeId}`)
				.set("x-test-user-id", partnerUser._id.toString())
				.send({ maxCapacity: 1000 });

			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
		});
	});

	describe("DELETE /api/stores/:id - Delete Warehouse", () => {
		it("should allow partners to delete a store", async () => {
			const response = await request(app)
				.delete(`/api/stores/${store2._id}`)
				.set("x-test-user-id", partnerUser._id.toString());

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.message).toContain("deleted");

			// Verify deletion
			const deleted = await Store.findById(store2._id);
			expect(deleted).toBeNull();
		});

		it("should deny managers from deleting stores", async () => {
			const response = await request(app)
				.delete(`/api/stores/${store1._id}`)
				.set("x-test-user-id", managerUser._id.toString());

			expect(response.status).toBe(403);
			expect(response.body.success).toBe(false);

			// Verify not deleted
			const stillExists = await Store.findById(store1._id);
			expect(stillExists).toBeTruthy();
		});

		it("should deny employees from deleting stores", async () => {
			const response = await request(app)
				.delete(`/api/stores/${store1._id}`)
				.set("x-test-user-id", employeeUser._id.toString());

			expect(response.status).toBe(403);
			expect(response.body.success).toBe(false);
		});

		it("should return 404 for non-existent store", async () => {
			const fakeId = "507f1f77bcf86cd799439011";
			const response = await request(app)
				.delete(`/api/stores/${fakeId}`)
				.set("x-test-user-id", partnerUser._id.toString());

			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
		});

		it("should prevent deletion of store with assigned users", async () => {
			// store1 has managerUser and employeeUser assigned
			const response = await request(app)
				.delete(`/api/stores/${store1._id}`)
				.set("x-test-user-id", partnerUser._id.toString());

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain("users");

			// Verify not deleted
			const stillExists = await Store.findById(store1._id);
			expect(stillExists).toBeTruthy();
		});
	});
});
