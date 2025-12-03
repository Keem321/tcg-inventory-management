/**
 * Product Routes Tests
 * Tests for product CRUD endpoints with role-based access control
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import session from "express-session";
import { Product } from "../../src/models/Product.js";
import { Inventory } from "../../src/models/Inventory.js";
import { Store } from "../../src/models/Store.js";
import { User } from "../../src/models/User.js";
import productRoutes from "../../src/routes/products.js";
import "../setup.js";
import {
	userFixtures,
	storeFixtures,
	productFixtures,
	boundaryFixtures,
	edgeCases,
} from "../fixtures/testData.js";

describe("Product Routes", () => {
	let app;
	let partnerUser;
	let managerUser;
	let store1;
	let store2;
	let product1;
	let product2;
	let cardProduct;

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

		// Create test products
		product1 = await Product.create({
			sku: "DECK-001",
			productType: "deck",
			name: "Commander Deck",
			description: "Pre-constructed Commander deck",
			brand: "Wizards of the Coast",
			unitSize: 100,
			basePrice: 39.99,
		});

		product2 = await Product.create({
			sku: "SLEEVES-001",
			productType: "sleeves",
			name: "Dragon Shield Sleeves",
			description: "100 count card sleeves",
			brand: "Dragon Shield",
			unitSize: 100,
			basePrice: 9.99,
		});

		cardProduct = await Product.create({
			sku: "MTG-LTR-001",
			productType: "singleCard",
			name: "The One Ring",
			description: "Legendary Artifact",
			brand: "Wizards of the Coast",
			cardDetails: {
				set: "Lord of the Rings",
				cardNumber: "246",
				rarity: "mythic",
				condition: "near-mint",
				finish: "non-foil",
			},
			unitSize: 0,
			basePrice: 89.99,
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

		app.use("/api/products", productRoutes);
	});

	describe("GET /api/products", () => {
		describe("Authorization", () => {
			it("should require authentication", async () => {
				const response = await request(app).get("/api/products");

				expect(response.status).toBe(401);
				expect(response.body.success).toBe(false);
			});

			it("should allow partner access", async () => {
				const response = await request(app)
					.get("/api/products")
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);
			});

			it("should deny manager access", async () => {
				const response = await request(app)
					.get("/api/products")
					.set("x-test-user-id", managerUser._id.toString());

				expect(response.status).toBe(403);
			});
		});

		describe("Functionality", () => {
			it("should return all active products", async () => {
				const response = await request(app)
					.get("/api/products")
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(200);
				expect(response.body.products).toHaveLength(3);
			});

			it("should filter by product type", async () => {
				const response = await request(app)
					.get("/api/products?productType=singleCard")
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(200);
				expect(response.body.products).toHaveLength(1);
				expect(response.body.products[0].productType).toBe("singleCard");
			});

			it("should filter by brand", async () => {
				const response = await request(app)
					.get("/api/products?brand=Dragon Shield")
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(200);
				expect(response.body.products).toHaveLength(1);
				expect(response.body.products[0].brand).toBe("Dragon Shield");
			});

			it("should support text search", async () => {
				const response = await request(app)
					.get("/api/products?search=Ring")
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(200);
				expect(response.body.products.length).toBeGreaterThan(0);
			});

			it("should exclude inactive products by default", async () => {
				await Product.create({
					sku: "INACTIVE-001",
					productType: "other",
					name: "Inactive Product",
					brand: "Test",
					unitSize: 1,
					basePrice: 1.0,
					isActive: false,
				});

				const response = await request(app)
					.get("/api/products")
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.body.products.every((p) => p.isActive)).toBe(true);
			});
		});
	});

	describe("GET /api/products/:id", () => {
		describe("Authorization", () => {
			it("should require authentication", async () => {
				const response = await request(app).get(
					`/api/products/${product1._id}`
				);

				expect(response.status).toBe(401);
			});

			it("should allow partner access", async () => {
				const response = await request(app)
					.get(`/api/products/${product1._id}`)
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);
			});

			it("should deny manager access", async () => {
				const response = await request(app)
					.get(`/api/products/${product1._id}`)
					.set("x-test-user-id", managerUser._id.toString());

				expect(response.status).toBe(403);
			});
		});

		describe("Functionality", () => {
			it("should return product details", async () => {
				const response = await request(app)
					.get(`/api/products/${product1._id}`)
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(200);
				expect(response.body.product.sku).toBe("DECK-001");
				expect(response.body.product.name).toBe("Commander Deck");
			});

			it("should return inventory breakdown", async () => {
				// Create inventory for product
				await Inventory.create({
					storeId: store1._id,
					productId: product1._id,
					location: "floor",
					quantity: 10,
				});

				await Inventory.create({
					storeId: store2._id,
					productId: product1._id,
					location: "back",
					quantity: 5,
				});

				const response = await request(app)
					.get(`/api/products/${product1._id}`)
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(200);
				expect(response.body.inventory.totalQuantity).toBe(15);
				expect(response.body.inventory.stores).toHaveLength(2);
			});

			it("should handle product with no inventory", async () => {
				const response = await request(app)
					.get(`/api/products/${product1._id}`)
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(200);
				expect(response.body.inventory.totalQuantity).toBe(0);
				expect(response.body.inventory.stores).toHaveLength(0);
			});

			it("should return 404 for non-existent product", async () => {
				const fakeId = "507f1f77bcf86cd799439011";
				const response = await request(app)
					.get(`/api/products/${fakeId}`)
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(404);
			});

			it("should return 400 for invalid product ID", async () => {
				const response = await request(app)
					.get("/api/products/invalid-id")
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(400);
			});
		});
	});

	describe("POST /api/products", () => {
		describe("Authorization", () => {
			it("should require authentication", async () => {
				const response = await request(app).post("/api/products").send({
					sku: "TEST-001",
					productType: "other",
					name: "Test Product",
					brand: "Test",
					unitSize: 1,
					basePrice: 1.0,
				});

				expect(response.status).toBe(401);
			});

			it("should allow partner access", async () => {
				const response = await request(app)
					.post("/api/products")
					.set("x-test-user-id", partnerUser._id.toString())
					.send({
						sku: "TEST-001",
						productType: "other",
						name: "Test Product",
						brand: "Test",
						unitSize: 1,
						basePrice: 1.0,
					});

				expect(response.status).toBe(201);
			});

			it("should deny manager access", async () => {
				const response = await request(app)
					.post("/api/products")
					.set("x-test-user-id", managerUser._id.toString())
					.send({
						sku: "TEST-001",
						productType: "other",
						name: "Test Product",
						brand: "Test",
						unitSize: 1,
						basePrice: 1.0,
					});

				expect(response.status).toBe(403);
			});
		});

		describe("Validation", () => {
			it("should create valid product", async () => {
				const response = await request(app)
					.post("/api/products")
					.set("x-test-user-id", partnerUser._id.toString())
					.send({
						sku: "NEW-001",
						productType: "boosterPack",
						name: "New Booster Pack",
						description: "Latest set booster",
						brand: "Wizards of the Coast",
						unitSize: 15,
						basePrice: 4.99,
					});

				expect(response.status).toBe(201);
				expect(response.body.success).toBe(true);
				expect(response.body.product.sku).toBe("NEW-001");
			});

			it("should reject duplicate SKU", async () => {
				const response = await request(app)
					.post("/api/products")
					.set("x-test-user-id", partnerUser._id.toString())
					.send({
						sku: "DECK-001",
						productType: "deck",
						name: "Another Deck",
						brand: "Test",
						unitSize: 60,
						basePrice: 29.99,
					});

				expect(response.status).toBe(400);
				expect(response.body.message).toContain("already exists");
			});

			it("should reject missing required fields", async () => {
				const response = await request(app)
					.post("/api/products")
					.set("x-test-user-id", partnerUser._id.toString())
					.send({
						sku: "INCOMPLETE-001",
						productType: "other",
					});

				expect(response.status).toBe(400);
			});

			it("should create card product with card details", async () => {
				const response = await request(app)
					.post("/api/products")
					.set("x-test-user-id", partnerUser._id.toString())
					.send({
						sku: "MTG-NEW-001",
						productType: "singleCard",
						name: "Lightning Bolt",
						brand: "Wizards of the Coast",
						cardDetails: {
							set: "Core Set 2021",
							cardNumber: "125",
							rarity: "common",
							condition: "near-mint",
							finish: "non-foil",
						},
						unitSize: 0,
						basePrice: 0.25,
					});

				expect(response.status).toBe(201);
				expect(response.body.product.cardDetails).toBeDefined();
				expect(response.body.product.cardDetails.set).toBe("Core Set 2021");
			});
		});
	});

	describe("PUT /api/products/:id", () => {
		describe("Authorization", () => {
			it("should require authentication", async () => {
				const response = await request(app)
					.put(`/api/products/${product1._id}`)
					.send({ basePrice: 49.99 });

				expect(response.status).toBe(401);
			});

			it("should allow partner access", async () => {
				const response = await request(app)
					.put(`/api/products/${product1._id}`)
					.set("x-test-user-id", partnerUser._id.toString())
					.send({ basePrice: 49.99 });

				expect(response.status).toBe(200);
			});

			it("should deny manager access", async () => {
				const response = await request(app)
					.put(`/api/products/${product1._id}`)
					.set("x-test-user-id", managerUser._id.toString())
					.send({ basePrice: 49.99 });

				expect(response.status).toBe(403);
			});
		});

		describe("Functionality", () => {
			it("should update product fields", async () => {
				const response = await request(app)
					.put(`/api/products/${product1._id}`)
					.set("x-test-user-id", partnerUser._id.toString())
					.send({
						name: "Updated Commander Deck",
						basePrice: 44.99,
						description: "Updated description",
					});

				expect(response.status).toBe(200);
				expect(response.body.product.name).toBe("Updated Commander Deck");
				expect(response.body.product.basePrice).toBe(44.99);
			});

			it("should update isActive status", async () => {
				const response = await request(app)
					.put(`/api/products/${product1._id}`)
					.set("x-test-user-id", partnerUser._id.toString())
					.send({ isActive: false });

				expect(response.status).toBe(200);
				expect(response.body.product.isActive).toBe(false);
			});

			it("should return 404 for non-existent product", async () => {
				const fakeId = "507f1f77bcf86cd799439011";
				const response = await request(app)
					.put(`/api/products/${fakeId}`)
					.set("x-test-user-id", partnerUser._id.toString())
					.send({ basePrice: 10.0 });

				expect(response.status).toBe(404);
			});

			it("should return 400 for invalid product ID", async () => {
				const response = await request(app)
					.put("/api/products/invalid-id")
					.set("x-test-user-id", partnerUser._id.toString())
					.send({ basePrice: 10.0 });

				expect(response.status).toBe(400);
			});
		});
	});

	describe("DELETE /api/products/:id", () => {
		describe("Authorization", () => {
			it("should require authentication", async () => {
				const response = await request(app).delete(
					`/api/products/${product1._id}`
				);

				expect(response.status).toBe(401);
			});

			it("should allow partner access", async () => {
				const response = await request(app)
					.delete(`/api/products/${product1._id}`)
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(200);
			});

			it("should deny manager access", async () => {
				const response = await request(app)
					.delete(`/api/products/${product1._id}`)
					.set("x-test-user-id", managerUser._id.toString());

				expect(response.status).toBe(403);
			});
		});

		describe("Functionality", () => {
			it("should delete product with no inventory", async () => {
				const response = await request(app)
					.delete(`/api/products/${product1._id}`)
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);

				const deleted = await Product.findById(product1._id);
				expect(deleted).toBeNull();
			});

			it("should prevent deletion of product with inventory", async () => {
				await Inventory.create({
					storeId: store1._id,
					productId: product1._id,
					location: "floor",
					quantity: 5,
				});

				const response = await request(app)
					.delete(`/api/products/${product1._id}`)
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(400);
				expect(response.body.message).toContain("inventory records");

				const stillExists = await Product.findById(product1._id);
				expect(stillExists).not.toBeNull();
			});

			it("should return 404 for non-existent product", async () => {
				const fakeId = "507f1f77bcf86cd799439011";
				const response = await request(app)
					.delete(`/api/products/${fakeId}`)
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(404);
			});

			it("should return 400 for invalid product ID", async () => {
				const response = await request(app)
					.delete("/api/products/invalid-id")
					.set("x-test-user-id", partnerUser._id.toString());

				expect(response.status).toBe(400);
			});
		});
	});

	describe("Edge Cases - Price Validation", () => {
		it("should accept product with zero price", async () => {
			const productData = productFixtures.commanderDeck({
				sku: "FREE-001",
				basePrice: boundaryFixtures.price.zero,
			});

			const response = await request(app)
				.post("/api/products")
				.set("x-test-user-id", partnerUser._id.toString())
				.send(productData);

			expect(response.status).toBe(201);
			expect(response.body.product.basePrice).toBe(0);
		});

		it("should accept product with minimum price", async () => {
			const productData = productFixtures.commanderDeck({
				sku: "PENNY-001",
				basePrice: boundaryFixtures.price.penny,
			});

			const response = await request(app)
				.post("/api/products")
				.set("x-test-user-id", partnerUser._id.toString())
				.send(productData);

			expect(response.status).toBe(201);
			expect(response.body.product.basePrice).toBe(0.01);
		});

		it("should reject product with negative price", async () => {
			const productData = productFixtures.commanderDeck({
				sku: "NEGATIVE-001",
				basePrice: -10.99,
			});

			const response = await request(app)
				.post("/api/products")
				.set("x-test-user-id", partnerUser._id.toString())
				.send(productData);

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});
	});

	describe("Edge Cases - Invalid Product IDs", () => {
		it("should return 400 for malformed product ID on GET", async () => {
			const response = await request(app)
				.get(`/api/products/${edgeCases.invalidIds.malformed}`)
				.set("x-test-user-id", partnerUser._id.toString());

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it("should return 400 for malformed product ID on PUT", async () => {
			const response = await request(app)
				.put(`/api/products/${edgeCases.invalidIds.malformed}`)
				.set("x-test-user-id", partnerUser._id.toString())
				.send({ name: "Updated Name" });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it("should return 400 for malformed product ID on DELETE", async () => {
			const response = await request(app)
				.delete(`/api/products/${edgeCases.invalidIds.malformed}`)
				.set("x-test-user-id", partnerUser._id.toString());

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it("should return 404 for non-existent but valid ObjectId", async () => {
			const response = await request(app)
				.get(`/api/products/${edgeCases.invalidIds.nonExistent}`)
				.set("x-test-user-id", partnerUser._id.toString());

			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
		});
	});

	describe("Edge Cases - Input Sanitization", () => {
		it("should trim whitespace from product fields", async () => {
			const productData = {
				sku: "  TRIM-001  ",
				productType: "deck",
				name: "  Test Product  ",
				brand: "  Test Brand  ",
				unitSize: 100,
				basePrice: 29.99,
			};

			const response = await request(app)
				.post("/api/products")
				.set("x-test-user-id", partnerUser._id.toString())
				.send(productData);

			expect(response.status).toBe(201);
			expect(response.body.product.sku).toBe("TRIM-001");
			expect(response.body.product.name).toBe("Test Product");
			expect(response.body.product.brand).toBe("Test Brand");
		});

		it("should handle special characters in product name", async () => {
			const productData = productFixtures.commanderDeck({
				sku: "SPECIAL-001",
				name: edgeCases.specialChars.unicode,
			});

			const response = await request(app)
				.post("/api/products")
				.set("x-test-user-id", partnerUser._id.toString())
				.send(productData);

			expect(response.status).toBe(201);
			expect(response.body.product.name).toBe(edgeCases.specialChars.unicode);
		});
	});
});
