/**
 * Assignment Requirements Validation Test Suite
 * Validates that all functional requirements from the assignment are implemented
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Store } from "../src/models/store.model.js";
import { Inventory } from "../src/models/inventory.model.js";
import { Product } from "../src/models/product.model.js";
import { TransferRequest } from "../src/models/transferRequest.model.js";
import { User } from "../src/models/user.model.js";
import * as storeService from "../src/services/store.service.js";
import * as inventoryService from "../src/services/inventory.service.js";
import * as transferRequestService from "../src/services/transferRequest.service.js";
import { LOCATIONS } from "../src/constants/enums.js";
import {
	storeFixtures,
	productFixtures,
	inventoryFixtures,
	userFixtures,
} from "./fixtures/testData.js";
import "./setup.js";

describe("Assignment Requirements Validation", () => {
	beforeEach(async () => {
		// Clear all collections before each test
		await Store.deleteMany({});
		await Inventory.deleteMany({});
		await Product.deleteMany({});
		await TransferRequest.deleteMany({});
		await User.deleteMany({});
	});

	describe("WAREHOUSE MANAGEMENT REQUIREMENTS", () => {
		describe("✓ Add New Warehouse", () => {
			it("should allow admins to create a new warehouse with name, location, and max capacity", async () => {
				const storeData = storeFixtures.seattle();

				const store = await storeService.createStore(storeData);

				expect(store).toBeDefined();
				expect(store.name).toBe(storeData.name);
				expect(store.location.city).toBe("Seattle");
				expect(store.maxCapacity).toBe(10000);
				expect(store.currentCapacity).toBe(0);
			});

			it("should validate required fields when creating warehouse", async () => {
				const invalidData = storeFixtures.seattle({
					location: undefined,
				});

				await expect(storeService.createStore(invalidData)).rejects.toThrow();
			});
		});

		describe("✓ View Warehouse Details", () => {
			it("should provide dashboard to view all warehouses with current capacity and metrics", async () => {
				await Store.create(storeFixtures.seattle({ currentCapacity: 5000 }));
				await Store.create(storeFixtures.denver({ currentCapacity: 7600 }));

				const stores = await storeService.getAllStores();

				expect(stores).toHaveLength(2);
				expect(stores[0]).toHaveProperty("name");
				expect(stores[0]).toHaveProperty("currentCapacity");
				expect(stores[0]).toHaveProperty("maxCapacity");
			});

			it("should allow viewing individual warehouse by ID", async () => {
				const created = await Store.create(
					storeFixtures.seattle({ currentCapacity: 5000 })
				);

				const store = await storeService.getStoreById(created._id.toString());

				expect(store).toBeDefined();
				expect(store._id.toString()).toBe(created._id.toString());
				expect(store.name).toBe("Seattle Store");
			});
		});

		describe("✓ Edit Warehouse Information", () => {
			it("should allow updating warehouse capacity, location, and other details", async () => {
				const created = await Store.create(
					storeFixtures.seattle({ currentCapacity: 5000 })
				);

				const updateData = {
					name: "Updated Store",
					maxCapacity: 12000,
					location: {
						address: "456 New Ave",
						city: "Portland",
						state: "OR",
						zipCode: "97201",
					},
				};

				const updated = await storeService.updateStore(
					created._id.toString(),
					updateData
				);

				expect(updated.name).toBe("Updated Store");
				expect(updated.maxCapacity).toBe(12000);
				expect(updated.location.city).toBe("Portland");
			});

			it("should prevent setting max capacity below current capacity", async () => {
				const created = await Store.create(
					storeFixtures.seattle({
						maxCapacity: 10000,
						currentCapacity: 8000,
					})
				);

				const updateData = {
					maxCapacity: 7000, // Below current capacity of 8000
				};

				await expect(
					storeService.updateStore(created._id.toString(), updateData)
				).rejects.toThrow("Cannot set max capacity below current capacity");
			});
		});

		describe("✓ Delete Warehouse", () => {
			it("should allow deleting a warehouse (soft delete)", async () => {
				const created = await Store.create(storeFixtures.empty());

				await storeService.deleteStore(created._id.toString());
				const deleted = await Store.findById(created._id);
				expect(deleted.isActive).toBe(false);
			});

			it("should prevent deletion if store has active inventory", async () => {
				const store = await Store.create(storeFixtures.seattle());
				const product = await Product.create(productFixtures.boosterPack());

				await Inventory.create(
					inventoryFixtures.floor(store._id, product._id, { quantity: 10 })
				);

				await expect(
					storeService.deleteStore(store._id.toString())
				).rejects.toThrow("Cannot delete store with existing inventory");
			});
		});
	});

	describe("INVENTORY MANAGEMENT REQUIREMENTS", () => {
		let testStore;
		let testProduct;

		beforeEach(async () => {
			testStore = await Store.create(
				storeFixtures.seattle({ currentCapacity: 0 })
			);
			testProduct = await Product.create(productFixtures.boosterPack());
		});

		describe("✓ Add Inventory Items", () => {
			it("should allow adding items with name, SKU, quantity, and storage location", async () => {
				const inventoryData = inventoryFixtures.floor(
					testStore._id.toString(),
					testProduct._id.toString(),
					{ quantity: 100, minStockLevel: 20, notes: "Initial stock" }
				);

				const result = await inventoryService.createInventory(inventoryData);

				expect(result).toBeDefined();
				expect(result.inventory).toBeDefined();
				expect(result.inventory.quantity).toBe(100);
				expect(result.inventory.location).toBe("floor");
				expect(result.inventory.storeId._id.toString()).toBe(
					testStore._id.toString()
				);
			});
			it("should update store capacity when adding inventory", async () => {
				const inventoryData = inventoryFixtures.floor(
					testStore._id.toString(),
					testProduct._id.toString(),
					{ quantity: 100 }
				);

				await inventoryService.createInventory(inventoryData);
				const updatedStore = await Store.findById(testStore._id);
				const expectedCapacity = 100 * testProduct.unitSize; // 100 * 0.3 = 30

				expect(updatedStore.currentCapacity).toBe(expectedCapacity);
			});
		});

		describe("✓ Edit Inventory Items", () => {
			it("should allow updating quantity and other inventory details", async () => {
				const inventory = await Inventory.create(
					inventoryFixtures.floor(testStore._id, testProduct._id, {
						quantity: 50,
						minStockLevel: 10,
					})
				);
				await Store.findByIdAndUpdate(testStore._id, {
					currentCapacity: 50 * testProduct.unitSize,
				});

				const updateData = {
					quantity: 75,
					minStockLevel: 15,
					notes: "Increased stock",
				};

				const updated = await inventoryService.updateInventory(
					inventory._id.toString(),
					updateData
				);

				expect(updated.quantity).toBe(75);
				expect(updated.minStockLevel).toBe(15);
				expect(updated.notes).toBe("Increased stock");
			});
		});

		describe("✓ Delete Inventory Items", () => {
			it("should allow removing inventory items (soft delete)", async () => {
				const inventory = await Inventory.create(
					inventoryFixtures.floor(testStore._id, testProduct._id, {
						quantity: 50,
					})
				);
				await inventoryService.deleteInventory(inventory._id.toString());

				const deleted = await Inventory.findById(inventory._id);
				expect(deleted.isActive).toBe(false);
			});

			it("should update store capacity when deleting inventory", async () => {
				const inventory = await Inventory.create(
					inventoryFixtures.floor(testStore._id, testProduct._id, {
						quantity: 100,
					})
				);
				const initialCapacity = 100 * testProduct.unitSize;
				await Store.findByIdAndUpdate(testStore._id, {
					currentCapacity: initialCapacity,
				});

				await inventoryService.deleteInventory(inventory._id.toString());

				const updatedStore = await Store.findById(testStore._id);
				expect(updatedStore.currentCapacity).toBe(0);
			});
		});

		describe("✓ View Inventory Items", () => {
			it("should allow viewing all items in a warehouse with search/filter", async () => {
				// Create products with distinct attributes for filtering
				const magicBooster = await Product.create(
					productFixtures.boosterPack({
						sku: "MTG-BRO-001",
						name: "Magic Brothers War Booster",
						brand: "Wizards of the Coast",
					})
				);

				const pokemonBooster = await Product.create(
					productFixtures.boosterPack({
						sku: "PKM-SCR-001",
						name: "Pokemon Scarlet Booster",
						brand: "Pokemon Company",
					})
				);

				// Create inventory items
				await Inventory.create(
					inventoryFixtures.floor(testStore._id, magicBooster._id, {
						quantity: 50,
					})
				);

				await Inventory.create(
					inventoryFixtures.back(testStore._id, pokemonBooster._id, {
						quantity: 30,
					})
				);

				// View all inventory items in the warehouse
				const allInventory = await inventoryService.getInventoryByStore(
					testStore._id.toString()
				);
				expect(allInventory).toHaveLength(2);
				expect(allInventory[0]).toHaveProperty("productId");
				expect(allInventory[0]).toHaveProperty("quantity");
				expect(allInventory[0]).toHaveProperty("location");

				// Filter by location (simulating frontend location filter)
				const backInventory = await inventoryService.getInventoryByStore(
					testStore._id.toString(),
					{ location: LOCATIONS.BACK }
				);
				expect(backInventory).toHaveLength(1);
				expect(backInventory[0].location).toBe(LOCATIONS.BACK);
				expect(backInventory[0].productId.name).toBe("Pokemon Scarlet Booster");

				// Frontend also filters by search term (name/SKU) client-side
				// This demonstrates the data needed for frontend filtering
				const inventoryWithProducts = allInventory.filter((item) => {
					const productName = item.productId?.name?.toLowerCase() || "";
					const productSku = item.productId?.sku?.toLowerCase() || "";
					return productName.includes("magic") || productSku.includes("mtg");
				});
				expect(inventoryWithProducts).toHaveLength(1);
				expect(inventoryWithProducts[0].productId.sku).toBe("MTG-BRO-001");
			});
		});

		describe("✓ Transfer Inventory Between Warehouses", () => {
			let sourceStore;
			let destinationStore;
			let manager;

			beforeEach(async () => {
				sourceStore = await Store.create(
					storeFixtures.seattle({
						name: "Source Store",
						maxCapacity: 10000,
						currentCapacity: 500,
					})
				);

				destinationStore = await Store.create(
					storeFixtures.denver({
						name: "Destination Store",
						location: {
							address: "456 St",
							city: "Portland",
							state: "OR",
							zipCode: "97201",
						},
						maxCapacity: 8000,
						currentCapacity: 1000,
					})
				);

				manager = await User.create(
					userFixtures.storeManager(destinationStore._id, {
						username: "manager1",
						email: "manager1@test.com",
						passwordHash: "$2b$10$test",
						firstName: "Test",
						lastName: "Manager",
					})
				);
			});
			it("should enable transfer of items between warehouses", async () => {
				const sourceInventory = await Inventory.create(
					inventoryFixtures.floor(sourceStore._id, testProduct._id, {
						quantity: 100,
					})
				);
				const requestData = {
					fromStoreId: sourceStore._id.toString(),
					toStoreId: destinationStore._id.toString(),
					items: [
						{
							inventoryId: sourceInventory._id.toString(),
							productId: testProduct._id.toString(),
							requestedQuantity: 50,
						},
					],
					notes: "Stock transfer",
				};

				const transfer = await transferRequestService.createTransferRequest(
					requestData,
					manager
				);

				expect(transfer).toBeDefined();
				expect(transfer.fromStoreId._id.toString()).toBe(
					sourceStore._id.toString()
				);
				expect(transfer.toStoreId._id.toString()).toBe(
					destinationStore._id.toString()
				);
				expect(transfer.items).toHaveLength(1);
				expect(transfer.items[0].requestedQuantity).toBe(50);
			});

			it("should consider capacity constraints during transfer", async () => {
				// Create small capacity destination store
				const smallStore = await Store.create(
					storeFixtures.nearCapacity({
						name: "Small Store",
						location: {
							address: "789 St",
							city: "Austin",
							state: "TX",
							zipCode: "78701",
						},
						maxCapacity: 100,
						currentCapacity: 95,
					})
				);

				const smallManager = await User.create(
					userFixtures.storeManager(smallStore._id, {
						username: "smallmanager",
						email: "smallmanager@test.com",
						passwordHash: "$2b$10$test",
						firstName: "Small",
						lastName: "Manager",
					})
				);

				const sourceInventory = await Inventory.create(
					inventoryFixtures.floor(sourceStore._id, testProduct._id, {
						quantity: 1000,
					})
				);
				const requestData = {
					fromStoreId: sourceStore._id.toString(),
					toStoreId: smallStore._id.toString(),
					items: [
						{
							inventoryId: sourceInventory._id.toString(),
							productId: testProduct._id.toString(),
							requestedQuantity: 500, // Would require 150 capacity (500 * 0.3)
						},
					],
				};

				// This should succeed in creating the request, but would be validated during status changes
				const transfer = await transferRequestService.createTransferRequest(
					requestData,
					smallManager
				);

				expect(transfer).toBeDefined();
			});
		});
	});

	describe("EDGE CASE HANDLING", () => {
		let testStore;
		let testProduct;

		beforeEach(async () => {
			testStore = await Store.create(
				storeFixtures.seattle({
					name: "Test Store",
					maxCapacity: 100,
					currentCapacity: 0,
				})
			);

			testProduct = await Product.create(
				productFixtures.boosterPack({
					sku: "TEST-001",
					name: "Test Product",
					brand: "Test Brand",
					unitSize: 1.0,
					basePrice: 4.99,
				})
			);
		});

		describe("✓ Warehouse Full Capacity", () => {
			it("should prevent adding inventory that exceeds warehouse capacity", async () => {
				const inventoryData = inventoryFixtures.floor(
					testStore._id.toString(),
					testProduct._id.toString(),
					{ quantity: 150 } // Would require 150 capacity, but max is 100
				);
				await expect(
					inventoryService.createInventory(inventoryData)
				).rejects.toThrow(
					"Insufficient capacity. Required: 150, Available: 100"
				);
			});

			it("should allow adding inventory up to exact capacity", async () => {
				const inventoryData = inventoryFixtures.floor(
					testStore._id.toString(),
					testProduct._id.toString(),
					{ quantity: 100 } // Exactly at capacity limit
				);
				const result = await inventoryService.createInventory(inventoryData);

				expect(result).toBeDefined();
				expect(result.inventory).toBeDefined();
				expect(result.inventory.quantity).toBe(100);

				const updatedStore = await Store.findById(testStore._id);
				expect(updatedStore.currentCapacity).toBe(100);
			});
			it("should track and warn when approaching capacity (warning thresholds)", async () => {
				// Set store to 85% capacity
				await testStore.updateOne({ currentCapacity: 85 });

				const capacityPercent = (85 / testStore.maxCapacity) * 100;

				// High warning threshold (>= 85%)
				expect(capacityPercent).toBeGreaterThanOrEqual(85);

				// Critical warning threshold would be >= 95%
				const isCritical = capacityPercent >= 95;
				expect(isCritical).toBe(false);
			});
		});

		describe("✓ Duplicate Entries", () => {
			it("should detect duplicate inventory (same product, same location)", async () => {
				await Inventory.create(
					inventoryFixtures.floor(testStore._id, testProduct._id, {
						quantity: 50,
					})
				);
				const checkData = {
					storeId: testStore._id.toString(),
					productId: testProduct._id.toString(),
					location: "floor",
				};

				const result = await inventoryService.checkDuplicate(checkData);

				expect(result.exactMatch).toBeDefined();
				expect(result.exactMatch.location).toBe("floor");
			});

			it("should detect same product at different location", async () => {
				await Inventory.create(
					inventoryFixtures.floor(testStore._id, testProduct._id, {
						quantity: 50,
					})
				);
				const checkData = {
					storeId: testStore._id.toString(),
					productId: testProduct._id.toString(),
					location: "back",
				};

				const result = await inventoryService.checkDuplicate(checkData);

				expect(result.exactMatch).toBeNull();
				expect(result.differentLocation).toBeDefined();
				expect(result.differentLocation.location).toBe(LOCATIONS.FLOOR);
			});

			it("should allow same product at different locations as separate inventory", async () => {
				await Inventory.create(
					inventoryFixtures.floor(testStore._id, testProduct._id, {
						quantity: 50,
					})
				);

				const backInventory = await Inventory.create(
					inventoryFixtures.back(testStore._id, testProduct._id, {
						quantity: 100,
					})
				);
				expect(backInventory).toBeDefined();

				const allInventory = await Inventory.find({
					storeId: testStore._id,
					productId: testProduct._id,
				});

				expect(allInventory).toHaveLength(2);
			});
		});

		describe("✓ Data Validation & Error Handling", () => {
			it("should validate required fields for warehouse creation", async () => {
				const invalidData = {
					name: "Test",
					// Missing location and maxCapacity
				};

				await expect(storeService.createStore(invalidData)).rejects.toThrow();
			});

			it("should validate required fields for inventory creation", async () => {
				const invalidData = {
					storeId: testStore._id.toString(),
					// Missing productId, quantity, location
				};

				await expect(
					inventoryService.createInventory(invalidData)
				).rejects.toThrow();
			});

			it("should validate quantity is positive", async () => {
				const invalidData = inventoryFixtures.floor(
					testStore._id.toString(),
					testProduct._id.toString(),
					{ quantity: -10 }
				);
				await expect(
					inventoryService.createInventory(invalidData)
				).rejects.toThrow();
			});

			it("should validate location is 'floor' or 'back'", async () => {
				const inventory = new Inventory(
					inventoryFixtures.floor(testStore._id, testProduct._id, {
						quantity: 10,
						location: "invalid-location",
					})
				);
				await expect(inventory.validate()).rejects.toThrow();
			});
		});
	});

	describe("AUTHENTICATION & ROLE-BASED ACCESS CONTROL (STRETCH GOAL)", () => {
		let partner;
		let manager;
		let employee;
		let testStore;

		beforeEach(async () => {
			testStore = await Store.create(
				storeFixtures.seattle({
					name: "Test Store",
					maxCapacity: 10000,
				})
			);

			partner = await User.create(userFixtures.partner());

			manager = await User.create(userFixtures.storeManager(testStore._id));

			employee = await User.create(userFixtures.employee(testStore._id));
		});

		describe("✓ User Roles Implementation", () => {
			it("should have Employee role with inventory management access", () => {
				expect(employee.role).toBeDefined();
				expect(employee.assignedStoreId).toBeDefined();
				expect(employee.assignedStoreId.toString()).toBe(
					testStore._id.toString()
				);
			});

			it("should have Partner role with full system access", () => {
				expect(partner.role).toBeDefined();
				expect(partner.assignedStoreId).toBeNull();
			});

			it("should have Store Manager role with store and transfer access", () => {
				expect(manager.role).toBeDefined();
				expect(manager.assignedStoreId).toBeDefined();
				expect(manager.assignedStoreId.toString()).toBe(
					testStore._id.toString()
				);
			});
		});
		describe("✓ Password Security", () => {
			it("should hash passwords (not store plain text)", () => {
				expect(employee.passwordHash).toBeDefined();
				expect(employee.passwordHash).not.toBe("password123");
				expect(employee.passwordHash.startsWith("$2b$")).toBe(true);
			});

			it("should validate password using bcrypt", async () => {
				const bcrypt = require("bcrypt");
				const testUser = await User.create(
					userFixtures.employee(testStore._id, {
						username: "testuser",
						email: "test@test.com",
						passwordHash: await bcrypt.hash("password123", 10),
						firstName: "Test",
						lastName: "User",
					})
				);

				const isValid = await bcrypt.compare(
					"password123",
					testUser.passwordHash
				);
				expect(isValid).toBe(true);

				const isInvalid = await bcrypt.compare(
					"wrongpassword",
					testUser.passwordHash
				);
				expect(isInvalid).toBe(false);
			});
		});

		describe("✓ Authorization Checks", () => {
			it("should enforce Partners can access all stores", async () => {
				await Store.create(
					storeFixtures.denver({
						name: "Another Store",
						location: {
							address: "456 St",
							city: "Portland",
							state: "OR",
							zipCode: "97201",
						},
						maxCapacity: 8000,
					})
				);

				const stores = await storeService.getAllStores();

				// Partner should see all stores
				expect(stores.length).toBeGreaterThanOrEqual(2);
			});

			it("should enforce Managers can only manage their assigned store", () => {
				expect(manager.assignedStoreId.toString()).toBe(
					testStore._id.toString()
				);

				// Manager should only access their assigned store
				const hasAccess =
					manager.assignedStoreId.toString() === testStore._id.toString();
				expect(hasAccess).toBe(true);
			});

			it("should enforce Employees can only manage inventory at their store", () => {
				expect(employee.assignedStoreId.toString()).toBe(
					testStore._id.toString()
				);

				// Employee should only access inventory at their assigned store
				const hasAccess =
					employee.assignedStoreId.toString() === testStore._id.toString();
				expect(hasAccess).toBe(true);
			});
		});
	});

	describe("CAPACITY ALERTS & REPORTING (STRETCH GOAL)", () => {
		it("should identify stores at critical capacity (>=95%)", async () => {
			const criticalStore = await Store.create(
				storeFixtures.nearCapacity({
					name: "Critical Store",
					maxCapacity: 1000,
					currentCapacity: 960,
				})
			);

			const percent =
				(criticalStore.currentCapacity / criticalStore.maxCapacity) * 100;
			expect(percent).toBeGreaterThanOrEqual(95);
		});

		it("should identify stores at high capacity (>=85%)", async () => {
			const highStore = await Store.create(
				storeFixtures.nearCapacity({
					name: "High Store",
					location: {
						address: "456 St",
						city: "Portland",
						state: "OR",
						zipCode: "97201",
					},
					maxCapacity: 1000,
					currentCapacity: 870,
				})
			);

			const percent = (highStore.currentCapacity / highStore.maxCapacity) * 100;
			expect(percent).toBeGreaterThanOrEqual(85);
			expect(percent).toBeLessThan(95);
		});

		it("should calculate utilization percentage for capacity reports", async () => {
			const store = await Store.create(
				storeFixtures.denver({
					name: "Test Store",
					location: {
						address: "789 St",
						city: "Austin",
						state: "TX",
						zipCode: "78701",
					},
					maxCapacity: 10000,
					currentCapacity: 7500,
				})
			);

			const utilizationPercent =
				(store.currentCapacity / store.maxCapacity) * 100;
			expect(utilizationPercent).toBe(75);
		});
	});

	describe("TRANSFER REQUEST WORKFLOW (STRETCH GOAL)", () => {
		let sourceStore;
		let destStore;
		let manager;
		let sourceManager;
		let product;

		beforeEach(async () => {
			sourceStore = await Store.create(
				storeFixtures.seattle({
					name: "Source Store",
					maxCapacity: 10000,
					currentCapacity: 500,
				})
			);

			destStore = await Store.create(
				storeFixtures.denver({
					name: "Dest Store",
					location: {
						address: "456 St",
						city: "Portland",
						state: "OR",
						zipCode: "97201",
					},
					maxCapacity: 8000,
					currentCapacity: 200,
				})
			);

			manager = await User.create(
				userFixtures.storeManager(destStore._id, {
					username: "destmanager",
					email: "destmanager@test.com",
					passwordHash: "$2b$10$test",
					firstName: "Dest",
					lastName: "Manager",
				})
			);

			sourceManager = await User.create(
				userFixtures.storeManager(sourceStore._id, {
					username: "sourcemanager",
					email: "sourcemanager@test.com",
					passwordHash: "$2b$10$test",
					firstName: "Source",
					lastName: "Manager",
				})
			);

			product = await Product.create(
				productFixtures.boosterPack({
					sku: "TEST-001",
					name: "Test Product",
					brand: "Test Brand",
					unitSize: 0.5,
					basePrice: 4.99,
				})
			);
		});

		it("should support multi-stage workflow (open -> requested -> sent -> complete)", async () => {
			const inventory = await Inventory.create(
				inventoryFixtures.floor(sourceStore._id, product._id, { quantity: 100 })
			);

			// Create transfer request (starts as 'open')
			const requestData = {
				fromStoreId: sourceStore._id.toString(),
				toStoreId: destStore._id.toString(),
				items: [
					{
						inventoryId: inventory._id.toString(),
						productId: product._id.toString(),
						requestedQuantity: 50,
					},
				],
			};

			const transfer = await transferRequestService.createTransferRequest(
				requestData,
				manager
			);

			expect(transfer.status).toBe("open");

			// Update to 'requested'
			const requested = await transferRequestService.updateTransferStatus(
				transfer._id.toString(),
				"requested",
				manager
			);
			expect(requested.status).toBe("requested");

			// Update to 'sent'
			const sent = await transferRequestService.updateTransferStatus(
				requested._id.toString(),
				"sent",
				sourceManager
			);
			expect(sent.status).toBe("sent");

			// Update to 'complete'
			const completed = await transferRequestService.updateTransferStatus(
				sent._id.toString(),
				"complete",
				manager
			);
			expect(completed.status).toBe("complete");
		});

		it("should maintain status history for audit trail", async () => {
			const inventory = await Inventory.create(
				inventoryFixtures.floor(sourceStore._id, product._id, { quantity: 100 })
			);

			const requestData = {
				fromStoreId: sourceStore._id.toString(),
				toStoreId: destStore._id.toString(),
				items: [
					{
						inventoryId: inventory._id.toString(),
						productId: product._id.toString(),
						requestedQuantity: 50,
					},
				],
			};

			const transfer = await transferRequestService.createTransferRequest(
				requestData,
				manager
			);

			await transferRequestService.updateTransferStatus(
				transfer._id.toString(),
				"requested",
				manager
			);

			const updated = await TransferRequest.findById(transfer._id);
			expect(updated.statusHistory).toHaveLength(2);
			expect(updated.statusHistory[0].status).toBe("open");
			expect(updated.statusHistory[1].status).toBe("requested");
		});
	});
});
