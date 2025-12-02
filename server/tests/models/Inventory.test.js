/**
 * Tests for Inventory Model
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Inventory } from "../../src/models/Inventory.js";
import { Store } from "../../src/models/Store.js";
import { Product } from "../../src/models/Product.js";
import "../setup.js"; // Import test setup

describe("Inventory Model", () => {
	let testStore;
	let boosterProduct;
	let cardProduct1;
	let cardProduct2;

	beforeEach(async () => {
		// Create test store
		testStore = await Store.create({
			name: "Test Store",
			location: {
				address: "123 Main St",
				city: "Portland",
				state: "OR",
				zipCode: "97201",
			},
			maxCapacity: 10000,
			currentCapacity: 0,
		});

		// Create test products
		boosterProduct = await Product.create({
			sku: "MTG-BOOSTER-001",
			productType: "boosterPack",
			name: "Draft Booster",
			brand: "Magic: The Gathering",
			unitSize: 1,
			basePrice: 3.99,
		});

		cardProduct1 = await Product.create({
			sku: "MTG-CARD-001",
			productType: "singleCard",
			name: "Lightning Bolt",
			brand: "Magic: The Gathering",
			cardDetails: {
				set: "Alpha",
				cardNumber: "161",
				rarity: "common",
				condition: "near-mint",
				finish: "non-foil",
			},
			unitSize: 0,
			basePrice: 50.0,
		});

		cardProduct2 = await Product.create({
			sku: "MTG-CARD-002",
			productType: "singleCard",
			name: "Black Lotus",
			brand: "Magic: The Gathering",
			cardDetails: {
				set: "Alpha",
				cardNumber: "232",
				rarity: "rare",
				condition: "near-mint",
				finish: "non-foil",
			},
			unitSize: 0,
			basePrice: 15000.0,
		});
	});

	describe("Schema Validation - Standard Inventory", () => {
		it("should create a valid standard inventory item", async () => {
			const inventoryData = {
				storeId: testStore._id,
				productId: boosterProduct._id,
				quantity: 50,
				location: "floor",
				minStockLevel: 10,
			};

			const inventory = new Inventory(inventoryData);
			const savedInventory = await inventory.save();

			expect(savedInventory._id).toBeDefined();
			expect(savedInventory.storeId.toString()).toBe(testStore._id.toString());
			expect(savedInventory.productId.toString()).toBe(
				boosterProduct._id.toString()
			);
			expect(savedInventory.quantity).toBe(50);
			expect(savedInventory.location).toBe("floor");
			expect(savedInventory.minStockLevel).toBe(10);
			expect(savedInventory.cardContainer).toBeNull();
			expect(savedInventory.isActive).toBe(true);
			expect(savedInventory.createdAt).toBeInstanceOf(Date);
		});

		it("should create inventory in back location", async () => {
			const inventoryData = {
				storeId: testStore._id,
				productId: boosterProduct._id,
				quantity: 100,
				location: "back",
				minStockLevel: 20,
			};

			const inventory = new Inventory(inventoryData);
			const savedInventory = await inventory.save();

			expect(savedInventory.location).toBe("back");
		});

		it("should default minStockLevel to 0", async () => {
			const inventoryData = {
				storeId: testStore._id,
				productId: boosterProduct._id,
				quantity: 30,
				location: "floor",
			};

			const inventory = new Inventory(inventoryData);
			const savedInventory = await inventory.save();

			expect(savedInventory.minStockLevel).toBe(0);
		});

		it("should default lastRestocked to null", async () => {
			const inventoryData = {
				storeId: testStore._id,
				productId: boosterProduct._id,
				quantity: 30,
				location: "floor",
			};

			const inventory = new Inventory(inventoryData);
			const savedInventory = await inventory.save();

			expect(savedInventory.lastRestocked).toBeNull();
		});

		it("should allow notes field", async () => {
			const inventoryData = {
				storeId: testStore._id,
				productId: boosterProduct._id,
				quantity: 30,
				location: "floor",
				notes: "Reserved for tournament",
			};

			const inventory = new Inventory(inventoryData);
			const savedInventory = await inventory.save();

			expect(savedInventory.notes).toBe("Reserved for tournament");
		});

		it("should fail if storeId is missing", async () => {
			const inventoryData = {
				productId: boosterProduct._id,
				quantity: 30,
				location: "floor",
			};

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow();
		});

		it("should fail if productId is missing for standard inventory", async () => {
			const inventoryData = {
				storeId: testStore._id,
				quantity: 30,
				location: "floor",
			};

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow(
				"Inventory validation failed: productId: Path `productId` is required."
			);
		});

		it("should fail if quantity is missing for standard inventory", async () => {
			const inventoryData = {
				storeId: testStore._id,
				productId: boosterProduct._id,
				location: "floor",
			};

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow(
				"Inventory validation failed: quantity: Path `quantity` is required."
			);
		});

		it("should fail if location is missing", async () => {
			const inventoryData = {
				storeId: testStore._id,
				productId: boosterProduct._id,
				quantity: 30,
			};

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow();
		});

		it("should fail if location is invalid", async () => {
			const inventoryData = {
				storeId: testStore._id,
				productId: boosterProduct._id,
				quantity: 30,
				location: "warehouse",
			};

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow();
		});

		it("should fail if quantity is negative", async () => {
			const inventoryData = {
				storeId: testStore._id,
				productId: boosterProduct._id,
				quantity: -5,
				location: "floor",
			};

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow();
		});

		it("should fail if minStockLevel is negative", async () => {
			const inventoryData = {
				storeId: testStore._id,
				productId: boosterProduct._id,
				quantity: 30,
				location: "floor",
				minStockLevel: -10,
			};

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow();
		});
	});

	describe("Schema Validation - Card Containers", () => {
		it("should create a valid display case container", async () => {
			const inventoryData = {
				storeId: testStore._id,
				location: "floor",
				cardContainer: {
					containerType: "display-case",
					containerName: "Display Case A3",
					containerUnitSize: 5,
					cardInventory: [
						{ productId: cardProduct1._id, quantity: 10 },
						{ productId: cardProduct2._id, quantity: 2 },
					],
				},
			};

			const inventory = new Inventory(inventoryData);
			const savedInventory = await inventory.save();

			expect(savedInventory._id).toBeDefined();
			expect(savedInventory.cardContainer).toBeDefined();
			expect(savedInventory.cardContainer.containerType).toBe("display-case");
			expect(savedInventory.cardContainer.containerName).toBe(
				"Display Case A3"
			);
			expect(savedInventory.cardContainer.containerUnitSize).toBe(5);
			expect(savedInventory.cardContainer.cardInventory).toHaveLength(2);
			expect(savedInventory.productId).toBeUndefined();
			expect(savedInventory.quantity).toBeUndefined();
		});

		it("should create a valid bulk box container", async () => {
			const inventoryData = {
				storeId: testStore._id,
				location: "back",
				cardContainer: {
					containerType: "bulk-box",
					containerName: "Commons Box - Alpha",
					containerUnitSize: 3,
					cardInventory: [{ productId: cardProduct1._id, quantity: 100 }],
				},
			};

			const inventory = new Inventory(inventoryData);
			const savedInventory = await inventory.save();

			expect(savedInventory.cardContainer.containerType).toBe("bulk-box");
		});

		it("should create a valid bulk bin container", async () => {
			const inventoryData = {
				storeId: testStore._id,
				location: "floor",
				cardContainer: {
					containerType: "bulk-bin",
					containerName: "Bulk Bin - Floor 1",
					containerUnitSize: 10,
					cardInventory: [
						{ productId: cardProduct1._id, quantity: 500 },
						{ productId: cardProduct2._id, quantity: 50 },
					],
				},
			};

			const inventory = new Inventory(inventoryData);
			const savedInventory = await inventory.save();

			expect(savedInventory.cardContainer.containerType).toBe("bulk-bin");
		});

		it("should allow empty cardInventory array for container", async () => {
			const inventoryData = {
				storeId: testStore._id,
				location: "floor",
				cardContainer: {
					containerType: "display-case",
					containerName: "Empty Display Case",
					containerUnitSize: 5,
					cardInventory: [],
				},
			};

			const inventory = new Inventory(inventoryData);
			const savedInventory = await inventory.save();

			expect(savedInventory.cardContainer.cardInventory).toHaveLength(0);
		});

		it("should default containerUnitSize to 0", async () => {
			const inventoryData = {
				storeId: testStore._id,
				location: "floor",
				cardContainer: {
					containerType: "display-case",
					containerName: "Test Case",
					cardInventory: [],
				},
			};

			const inventory = new Inventory(inventoryData);
			const savedInventory = await inventory.save();

			expect(savedInventory.cardContainer.containerUnitSize).toBe(0);
		});

		it("should fail if container has invalid containerType", async () => {
			const inventoryData = {
				storeId: testStore._id,
				location: "floor",
				cardContainer: {
					containerType: "invalid-type",
					containerName: "Test Container",
					cardInventory: [],
				},
			};

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow();
		});

		it("should fail if container missing containerType", async () => {
			const inventoryData = {
				storeId: testStore._id,
				location: "floor",
				cardContainer: {
					containerName: "Test Container",
					cardInventory: [],
				},
			};

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow();
		});

		it("should fail if container missing containerName", async () => {
			const inventoryData = {
				storeId: testStore._id,
				location: "floor",
				cardContainer: {
					containerType: "display-case",
					cardInventory: [],
				},
			};

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow();
		});

		it("should fail if containerUnitSize is negative", async () => {
			const inventoryData = {
				storeId: testStore._id,
				location: "floor",
				cardContainer: {
					containerType: "display-case",
					containerName: "Test Case",
					containerUnitSize: -5,
					cardInventory: [],
				},
			};

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow();
		});

		it("should fail if card in cardInventory has quantity less than 1", async () => {
			const inventoryData = {
				storeId: testStore._id,
				location: "floor",
				cardContainer: {
					containerType: "display-case",
					containerName: "Test Case",
					cardInventory: [{ productId: cardProduct1._id, quantity: 0 }],
				},
			};

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow();
		});
	});

	describe("Pre-save Validation - Mutual Exclusivity", () => {
		it("should fail if card container has productId", async () => {
			const inventoryData = {
				storeId: testStore._id,
				productId: boosterProduct._id,
				location: "floor",
				cardContainer: {
					containerType: "display-case",
					containerName: "Test Case",
					cardInventory: [],
				},
			};

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow(
				"Card containers cannot have a productId"
			);
		});

		it("should fail if card container has quantity", async () => {
			const inventoryData = {
				storeId: testStore._id,
				quantity: 30,
				location: "floor",
				cardContainer: {
					containerType: "display-case",
					containerName: "Test Case",
					cardInventory: [],
				},
			};

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow(
				"Card containers cannot have a quantity"
			);
		});

		it("should fail if standard inventory missing productId", async () => {
			const inventoryData = {
				storeId: testStore._id,
				quantity: 30,
				location: "floor",
			};

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow(
				"Inventory validation failed: productId: Path `productId` is required."
			);
		});

		it("should fail if standard inventory missing quantity", async () => {
			const inventoryData = {
				storeId: testStore._id,
				productId: boosterProduct._id,
				location: "floor",
			};

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow(
				"Inventory validation failed: quantity: Path `quantity` is required."
			);
		});
	});

	describe("Virtual Properties", () => {
		it("should return true for isCardContainer virtual when cardContainer exists", async () => {
			const inventoryData = {
				storeId: testStore._id,
				location: "floor",
				cardContainer: {
					containerType: "display-case",
					containerName: "Test Case",
					cardInventory: [],
				},
			};

			const inventory = new Inventory(inventoryData);
			const savedInventory = await inventory.save();

			expect(savedInventory.isCardContainer).toBe(true);
		});

		it("should return false for isCardContainer virtual when cardContainer is null", async () => {
			const inventoryData = {
				storeId: testStore._id,
				productId: boosterProduct._id,
				quantity: 30,
				location: "floor",
			};

			const inventory = new Inventory(inventoryData);
			const savedInventory = await inventory.save();

			expect(savedInventory.isCardContainer).toBe(false);
		});

		it("should calculate totalCards virtual correctly", async () => {
			const inventoryData = {
				storeId: testStore._id,
				location: "floor",
				cardContainer: {
					containerType: "display-case",
					containerName: "Test Case",
					cardInventory: [
						{ productId: cardProduct1._id, quantity: 10 },
						{ productId: cardProduct2._id, quantity: 5 },
					],
				},
			};

			const inventory = new Inventory(inventoryData);
			const savedInventory = await inventory.save();

			expect(savedInventory.totalCards).toBe(15);
		});

		it("should return 0 for totalCards when cardInventory is empty", async () => {
			const inventoryData = {
				storeId: testStore._id,
				location: "floor",
				cardContainer: {
					containerType: "display-case",
					containerName: "Test Case",
					cardInventory: [],
				},
			};

			const inventory = new Inventory(inventoryData);
			const savedInventory = await inventory.save();

			expect(savedInventory.totalCards).toBe(0);
		});

		it("should return 0 for totalCards for standard inventory", async () => {
			const inventoryData = {
				storeId: testStore._id,
				productId: boosterProduct._id,
				quantity: 30,
				location: "floor",
			};

			const inventory = new Inventory(inventoryData);
			const savedInventory = await inventory.save();

			expect(savedInventory.totalCards).toBe(0);
		});

		it("should calculate uniqueCardTypes virtual correctly", async () => {
			const inventoryData = {
				storeId: testStore._id,
				location: "floor",
				cardContainer: {
					containerType: "display-case",
					containerName: "Test Case",
					cardInventory: [
						{ productId: cardProduct1._id, quantity: 10 },
						{ productId: cardProduct2._id, quantity: 5 },
					],
				},
			};

			const inventory = new Inventory(inventoryData);
			const savedInventory = await inventory.save();

			expect(savedInventory.uniqueCardTypes).toBe(2);
		});

		it("should return 0 for uniqueCardTypes when cardInventory is empty", async () => {
			const inventoryData = {
				storeId: testStore._id,
				location: "floor",
				cardContainer: {
					containerType: "display-case",
					containerName: "Test Case",
					cardInventory: [],
				},
			};

			const inventory = new Inventory(inventoryData);
			const savedInventory = await inventory.save();

			expect(savedInventory.uniqueCardTypes).toBe(0);
		});

		it("should calculate effectiveUnitSize for card container", async () => {
			const inventoryData = {
				storeId: testStore._id,
				location: "floor",
				cardContainer: {
					containerType: "display-case",
					containerName: "Test Case",
					containerUnitSize: 5,
					cardInventory: [],
				},
			};

			const inventory = new Inventory(inventoryData);
			const savedInventory = await inventory.save();

			expect(savedInventory.effectiveUnitSize).toBe(5);
		});

		it("should calculate effectiveUnitSize for standard inventory with populated productId", async () => {
			const inventoryData = {
				storeId: testStore._id,
				productId: boosterProduct._id,
				quantity: 10,
				location: "floor",
			};

			const inventory = new Inventory(inventoryData);
			const savedInventory = await inventory.save();
			await savedInventory.populate("productId");

			// boosterProduct has unitSize: 1, quantity is 10
			expect(savedInventory.effectiveUnitSize).toBe(10);
		});
	});

	describe("Static Methods - findByStore", () => {
		beforeEach(async () => {
			await Inventory.create([
				{
					storeId: testStore._id,
					productId: boosterProduct._id,
					quantity: 50,
					location: "floor",
				},
				{
					storeId: testStore._id,
					productId: boosterProduct._id,
					quantity: 100,
					location: "back",
				},
				{
					storeId: testStore._id,
					location: "floor",
					cardContainer: {
						containerType: "display-case",
						containerName: "Display A",
						cardInventory: [],
					},
				},
			]);
		});

		it("should find all inventory at a store", async () => {
			const inventory = await Inventory.findByStore(testStore._id);
			expect(inventory).toHaveLength(3);
		});

		it("should filter by location - floor", async () => {
			const inventory = await Inventory.findByStore(testStore._id, {
				location: "floor",
			});
			expect(inventory).toHaveLength(2);
			expect(inventory.every((item) => item.location === "floor")).toBe(true);
		});

		it("should filter by location - back", async () => {
			const inventory = await Inventory.findByStore(testStore._id, {
				location: "back",
			});
			expect(inventory).toHaveLength(1);
			expect(inventory[0].location).toBe("back");
		});

		it("should filter by productId", async () => {
			const inventory = await Inventory.findByStore(testStore._id, {
				productId: boosterProduct._id,
			});
			expect(inventory).toHaveLength(2);
		});
	});

	describe("Static Methods - findContainersWithCard", () => {
		let store2;

		beforeEach(async () => {
			store2 = await Store.create({
				name: "Store 2",
				location: {
					address: "456 Oak St",
					city: "Seattle",
					state: "WA",
					zipCode: "98101",
				},
				maxCapacity: 10000,
			});

			await Inventory.create([
				{
					storeId: testStore._id,
					location: "floor",
					cardContainer: {
						containerType: "display-case",
						containerName: "Display A",
						cardInventory: [
							{ productId: cardProduct1._id, quantity: 10 },
							{ productId: cardProduct2._id, quantity: 2 },
						],
					},
				},
				{
					storeId: testStore._id,
					location: "back",
					cardContainer: {
						containerType: "bulk-box",
						containerName: "Box 1",
						cardInventory: [{ productId: cardProduct1._id, quantity: 100 }],
					},
				},
				{
					storeId: store2._id,
					location: "floor",
					cardContainer: {
						containerType: "display-case",
						containerName: "Display B",
						cardInventory: [{ productId: cardProduct1._id, quantity: 5 }],
					},
				},
				{
					storeId: testStore._id,
					location: "floor",
					cardContainer: {
						containerType: "display-case",
						containerName: "Display C",
						cardInventory: [{ productId: cardProduct2._id, quantity: 1 }],
					},
				},
			]);
		});

		it("should find all containers with a specific card across all stores", async () => {
			const containers = await Inventory.findContainersWithCard(
				cardProduct1._id
			);
			expect(containers).toHaveLength(3);
		});

		it("should find containers with a specific card at a specific store", async () => {
			const containers = await Inventory.findContainersWithCard(
				cardProduct1._id,
				testStore._id
			);
			expect(containers).toHaveLength(2);
			expect(
				containers.every(
					(c) => c.storeId._id.toString() === testStore._id.toString()
				)
			).toBe(true);
		});

		it("should return empty array if card not in any container", async () => {
			const otherCard = await Product.create({
				sku: "MTG-CARD-999",
				productType: "singleCard",
				name: "Test Card",
				brand: "Magic: The Gathering",
				cardDetails: {
					set: "Test Set",
					cardNumber: "999",
					rarity: "common",
					condition: "near-mint",
					finish: "non-foil",
				},
				unitSize: 0,
				basePrice: 1.0,
			});

			const containers = await Inventory.findContainersWithCard(otherCard._id);
			expect(containers).toHaveLength(0);
		});
	});

	describe("Static Methods - findLowStock", () => {
		let store2;

		beforeEach(async () => {
			store2 = await Store.create({
				name: "Store 2",
				location: {
					address: "456 Oak St",
					city: "Seattle",
					state: "WA",
					zipCode: "98101",
				},
				maxCapacity: 10000,
			});

			await Inventory.create([
				{
					storeId: testStore._id,
					productId: boosterProduct._id,
					quantity: 5,
					location: "floor",
					minStockLevel: 10,
				},
				{
					storeId: testStore._id,
					productId: boosterProduct._id,
					quantity: 15,
					location: "back",
					minStockLevel: 10,
				},
				{
					storeId: store2._id,
					productId: boosterProduct._id,
					quantity: 3,
					location: "floor",
					minStockLevel: 20,
				},
				{
					storeId: testStore._id,
					location: "floor",
					cardContainer: {
						containerType: "display-case",
						containerName: "Display",
						cardInventory: [],
					},
				},
			]);
		});

		it("should find all low-stock items across all stores", async () => {
			const lowStock = await Inventory.findLowStock();
			expect(lowStock).toHaveLength(2);
			expect(lowStock.every((item) => item.quantity < item.minStockLevel)).toBe(
				true
			);
		});

		it("should find low-stock items at a specific store", async () => {
			const lowStock = await Inventory.findLowStock(testStore._id);
			expect(lowStock).toHaveLength(1);
			expect(lowStock[0].quantity).toBe(5);
			expect(lowStock[0].minStockLevel).toBe(10);
		});

		it("should not include card containers in low-stock results", async () => {
			const lowStock = await Inventory.findLowStock();
			expect(lowStock.every((item) => item.cardContainer === null)).toBe(true);
		});

		it("should return empty array if no low-stock items", async () => {
			await Inventory.deleteMany({});
			await Inventory.create({
				storeId: testStore._id,
				productId: boosterProduct._id,
				quantity: 100,
				location: "floor",
				minStockLevel: 10,
			});

			const lowStock = await Inventory.findLowStock();
			expect(lowStock).toHaveLength(0);
		});
	});

	describe("Static Methods - calculateStoreCapacity", () => {
		beforeEach(async () => {
			await Inventory.create([
				{
					storeId: testStore._id,
					productId: boosterProduct._id,
					quantity: 10,
					location: "floor",
				},
				{
					storeId: testStore._id,
					location: "floor",
					cardContainer: {
						containerType: "display-case",
						containerName: "Display",
						containerUnitSize: 5,
						cardInventory: [],
					},
				},
			]);
		});

		it("should calculate total capacity used at a store", async () => {
			const capacity = await Inventory.calculateStoreCapacity(testStore._id);
			// boosterProduct has unitSize: 1, quantity: 10 = 10
			// container has containerUnitSize: 5 = 5
			// Total = 15
			expect(capacity).toBe(15);
		});

		it("should return 0 for store with no inventory", async () => {
			const emptyStore = await Store.create({
				name: "Empty Store",
				location: {
					address: "789 Pine St",
					city: "Denver",
					state: "CO",
					zipCode: "80202",
				},
				maxCapacity: 10000,
			});

			const capacity = await Inventory.calculateStoreCapacity(emptyStore._id);
			expect(capacity).toBe(0);
		});

		it("should only count active inventory", async () => {
			await Inventory.create({
				storeId: testStore._id,
				productId: boosterProduct._id,
				quantity: 50,
				location: "floor",
				isActive: false,
			});

			const capacity = await Inventory.calculateStoreCapacity(testStore._id);
			// Should not include the inactive inventory
			expect(capacity).toBe(15);
		});
	});

	describe("Static Methods - getFloorDisplayQuantities", () => {
		let sleeveProduct;

		beforeEach(async () => {
			sleeveProduct = await Product.create({
				sku: "DS-SLEEVES-001",
				productType: "sleeves",
				name: "Matte Black",
				brand: "Dragon Shield",
				unitSize: 1.5,
				basePrice: 9.99,
			});

			await Inventory.create([
				{
					storeId: testStore._id,
					productId: boosterProduct._id,
					quantity: 50,
					location: "floor",
				},
				{
					storeId: testStore._id,
					productId: boosterProduct._id,
					quantity: 100,
					location: "back",
				},
				{
					storeId: testStore._id,
					productId: sleeveProduct._id,
					quantity: 30,
					location: "floor",
				},
			]);
		});

		it("should calculate floor display quantities by product", async () => {
			const quantities = await Inventory.getFloorDisplayQuantities(
				testStore._id
			);

			expect(quantities.byProduct[boosterProduct._id.toString()]).toBe(50);
			expect(quantities.byProduct[sleeveProduct._id.toString()]).toBe(30);
		});

		it("should calculate floor display quantities by product type", async () => {
			const quantities = await Inventory.getFloorDisplayQuantities(
				testStore._id
			);

			expect(quantities.byProductType["boosterPack"]).toBe(50);
			expect(quantities.byProductType["sleeves"]).toBe(30);
		});

		it("should calculate floor display quantities by brand", async () => {
			const quantities = await Inventory.getFloorDisplayQuantities(
				testStore._id
			);

			expect(quantities.byBrand["Magic: The Gathering"]).toBe(50);
			expect(quantities.byBrand["Dragon Shield"]).toBe(30);
		});

		it("should calculate floor display quantities by product type and brand", async () => {
			const quantities = await Inventory.getFloorDisplayQuantities(
				testStore._id
			);

			expect(
				quantities.byProductTypeAndBrand["boosterPack:Magic: The Gathering"]
			).toBe(50);
			expect(quantities.byProductTypeAndBrand["sleeves:Dragon Shield"]).toBe(
				30
			);
		});

		it("should only count floor location inventory", async () => {
			const quantities = await Inventory.getFloorDisplayQuantities(
				testStore._id
			);

			// Should be 50, not 150 (not including the 100 in back)
			expect(quantities.byProduct[boosterProduct._id.toString()]).toBe(50);
		});

		it("should not include card containers", async () => {
			await Inventory.create({
				storeId: testStore._id,
				location: "floor",
				cardContainer: {
					containerType: "display-case",
					containerName: "Display",
					cardInventory: [],
				},
			});

			const quantities = await Inventory.getFloorDisplayQuantities(
				testStore._id
			);

			// Should still only have the 2 products
			expect(Object.keys(quantities.byProduct)).toHaveLength(2);
		});
	});

	describe("Inventory Updates", () => {
		it("should update quantity", async () => {
			const inventory = await Inventory.create({
				storeId: testStore._id,
				productId: boosterProduct._id,
				quantity: 50,
				location: "floor",
			});

			inventory.quantity = 75;
			await inventory.save();

			const updated = await Inventory.findById(inventory._id);
			expect(updated.quantity).toBe(75);
		});

		it("should update location", async () => {
			const inventory = await Inventory.create({
				storeId: testStore._id,
				productId: boosterProduct._id,
				quantity: 50,
				location: "floor",
			});

			inventory.location = "back";
			await inventory.save();

			const updated = await Inventory.findById(inventory._id);
			expect(updated.location).toBe("back");
		});

		it("should update minStockLevel", async () => {
			const inventory = await Inventory.create({
				storeId: testStore._id,
				productId: boosterProduct._id,
				quantity: 50,
				location: "floor",
				minStockLevel: 10,
			});

			inventory.minStockLevel = 20;
			await inventory.save();

			const updated = await Inventory.findById(inventory._id);
			expect(updated.minStockLevel).toBe(20);
		});

		it("should update lastRestocked", async () => {
			const inventory = await Inventory.create({
				storeId: testStore._id,
				productId: boosterProduct._id,
				quantity: 50,
				location: "floor",
			});

			const restockDate = new Date("2025-01-01");
			inventory.lastRestocked = restockDate;
			await inventory.save();

			const updated = await Inventory.findById(inventory._id);
			expect(updated.lastRestocked).toEqual(restockDate);
		});

		it("should add cards to container cardInventory", async () => {
			const inventory = await Inventory.create({
				storeId: testStore._id,
				location: "floor",
				cardContainer: {
					containerType: "display-case",
					containerName: "Display A",
					cardInventory: [],
				},
			});

			inventory.cardContainer.cardInventory.push({
				productId: cardProduct1._id,
				quantity: 10,
			});
			await inventory.save();

			const updated = await Inventory.findById(inventory._id);
			expect(updated.cardContainer.cardInventory).toHaveLength(1);
			expect(updated.cardContainer.cardInventory[0].quantity).toBe(10);
		});

		it("should deactivate inventory", async () => {
			const inventory = await Inventory.create({
				storeId: testStore._id,
				productId: boosterProduct._id,
				quantity: 50,
				location: "floor",
			});

			inventory.isActive = false;
			await inventory.save();

			const updated = await Inventory.findById(inventory._id);
			expect(updated.isActive).toBe(false);
		});
	});

	describe("Field Trimming", () => {
		it("should trim whitespace from notes", async () => {
			const inventory = await Inventory.create({
				storeId: testStore._id,
				productId: boosterProduct._id,
				quantity: 50,
				location: "floor",
				notes: "  Test notes  ",
			});

			expect(inventory.notes).toBe("Test notes");
		});

		it("should trim whitespace from containerName", async () => {
			const inventory = await Inventory.create({
				storeId: testStore._id,
				location: "floor",
				cardContainer: {
					containerType: "display-case",
					containerName: "  Display Case A  ",
					cardInventory: [],
				},
			});

			expect(inventory.cardContainer.containerName).toBe("Display Case A");
		});
	});
});
