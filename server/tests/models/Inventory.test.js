/**
 * Tests for Inventory Model
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Inventory } from "../../src/models/Inventory.js";
import { Store } from "../../src/models/Store.js";
import { Product } from "../../src/models/Product.js";
import "../setup.js"; // Import test setup
import {
	storeFixtures,
	productFixtures,
	inventoryFixtures,
	boundaryFixtures,
} from "../fixtures/testData.js";
import {
	CARD_RARITIES,
	CARD_CONDITIONS,
	CARD_FINISHES,
	CONTAINER_TYPES,
	LOCATIONS,
	PRODUCT_TYPES,
} from "../../src/constants/enums.js";

describe("Inventory Model", () => {
	let testStore;
	let boosterProduct;
	let cardProduct1;
	let cardProduct2;

	beforeEach(async () => {
		// Create test store and products using fixtures
		testStore = await Store.create(storeFixtures.downtown());
		boosterProduct = await Product.create(productFixtures.boosterPack());
		cardProduct1 = await Product.create(productFixtures.singleCard());
		cardProduct2 = await Product.create(productFixtures.blackLotus());
	});

	describe("Schema Validation - Standard Inventory", () => {
		it("should create a valid standard inventory item", async () => {
			const inventory = new Inventory(
				inventoryFixtures.floor(testStore._id, boosterProduct._id)
			);
			const savedInventory = await inventory.save();

			expect(savedInventory._id).toBeDefined();
			expect(savedInventory.storeId.toString()).toBe(testStore._id.toString());
			expect(savedInventory.productId.toString()).toBe(
				boosterProduct._id.toString()
			);
			expect(savedInventory.quantity).toBe(50);
			expect(savedInventory.location).toBe(LOCATIONS.FLOOR);
			expect(savedInventory.minStockLevel).toBe(10);
			expect(savedInventory.cardContainer).toBeNull();
			expect(savedInventory.isActive).toBe(true);
			expect(savedInventory.createdAt).toBeInstanceOf(Date);
		});

		it("should create inventory in back location", async () => {
			const inventory = new Inventory(
				inventoryFixtures.back(testStore._id, boosterProduct._id)
			);
			const savedInventory = await inventory.save();

			expect(savedInventory.location).toBe(LOCATIONS.BACK);
		});

		it("should default minStockLevel to 0", async () => {
			const inventory = new Inventory(
				inventoryFixtures.floor(testStore._id, boosterProduct._id, {
					minStockLevel: undefined,
				})
			);
			const savedInventory = await inventory.save();

			expect(savedInventory.minStockLevel).toBe(0);
		});

		it("should default lastRestocked to null", async () => {
			const inventory = new Inventory(
				inventoryFixtures.floor(testStore._id, boosterProduct._id)
			);
			const savedInventory = await inventory.save();

			expect(savedInventory.lastRestocked).toBeNull();
		});

		it("should allow notes field", async () => {
			const inventory = new Inventory(
				inventoryFixtures.withNotes(testStore._id, boosterProduct._id)
			);
			const savedInventory = await inventory.save();

			expect(savedInventory.notes).toBe("Reserved for tournament");
		});

		it("should fail if storeId is missing", async () => {
			const inventoryData = inventoryFixtures.floor(
				testStore._id,
				boosterProduct._id
			);
			delete inventoryData.storeId;

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow();
		});

		it("should fail if productId is missing for standard inventory", async () => {
			const inventoryData = inventoryFixtures.floor(
				testStore._id,
				boosterProduct._id
			);
			delete inventoryData.productId;

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow(
				"Inventory validation failed: productId: Path `productId` is required."
			);
		});

		it("should fail if quantity is missing for standard inventory", async () => {
			const inventoryData = inventoryFixtures.floor(
				testStore._id,
				boosterProduct._id
			);
			delete inventoryData.quantity;

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow(
				"Inventory validation failed: quantity: Path `quantity` is required."
			);
		});

		it("should fail if location is missing", async () => {
			const inventoryData = inventoryFixtures.floor(
				testStore._id,
				boosterProduct._id
			);
			delete inventoryData.location;

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow();
		});

		it("should fail if location is invalid", async () => {
			const inventory = new Inventory(
				inventoryFixtures.floor(testStore._id, boosterProduct._id, {
					location: "warehouse",
				})
			);
			await expect(inventory.save()).rejects.toThrow();
		});

		it("should fail if quantity is negative", async () => {
			const inventory = new Inventory(
				inventoryFixtures.floor(testStore._id, boosterProduct._id, {
					quantity: -5,
				})
			);
			await expect(inventory.save()).rejects.toThrow();
		});

		it("should fail if minStockLevel is negative", async () => {
			const inventory = new Inventory(
				inventoryFixtures.floor(testStore._id, boosterProduct._id, {
					minStockLevel: -10,
				})
			);
			await expect(inventory.save()).rejects.toThrow();
		});
	});

	describe("Schema Validation - Card Containers", () => {
		it("should create a valid display case container", async () => {
			const inventory = new Inventory(
				inventoryFixtures.displayCase(testStore._id, [
					{ productId: cardProduct1._id, quantity: 10 },
					{ productId: cardProduct2._id, quantity: 2 },
				])
			);
			const savedInventory = await inventory.save();

			expect(savedInventory._id).toBeDefined();
			expect(savedInventory.cardContainer).toBeDefined();
			expect(savedInventory.cardContainer.containerType).toBe(
				CONTAINER_TYPES.DISPLAY_CASE
			);
			expect(savedInventory.cardContainer.containerName).toBe(
				"Display Case A3"
			);
			expect(savedInventory.cardContainer.containerUnitSize).toBe(5);
			expect(savedInventory.cardContainer.cardInventory).toHaveLength(2);
			expect(savedInventory.productId).toBeUndefined();
			expect(savedInventory.quantity).toBeUndefined();
		});

		it("should create a valid bulk box container", async () => {
			const inventory = new Inventory(
				inventoryFixtures.bulkBox(testStore._id, [
					{ productId: cardProduct1._id, quantity: 100 },
				])
			);
			const savedInventory = await inventory.save();

			expect(savedInventory.cardContainer.containerType).toBe(
				CONTAINER_TYPES.BULK_BOX
			);
		});

		it("should create a valid bulk bin container", async () => {
			const inventory = new Inventory(
				inventoryFixtures.bulkBin(testStore._id, [
					{ productId: cardProduct1._id, quantity: 500 },
					{ productId: cardProduct2._id, quantity: 50 },
				])
			);
			const savedInventory = await inventory.save();

			expect(savedInventory.cardContainer.containerType).toBe(
				CONTAINER_TYPES.BULK_BIN
			);
		});

		it("should allow empty cardInventory array for container", async () => {
			const inventory = new Inventory(
				inventoryFixtures.emptyContainer(testStore._id)
			);
			const savedInventory = await inventory.save();

			expect(savedInventory.cardContainer.cardInventory).toHaveLength(0);
		});

		it("should default containerUnitSize to 0", async () => {
			const inventory = new Inventory(
				inventoryFixtures.emptyContainer(testStore._id, {
					cardContainer: {
						containerType: CONTAINER_TYPES.DISPLAY_CASE,
						containerName: "Test Case",
						cardInventory: [],
					},
				})
			);
			const savedInventory = await inventory.save();

			expect(savedInventory.cardContainer.containerUnitSize).toBe(0);
		});

		it("should fail if container has invalid containerType", async () => {
			const inventory = new Inventory(
				inventoryFixtures.emptyContainer(testStore._id, {
					cardContainer: {
						containerType: "invalid-type",
						containerName: "Test Container",
						cardInventory: [],
					},
				})
			);
			await expect(inventory.save()).rejects.toThrow();
		});

		it("should fail if container missing containerType", async () => {
			const inventoryData = inventoryFixtures.emptyContainer(testStore._id);
			delete inventoryData.cardContainer.containerType;

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow();
		});

		it("should fail if container missing containerName", async () => {
			const inventoryData = inventoryFixtures.emptyContainer(testStore._id);
			delete inventoryData.cardContainer.containerName;

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow();
		});

		it("should fail if containerUnitSize is negative", async () => {
			const inventory = new Inventory(
				inventoryFixtures.emptyContainer(testStore._id, {
					cardContainer: {
						containerType: CONTAINER_TYPES.DISPLAY_CASE,
						containerName: "Test Case",
						containerUnitSize: -5,
						cardInventory: [],
					},
				})
			);
			await expect(inventory.save()).rejects.toThrow();
		});

		it("should fail if card in cardInventory has quantity less than 1", async () => {
			const inventory = new Inventory(
				inventoryFixtures.displayCase(testStore._id, [
					{ productId: cardProduct1._id, quantity: 0 },
				])
			);
			await expect(inventory.save()).rejects.toThrow();
		});
	});

	describe("Pre-save Validation - Mutual Exclusivity", () => {
		it("should fail if card container has productId", async () => {
			const inventoryData = inventoryFixtures.emptyContainer(testStore._id);
			inventoryData.productId = boosterProduct._id;

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow(
				"Card containers cannot have a productId"
			);
		});

		it("should fail if card container has quantity", async () => {
			const inventoryData = inventoryFixtures.emptyContainer(testStore._id);
			inventoryData.quantity = 30;

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow(
				"Card containers cannot have a quantity"
			);
		});

		it("should fail if standard inventory missing productId", async () => {
			const inventoryData = inventoryFixtures.floor(
				testStore._id,
				boosterProduct._id
			);
			delete inventoryData.productId;

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow(
				"Inventory validation failed: productId: Path `productId` is required."
			);
		});

		it("should fail if standard inventory missing quantity", async () => {
			const inventoryData = inventoryFixtures.floor(
				testStore._id,
				boosterProduct._id
			);
			delete inventoryData.quantity;

			const inventory = new Inventory(inventoryData);
			await expect(inventory.save()).rejects.toThrow(
				"Inventory validation failed: quantity: Path `quantity` is required."
			);
		});
	});

	describe("Virtual Properties", () => {
		it("should return true for isCardContainer virtual when cardContainer exists", async () => {
			const inventory = new Inventory(
				inventoryFixtures.emptyContainer(testStore._id)
			);
			const savedInventory = await inventory.save();

			expect(savedInventory.isCardContainer).toBe(true);
		});

		it("should return false for isCardContainer virtual when cardContainer is null", async () => {
			const inventory = new Inventory(
				inventoryFixtures.floor(testStore._id, boosterProduct._id, {
					quantity: 30,
				})
			);
			const savedInventory = await inventory.save();

			expect(savedInventory.isCardContainer).toBe(false);
		});

		it("should calculate totalCards virtual correctly", async () => {
			const inventory = new Inventory(
				inventoryFixtures.displayCase(testStore._id, [
					{ productId: cardProduct1._id, quantity: 10 },
					{ productId: cardProduct2._id, quantity: 5 },
				])
			);
			const savedInventory = await inventory.save();

			expect(savedInventory.totalCards).toBe(15);
		});

		it("should return 0 for totalCards when cardInventory is empty", async () => {
			const inventory = new Inventory(
				inventoryFixtures.emptyContainer(testStore._id)
			);
			const savedInventory = await inventory.save();

			expect(savedInventory.totalCards).toBe(0);
		});

		it("should return 0 for totalCards for standard inventory", async () => {
			const inventory = new Inventory(
				inventoryFixtures.floor(testStore._id, boosterProduct._id, {
					quantity: 30,
				})
			);
			const savedInventory = await inventory.save();

			expect(savedInventory.totalCards).toBe(0);
		});

		it("should calculate uniqueCardTypes virtual correctly", async () => {
			const inventory = new Inventory(
				inventoryFixtures.displayCase(testStore._id, [
					{ productId: cardProduct1._id, quantity: 10 },
					{ productId: cardProduct2._id, quantity: 5 },
				])
			);
			const savedInventory = await inventory.save();

			expect(savedInventory.uniqueCardTypes).toBe(2);
		});

		it("should return 0 for uniqueCardTypes when cardInventory is empty", async () => {
			const inventory = new Inventory(
				inventoryFixtures.emptyContainer(testStore._id)
			);
			const savedInventory = await inventory.save();

			expect(savedInventory.uniqueCardTypes).toBe(0);
		});

		it("should calculate effectiveUnitSize for card container", async () => {
			const inventory = new Inventory(
				inventoryFixtures.emptyContainer(testStore._id)
			);
			const savedInventory = await inventory.save();

			expect(savedInventory.effectiveUnitSize).toBe(5);
		});

		it("should calculate effectiveUnitSize for standard inventory with populated productId", async () => {
			const inventory = new Inventory(
				inventoryFixtures.floor(testStore._id, boosterProduct._id, {
					quantity: 10,
				})
			);
			const savedInventory = await inventory.save();
			await savedInventory.populate("productId");

			// boosterProduct has unitSize: 1, quantity is 10
			expect(savedInventory.effectiveUnitSize).toBe(10);
		});
	});

	describe("Static Methods - findByStore", () => {
		beforeEach(async () => {
			await Inventory.create([
				inventoryFixtures.floor(testStore._id, boosterProduct._id),
				inventoryFixtures.back(testStore._id, boosterProduct._id),
				inventoryFixtures.displayCase(testStore._id, [], {
					cardContainer: {
						containerType: CONTAINER_TYPES.DISPLAY_CASE,
						containerName: "Display A",
						cardInventory: [],
					},
				}),
			]);
		});

		it("should find all inventory at a store", async () => {
			const inventory = await Inventory.findByStore(testStore._id);
			expect(inventory).toHaveLength(3);
		});

		it("should filter by location - floor", async () => {
			const inventory = await Inventory.findByStore(testStore._id, {
				location: LOCATIONS.FLOOR,
			});
			expect(inventory).toHaveLength(2);
			expect(inventory.every((item) => item.location === LOCATIONS.FLOOR)).toBe(
				true
			);
		});

		it("should filter by location - back", async () => {
			const inventory = await Inventory.findByStore(testStore._id, {
				location: LOCATIONS.BACK,
			});
			expect(inventory).toHaveLength(1);
			expect(inventory[0].location).toBe(LOCATIONS.BACK);
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
			store2 = await Store.create(storeFixtures.seattle());

			await Inventory.create([
				inventoryFixtures.displayCase(testStore._id, [
					{ productId: cardProduct1._id, quantity: 10 },
					{ productId: cardProduct2._id, quantity: 2 },
				]),
				inventoryFixtures.bulkBox(testStore._id, [
					{ productId: cardProduct1._id, quantity: 100 },
				]),
				inventoryFixtures.displayCase(
					store2._id,
					[{ productId: cardProduct1._id, quantity: 5 }],
					{
						cardContainer: {
							containerType: CONTAINER_TYPES.DISPLAY_CASE,
							containerName: "Display B",
							cardInventory: [{ productId: cardProduct1._id, quantity: 5 }],
						},
					}
				),
				inventoryFixtures.displayCase(
					testStore._id,
					[{ productId: cardProduct2._id, quantity: 1 }],
					{
						cardContainer: {
							containerType: CONTAINER_TYPES.DISPLAY_CASE,
							containerName: "Display C",
							cardInventory: [{ productId: cardProduct2._id, quantity: 1 }],
						},
					}
				),
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
			const otherCard = await Product.create(
				productFixtures.singleCard({
					sku: "MTG-CARD-999",
					name: "Test Card",
					cardDetails: {
						set: "Test Set",
						cardNumber: "999",
						rarity: CARD_RARITIES.COMMON,
						condition: CARD_CONDITIONS.NEAR_MINT,
						finish: CARD_FINISHES.NON_FOIL,
					},
					basePrice: 1.0,
				})
			);

			const containers = await Inventory.findContainersWithCard(otherCard._id);
			expect(containers).toHaveLength(0);
		});
	});

	describe("Static Methods - findLowStock", () => {
		let store2;

		beforeEach(async () => {
			store2 = await Store.create(storeFixtures.seattle());

			await Inventory.create([
				inventoryFixtures.lowStock(testStore._id, boosterProduct._id),
				inventoryFixtures.floor(testStore._id, boosterProduct._id, {
					quantity: 15,
					location: LOCATIONS.BACK,
				}),
				inventoryFixtures.lowStock(store2._id, boosterProduct._id, {
					quantity: 3,
					minStockLevel: 20,
				}),
				inventoryFixtures.emptyContainer(testStore._id),
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
			await Inventory.create(
				inventoryFixtures.floor(testStore._id, boosterProduct._id, {
					quantity: 100,
				})
			);

			const lowStock = await Inventory.findLowStock();
			expect(lowStock).toHaveLength(0);
		});
	});

	describe("Static Methods - calculateStoreCapacity", () => {
		beforeEach(async () => {
			await Inventory.create([
				inventoryFixtures.floor(testStore._id, boosterProduct._id, {
					quantity: 10,
				}),
				inventoryFixtures.emptyContainer(testStore._id),
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
			const emptyStore = await Store.create(storeFixtures.denver());

			const capacity = await Inventory.calculateStoreCapacity(emptyStore._id);
			expect(capacity).toBe(0);
		});

		it("should only count active inventory", async () => {
			await Inventory.create(
				inventoryFixtures.inactive(testStore._id, boosterProduct._id)
			);

			const capacity = await Inventory.calculateStoreCapacity(testStore._id);
			// Should not include the inactive inventory
			expect(capacity).toBe(15);
		});
	});

	describe("Static Methods - getFloorDisplayQuantities", () => {
		let sleeveProduct;

		beforeEach(async () => {
			sleeveProduct = await Product.create(productFixtures.sleeves());

			await Inventory.create([
				inventoryFixtures.floor(testStore._id, boosterProduct._id),
				inventoryFixtures.back(testStore._id, boosterProduct._id),
				inventoryFixtures.floor(testStore._id, sleeveProduct._id, {
					quantity: 30,
				}),
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

			expect(quantities.byProductType[PRODUCT_TYPES.BOOSTER_PACK]).toBe(50);
			expect(quantities.byProductType[PRODUCT_TYPES.SLEEVES]).toBe(30);
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
			await Inventory.create(inventoryFixtures.emptyContainer(testStore._id));

			const quantities = await Inventory.getFloorDisplayQuantities(
				testStore._id
			);

			// Should still only have the 2 products
			expect(Object.keys(quantities.byProduct)).toHaveLength(2);
		});
	});

	describe("Inventory Updates", () => {
		it("should update quantity", async () => {
			const inventory = await Inventory.create(
				inventoryFixtures.floor(testStore._id, boosterProduct._id)
			);

			inventory.quantity = 75;
			await inventory.save();

			const updated = await Inventory.findById(inventory._id);
			expect(updated.quantity).toBe(75);
		});

		it("should update location", async () => {
			const inventory = await Inventory.create(
				inventoryFixtures.floor(testStore._id, boosterProduct._id)
			);

			inventory.location = LOCATIONS.BACK;
			await inventory.save();

			const updated = await Inventory.findById(inventory._id);
			expect(updated.location).toBe(LOCATIONS.BACK);
		});

		it("should update minStockLevel", async () => {
			const inventory = await Inventory.create(
				inventoryFixtures.floor(testStore._id, boosterProduct._id)
			);

			inventory.minStockLevel = 20;
			await inventory.save();

			const updated = await Inventory.findById(inventory._id);
			expect(updated.minStockLevel).toBe(20);
		});

		it("should update lastRestocked", async () => {
			const inventory = await Inventory.create(
				inventoryFixtures.floor(testStore._id, boosterProduct._id)
			);

			const restockDate = new Date("2025-01-01");
			inventory.lastRestocked = restockDate;
			await inventory.save();

			const updated = await Inventory.findById(inventory._id);
			expect(updated.lastRestocked).toEqual(restockDate);
		});

		it("should add cards to container cardInventory", async () => {
			const inventory = await Inventory.create(
				inventoryFixtures.emptyContainer(testStore._id)
			);

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
			const inventory = await Inventory.create(
				inventoryFixtures.floor(testStore._id, boosterProduct._id)
			);

			inventory.isActive = false;
			await inventory.save();

			const updated = await Inventory.findById(inventory._id);
			expect(updated.isActive).toBe(false);
		});
	});

	describe("Field Trimming", () => {
		it("should trim whitespace from notes", async () => {
			const inventory = await Inventory.create(
				inventoryFixtures.floor(testStore._id, boosterProduct._id, {
					notes: "  Test notes  ",
				})
			);

			expect(inventory.notes).toBe("Test notes");
		});

		it("should trim whitespace from containerName", async () => {
			const inventory = await Inventory.create(
				inventoryFixtures.emptyContainer(testStore._id, {
					cardContainer: {
						containerType: CONTAINER_TYPES.DISPLAY_CASE,
						containerName: "  Display Case A  ",
						cardInventory: [],
					},
				})
			);

			expect(inventory.cardContainer.containerName).toBe("Display Case A");
		});
	});

	describe("Edge Cases - Quantity Boundaries", () => {
		it("should accept zero quantity", async () => {
			const inventory = await Inventory.create(
				inventoryFixtures.outOfStock(testStore._id, boosterProduct._id)
			);

			expect(inventory.quantity).toBe(0);
		});

		it("should accept quantity of 1", async () => {
			const inventory = await Inventory.create(
				inventoryFixtures.floor(testStore._id, boosterProduct._id, {
					quantity: 1,
				})
			);

			expect(inventory.quantity).toBe(1);
		});

		it("should accept very large quantity", async () => {
			const inventory = await Inventory.create(
				inventoryFixtures.floor(testStore._id, boosterProduct._id, {
					quantity: boundaryFixtures.quantity.max,
				})
			);

			expect(inventory.quantity).toBe(999999);
		});

		it("should fail on negative quantity", async () => {
			await expect(
				Inventory.create({
					storeId: testStore._id,
					productId: boosterProduct._id,
					location: LOCATIONS.FLOOR,
					quantity: -5,
				})
			).rejects.toThrow();
		});
	});

	describe("Edge Cases - MinStockLevel Boundaries", () => {
		it("should default minStockLevel to 0", async () => {
			const inventory = await Inventory.create({
				storeId: testStore._id,
				productId: boosterProduct._id,
				location: LOCATIONS.FLOOR,
				quantity: 10,
			});

			expect(inventory.minStockLevel).toBe(0);
		});

		it("should accept minStockLevel of 1", async () => {
			const inventory = await Inventory.create(
				inventoryFixtures.floor(testStore._id, boosterProduct._id, {
					minStockLevel: 1,
				})
			);

			expect(inventory.minStockLevel).toBe(1);
		});

		it("should accept large minStockLevel", async () => {
			const inventory = await Inventory.create(
				inventoryFixtures.floor(testStore._id, boosterProduct._id, {
					minStockLevel: 1000,
				})
			);

			expect(inventory.minStockLevel).toBe(1000);
		});

		it("should fail on negative minStockLevel", async () => {
			await expect(
				Inventory.create({
					storeId: testStore._id,
					productId: boosterProduct._id,
					location: LOCATIONS.FLOOR,
					quantity: 10,
					minStockLevel: -5,
				})
			).rejects.toThrow();
		});
	});

	describe("Edge Cases - Card Container Boundaries", () => {
		it("should accept empty cardInventory array", async () => {
			const inventory = await Inventory.create(
				inventoryFixtures.emptyContainer(testStore._id)
			);

			expect(inventory.cardContainer.cardInventory).toHaveLength(0);
			expect(inventory.totalCards).toBe(0);
		});

		it("should accept single card in container", async () => {
			const inventory = await Inventory.create(
				inventoryFixtures.displayCase(testStore._id, [
					{
						productId: cardProduct1._id,
						quantity: 1,
					},
				])
			);

			expect(inventory.cardContainer.cardInventory).toHaveLength(1);
			expect(inventory.totalCards).toBe(1);
		});

		it("should accept many cards in container", async () => {
			const inventory = await Inventory.create(
				inventoryFixtures.bulkBin(testStore._id, [
					{ productId: cardProduct1._id, quantity: 500 },
					{ productId: cardProduct2._id, quantity: 300 },
				])
			);

			expect(inventory.totalCards).toBe(800);
		});

		it("should fail if cardInventory item has zero quantity", async () => {
			await expect(
				Inventory.create(
					inventoryFixtures.displayCase(testStore._id, [
						{
							productId: cardProduct1._id,
							quantity: 0,
						},
					])
				)
			).rejects.toThrow();
		});
	});

	describe("Edge Cases - Location Validation", () => {
		it("should accept 'floor' location", async () => {
			const inventory = await Inventory.create(
				inventoryFixtures.floor(testStore._id, boosterProduct._id)
			);

			expect(inventory.location).toBe(LOCATIONS.FLOOR);
		});

		it("should accept 'back' location", async () => {
			const inventory = await Inventory.create(
				inventoryFixtures.back(testStore._id, boosterProduct._id)
			);

			expect(inventory.location).toBe(LOCATIONS.BACK);
		});

		it("should fail on invalid location", async () => {
			await expect(
				Inventory.create(
					inventoryFixtures.floor(testStore._id, boosterProduct._id, {
						location: "invalid-location",
					})
				)
			).rejects.toThrow();
		});
	});
});
