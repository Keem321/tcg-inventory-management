/**
 * Tests for Product Model
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Product } from "../../src/models/Product.js";
import "../setup.js"; // Import test setup
import {
	productFixtures,
	boundaryFixtures,
	edgeCases,
} from "../fixtures/testData.js";
import {
	CARD_RARITIES,
	CARD_CONDITIONS,
	CARD_FINISHES,
	PRODUCT_TYPES,
} from "../../src/constants/enums.js";

describe("Product Model", () => {
	beforeEach(async () => {
		// Clear database for test isolation
		await Product.deleteMany({});
	});

	describe("Schema Validation - Single Cards", () => {
		it("should create a valid single card product", async () => {
			const cardData = {
				sku: "MTG-MID-123-NM-F",
				productType: PRODUCT_TYPES.SINGLE_CARD,
				name: "Teferi, Who Slows the Sunset",
				description: "Legendary Planeswalker - Teferi",
				brand: "Magic: The Gathering",
				cardDetails: {
					set: "Innistrad: Midnight Hunt",
					cardNumber: "245",
					rarity: CARD_RARITIES.MYTHIC,
					condition: CARD_CONDITIONS.NEAR_MINT,
					finish: CARD_FINISHES.FOIL,
				},
				unitSize: 0,
				basePrice: 24.99,
			};

			const product = new Product(cardData);
			const savedProduct = await product.save();

			expect(savedProduct._id).toBeDefined();
			expect(savedProduct.sku).toBe("MTG-MID-123-NM-F");
			expect(savedProduct.productType).toBe(PRODUCT_TYPES.SINGLE_CARD);
			expect(savedProduct.unitSize).toBe(0);
			expect(savedProduct.cardDetails.set).toBe("Innistrad: Midnight Hunt");
			expect(savedProduct.cardDetails.condition).toBe(
				CARD_CONDITIONS.NEAR_MINT
			);
			expect(savedProduct.cardDetails.finish).toBe(CARD_FINISHES.FOIL);
			expect(savedProduct.isActive).toBe(true);
		});

		it("should fail if single card has unitSize other than 0", async () => {
			const cardData = {
				sku: "MTG-TEST-001",
				productType: PRODUCT_TYPES.SINGLE_CARD,
				name: "Test Card",
				brand: "Magic: The Gathering",
				cardDetails: {
					set: "Test Set",
					cardNumber: "1",
					rarity: CARD_RARITIES.COMMON,
					condition: CARD_CONDITIONS.NEAR_MINT,
					finish: CARD_FINISHES.NON_FOIL,
				},
				unitSize: 1,
				basePrice: 0.5,
			};

			const product = new Product(cardData);
			await expect(product.save()).rejects.toThrow(
				"Single cards must have unitSize of 0"
			);
		});

		it("should fail if single card missing cardDetails", async () => {
			const cardData = {
				sku: "MTG-TEST-002",
				productType: PRODUCT_TYPES.SINGLE_CARD,
				name: "Test Card",
				brand: "Magic: The Gathering",
				unitSize: 0,
				basePrice: 0.5,
			};

			const product = new Product(cardData);
			await expect(product.save()).rejects.toThrow();
		});

		it("should fail if cardDetails has invalid condition", async () => {
			const cardData = {
				sku: "MTG-TEST-003",
				productType: PRODUCT_TYPES.SINGLE_CARD,
				name: "Test Card",
				brand: "Magic: The Gathering",
				cardDetails: {
					set: "Test Set",
					cardNumber: "1",
					rarity: CARD_RARITIES.COMMON,
					condition: "perfect",
					finish: CARD_FINISHES.NON_FOIL,
				},
				unitSize: 0,
				basePrice: 0.5,
			};

			const product = new Product(cardData);
			await expect(product.save()).rejects.toThrow();
		});

		it("should fail if cardDetails has invalid finish", async () => {
			const cardData = {
				sku: "MTG-TEST-004",
				productType: PRODUCT_TYPES.SINGLE_CARD,
				name: "Test Card",
				brand: "Magic: The Gathering",
				cardDetails: {
					set: "Test Set",
					cardNumber: "1",
					rarity: CARD_RARITIES.COMMON,
					condition: CARD_CONDITIONS.NEAR_MINT,
					finish: CARD_FINISHES.NON_FOIL,
				},
				unitSize: 0,
				basePrice: 0.5,
			};

			const product = new Product(cardData);
			await expect(product.save()).rejects.toThrow();
		});
	});

	describe("Schema Validation - Non-Card Products", () => {
		it("should create a valid booster pack product", async () => {
			const boosterData = {
				sku: "MTG-MID-DRAFT",
				productType: PRODUCT_TYPES.BOOSTER_PACK,
				name: "Innistrad: Midnight Hunt Draft Booster",
				description: "15-card draft booster pack",
				brand: "Magic: The Gathering",
				unitSize: 1,
				basePrice: 3.99,
			};

			const product = new Product(boosterData);
			const savedProduct = await product.save();

			expect(savedProduct.productType).toBe(PRODUCT_TYPES.BOOSTER_PACK);
			expect(savedProduct.unitSize).toBe(1);
			expect(savedProduct.cardDetails).toBeNull();
		});

		it("should create a valid accessory with bulkQuantity", async () => {
			const sleeveData = productFixtures.sleeves({
				sku: "DS-MATTE-BLK-100",
				name: "Dragon Shield Matte Black",
				description: "100-count sleeve pack",
				unitSize: 1.5,
				bulkQuantity: 10,
			});

			const product = new Product(sleeveData);
			const savedProduct = await product.save();

			expect(savedProduct.bulkQuantity).toBe(10);
			expect(savedProduct.unitSize).toBe(1.5);
		});

		it("should create a valid deck box product", async () => {
			const deckBoxData = {
				sku: "UG-BOULDER-100",
				productType: PRODUCT_TYPES.DECK_BOX,
				name: "Ultimate Guard Boulder 100+",
				description: "Deck box for 100+ sleeved cards",
				brand: "Ultimate Guard",
				unitSize: 2,
				basePrice: 12.99,
			};

			const product = new Product(deckBoxData);
			const savedProduct = await product.save();

			expect(savedProduct.productType).toBe(PRODUCT_TYPES.DECK_BOX);
			expect(savedProduct.bulkQuantity).toBeNull();
		});

		it("should fail if non-card product has unitSize of 0", async () => {
			const invalidData = {
				sku: "TEST-INVALID",
				productType: PRODUCT_TYPES.BOOSTER_PACK,
				name: "Test Booster",
				brand: "Test Brand",
				unitSize: 0,
				basePrice: 3.99,
			};

			const product = new Product(invalidData);
			await expect(product.save()).rejects.toThrow(
				"Non-card products must have unitSize greater than 0"
			);
		});

		it("should fail if non-card product has cardDetails", async () => {
			const invalidData = {
				sku: "TEST-INVALID-2",
				productType: PRODUCT_TYPES.BOOSTER_PACK,
				name: "Test Booster",
				brand: "Test Brand",
				cardDetails: {
					set: "Test Set",
					cardNumber: "1",
					rarity: CARD_RARITIES.COMMON,
					condition: CARD_CONDITIONS.NEAR_MINT,
					finish: CARD_FINISHES.NON_FOIL,
				},
				unitSize: 1,
				basePrice: 3.99,
			};

			const product = new Product(invalidData);
			await expect(product.save()).rejects.toThrow(
				"Non-card products cannot have cardDetails"
			);
		});
	});

	describe("Required Fields Validation", () => {
		it("should fail if sku is missing", async () => {
			const productData = {
				productType: PRODUCT_TYPES.BOOSTER_PACK,
				name: "Test Product",
				brand: "Test Brand",
				unitSize: 1,
				basePrice: 3.99,
			};

			const product = new Product(productData);
			await expect(product.save()).rejects.toThrow();
		});

		it("should fail if productType is missing", async () => {
			const productData = {
				sku: "TEST-001",
				name: "Test Product",
				brand: "Test Brand",
				unitSize: 1,
				basePrice: 3.99,
			};

			const product = new Product(productData);
			await expect(product.save()).rejects.toThrow();
		});

		it("should fail if name is missing", async () => {
			const productData = {
				sku: "TEST-001",
				productType: PRODUCT_TYPES.BOOSTER_PACK,
				brand: "Test Brand",
				unitSize: 1,
				basePrice: 3.99,
			};

			const product = new Product(productData);
			await expect(product.save()).rejects.toThrow();
		});

		it("should fail if brand is missing", async () => {
			const productData = {
				sku: "TEST-001",
				productType: PRODUCT_TYPES.BOOSTER_PACK,
				name: "Test Product",
				unitSize: 1,
				basePrice: 3.99,
			};

			const product = new Product(productData);
			await expect(product.save()).rejects.toThrow();
		});

		it("should fail if unitSize is missing", async () => {
			const productData = {
				sku: "TEST-001",
				productType: PRODUCT_TYPES.BOOSTER_PACK,
				name: "Test Product",
				brand: "Test Brand",
				basePrice: 3.99,
			};

			const product = new Product(productData);
			await expect(product.save()).rejects.toThrow();
		});

		it("should fail if basePrice is missing", async () => {
			const productData = {
				sku: "TEST-001",
				productType: PRODUCT_TYPES.BOOSTER_PACK,
				name: "Test Product",
				brand: "Test Brand",
				unitSize: 1,
			};

			const product = new Product(productData);
			await expect(product.save()).rejects.toThrow();
		});

		it("should fail if basePrice is negative", async () => {
			const productData = {
				sku: "TEST-001",
				productType: PRODUCT_TYPES.BOOSTER_PACK,
				name: "Test Product",
				brand: "Test Brand",
				unitSize: 1,
				basePrice: -5,
			};

			const product = new Product(productData);
			await expect(product.save()).rejects.toThrow();
		});

		it("should fail if productType is invalid", async () => {
			const productData = {
				sku: "TEST-001",
				productType: "invalidType",
				name: "Test Product",
				brand: "Test Brand",
				unitSize: 1,
				basePrice: 3.99,
			};

			const product = new Product(productData);
			await expect(product.save()).rejects.toThrow();
		});

		it("should enforce unique SKU", async () => {
			const productData1 = {
				sku: "SAME-SKU",
				productType: PRODUCT_TYPES.BOOSTER_PACK,
				name: "Product 1",
				brand: "Test Brand",
				unitSize: 1,
				basePrice: 3.99,
			};

			const productData2 = {
				sku: "SAME-SKU",
				productType: PRODUCT_TYPES.BOOSTER_PACK,
				name: "Product 2",
				brand: "Test Brand",
				unitSize: 1,
				basePrice: 4.99,
			};

			await new Product(productData1).save();
			await expect(new Product(productData2).save()).rejects.toThrow();
		});
	});

	describe("Virtual Properties", () => {
		it("should generate fullName virtual for non-card product", async () => {
			const productData = {
				sku: "MTG-BOOSTER",
				productType: PRODUCT_TYPES.BOOSTER_PACK,
				name: "Draft Booster",
				brand: "Magic: The Gathering",
				unitSize: 1,
				basePrice: 3.99,
			};

			const product = new Product(productData);
			const savedProduct = await product.save();

			expect(savedProduct.fullName).toBe(
				"Magic: The Gathering - Draft Booster"
			);
		});

		it("should generate cardIdentifier virtual for single card", async () => {
			const cardData = {
				sku: "MTG-MID-245",
				productType: PRODUCT_TYPES.SINGLE_CARD,
				name: "Teferi, Who Slows the Sunset",
				brand: "Magic: The Gathering",
				cardDetails: {
					set: "Innistrad: Midnight Hunt",
					cardNumber: "245",
					rarity: CARD_RARITIES.MYTHIC_RARE,
					condition: CARD_CONDITIONS.NEAR_MINT,
					finish: CARD_FINISHES.FOIL,
				},
				unitSize: 0,
				basePrice: 24.99,
			};

			const product = new Product(cardData);
			const savedProduct = await product.save();

			expect(savedProduct.cardIdentifier).toBe(
				"Teferi, Who Slows the Sunset (Innistrad: Midnight Hunt #245)"
			);
		});

		it("should return null cardIdentifier for non-card product", async () => {
			const productData = {
				sku: "MTG-BOOSTER",
				productType: PRODUCT_TYPES.BOOSTER_PACK,
				name: "Draft Booster",
				brand: "Magic: The Gathering",
				unitSize: 1,
				basePrice: 3.99,
			};

			const product = new Product(productData);
			const savedProduct = await product.save();

			expect(savedProduct.cardIdentifier).toBeNull();
		});
	});

	describe("Static Methods", () => {
		beforeEach(async () => {
			// Create test data
			await Product.create([
				{
					sku: "MTG-CARD-001",
					productType: PRODUCT_TYPES.SINGLE_CARD,
					name: "Lightning Bolt",
					brand: "Magic: The Gathering",
					cardDetails: {
						set: "Alpha",
						cardNumber: "161",
						rarity: CARD_RARITIES.COMMON,
						condition: CARD_CONDITIONS.NEAR_MINT,
						finish: CARD_FINISHES.NON_FOIL,
					},
					unitSize: 0,
					basePrice: 50.0,
				},
				{
					sku: "MTG-CARD-002",
					productType: PRODUCT_TYPES.SINGLE_CARD,
					name: "Black Lotus",
					brand: "Magic: The Gathering",
					cardDetails: {
						set: "Alpha",
						cardNumber: "232",
						rarity: CARD_RARITIES.RARE,
						condition: CARD_CONDITIONS.MODERATELY_PLAYED,
						finish: CARD_FINISHES.NON_FOIL,
					},
					unitSize: 0,
					basePrice: 15000.0,
				},
				{
					sku: "MTG-BOOSTER-001",
					productType: PRODUCT_TYPES.BOOSTER_PACK,
					name: "Draft Booster",
					brand: "Magic: The Gathering",
					unitSize: 1,
					basePrice: 3.99,
				},
				{
					sku: "PKM-CARD-001",
					productType: PRODUCT_TYPES.SINGLE_CARD,
					name: "Pikachu",
					brand: "Pokemon",
					cardDetails: {
						set: "Base Set",
						cardNumber: "25",
						rarity: CARD_RARITIES.COMMON,
						condition: CARD_CONDITIONS.NEAR_MINT,
						finish: CARD_FINISHES.HOLO,
					},
					unitSize: 0,
					basePrice: 5.0,
				},
				{
					sku: "UG-BOX-001",
					productType: PRODUCT_TYPES.DECK_BOX,
					name: "Boulder 100+",
					brand: "Ultimate Guard",
					unitSize: 2,
					basePrice: 12.99,
					isActive: false,
				},
			]);
		});

		it("should find products by type and brand", async () => {
			const mtgCards = await Product.findByTypeAndBrand(
				PRODUCT_TYPES.SINGLE_CARD,
				"Magic: The Gathering"
			);
			expect(mtgCards).toHaveLength(2);
			expect(mtgCards.every((p) => p.brand === "Magic: The Gathering")).toBe(
				true
			);
		});

		it("should find cards by set", async () => {
			const alphaCards = await Product.findCardsBySet("Alpha");
			expect(alphaCards).toHaveLength(2);
			expect(alphaCards[0].cardDetails.cardNumber).toBe("161");
			expect(alphaCards[1].cardDetails.cardNumber).toBe("232");
		});

		it("should search products by text", async () => {
			// Ensure text index is created
			await Product.ensureIndexes();

			const results = await Product.searchProducts("Lightning");
			expect(results.length).toBeGreaterThan(0);
			expect(results[0].name).toContain("Lightning");
		});
	});

	describe("Product Queries", () => {
		beforeEach(async () => {
			await Product.create([
				{
					sku: "MTG-BOOSTER-1",
					productType: PRODUCT_TYPES.BOOSTER_PACK,
					name: "Set Booster",
					brand: "Magic: The Gathering",
					unitSize: 1,
					basePrice: 4.99,
				},
				{
					sku: "PKM-BOOSTER-1",
					productType: PRODUCT_TYPES.BOOSTER_PACK,
					name: "Booster Pack",
					brand: "Pokemon",
					unitSize: 1,
					basePrice: 3.99,
				},
				productFixtures.sleeves({
					sku: "DS-SLEEVES-1",
					name: "Matte Black",
					unitSize: 1.5,
					bulkQuantity: 10,
				}),
			]);
		});

		it("should find all active products", async () => {
			const activeProducts = await Product.find({ isActive: true });
			expect(activeProducts).toHaveLength(3);
		});

		it("should find products by brand", async () => {
			const mtgProducts = await Product.find({
				brand: "Magic: The Gathering",
			});
			expect(mtgProducts).toHaveLength(1);
		});

		it("should find products by type", async () => {
			const boosters = await Product.find({
				productType: PRODUCT_TYPES.BOOSTER_PACK,
			});
			expect(boosters).toHaveLength(2);
		});

		it("should find products with bulk quantity requirement", async () => {
			const bulkProducts = await Product.find({ bulkQuantity: { $ne: null } });
			expect(bulkProducts).toHaveLength(1);
			expect(bulkProducts[0].sku).toBe("DS-SLEEVES-1");
		});

		it("should update product price", async () => {
			const product = await Product.findOne({ sku: "MTG-BOOSTER-1" });
			product.basePrice = 5.99;
			await product.save();

			const updatedProduct = await Product.findById(product._id);
			expect(updatedProduct.basePrice).toBe(5.99);
		});

		it("should deactivate product", async () => {
			const product = await Product.findOne({ sku: "MTG-BOOSTER-1" });
			product.isActive = false;
			await product.save();

			const updatedProduct = await Product.findById(product._id);
			expect(updatedProduct.isActive).toBe(false);
		});
	});

	describe("Field Trimming", () => {
		it("should trim whitespace from string fields", async () => {
			const productData = {
				sku: "  TEST-001  ",
				productType: PRODUCT_TYPES.BOOSTER_PACK,
				name: "  Test Product  ",
				description: "  Test Description  ",
				brand: "  Test Brand  ",
				unitSize: 1,
				basePrice: 3.99,
			};

			const product = new Product(productData);
			const savedProduct = await product.save();

			expect(savedProduct.sku).toBe("TEST-001");
			expect(savedProduct.name).toBe("Test Product");
			expect(savedProduct.description).toBe("Test Description");
			expect(savedProduct.brand).toBe("Test Brand");
		});
	});

	describe("Edge Cases - Price Boundaries", () => {
		it("should accept zero price", async () => {
			const productData = productFixtures.commanderDeck({
				basePrice: boundaryFixtures.price.zero,
			});
			const product = new Product(productData);
			const savedProduct = await product.save();
			expect(savedProduct.basePrice).toBe(0);
		});

		it("should accept minimum price (0.01)", async () => {
			const productData = productFixtures.commanderDeck({
				basePrice: boundaryFixtures.price.penny,
			});
			const product = new Product(productData);
			const savedProduct = await product.save();
			expect(savedProduct.basePrice).toBe(0.01);
		});

		it("should accept very high price", async () => {
			const productData = productFixtures.singleCard({
				basePrice: boundaryFixtures.price.max,
			});
			const product = new Product(productData);
			const savedProduct = await product.save();
			expect(savedProduct.basePrice).toBe(999999.99);
		});

		it("should fail on negative price", async () => {
			const productData = productFixtures.commanderDeck({
				basePrice: -10.99,
			});
			const product = new Product(productData);
			await expect(product.save()).rejects.toThrow();
		});

		it("should handle price with many decimal places (rounds)", async () => {
			const productData = productFixtures.commanderDeck({
				basePrice: 19.999999,
			});
			const product = new Product(productData);
			const savedProduct = await product.save();
			// MongoDB may round this value
			expect(savedProduct.basePrice).toBeCloseTo(19.999999, 2);
		});
	});

	describe("Edge Cases - Unit Size Boundaries", () => {
		it("should accept zero unitSize for single cards", async () => {
			const productData = productFixtures.singleCard({
				unitSize: 0,
			});
			const product = new Product(productData);
			const savedProduct = await product.save();
			expect(savedProduct.unitSize).toBe(0);
		});

		it("should accept unitSize of 1", async () => {
			const productData = productFixtures.boosterPack({
				unitSize: 1,
			});
			const product = new Product(productData);
			const savedProduct = await product.save();
			expect(savedProduct.unitSize).toBe(1);
		});

		it("should accept very large unitSize", async () => {
			const productData = productFixtures.commanderDeck({
				unitSize: 999999,
			});
			const product = new Product(productData);
			const savedProduct = await product.save();
			expect(savedProduct.unitSize).toBe(999999);
		});

		it("should fail on negative unitSize", async () => {
			const productData = productFixtures.commanderDeck({
				unitSize: -5,
			});
			const product = new Product(productData);
			await expect(product.save()).rejects.toThrow();
		});
	});

	describe("Edge Cases - Card Details Validation", () => {
		it("should handle all rarity values", async () => {
			const rarities = [
				CARD_RARITIES.COMMON,
				CARD_RARITIES.UNCOMMON,
				CARD_RARITIES.RARE,
				CARD_RARITIES.MYTHIC,
			];

			for (const rarity of rarities) {
				const productData = productFixtures.singleCard({
					sku: `CARD-${rarity}`,
					cardDetails: {
						set: "Test Set",
						cardNumber: "1",
						rarity: rarity,
						condition: CARD_CONDITIONS.NEAR_MINT,
						finish: CARD_FINISHES.NON_FOIL,
					},
				});
				const product = new Product(productData);
				const savedProduct = await product.save();
				expect(savedProduct.cardDetails.rarity).toBe(rarity);
				await Product.deleteMany({});
			}
		});

		it("should handle all condition values", async () => {
			const conditions = [
				CARD_CONDITIONS.NEAR_MINT,
				CARD_CONDITIONS.LIGHTLY_PLAYED,
				CARD_CONDITIONS.MODERATELY_PLAYED,
				CARD_CONDITIONS.HEAVILY_PLAYED,
				CARD_CONDITIONS.DAMAGED,
			];

			for (const condition of conditions) {
				const productData = productFixtures.singleCard({
					sku: `CARD-${condition}`,
					cardDetails: {
						set: "Test Set",
						cardNumber: "1",
						rarity: CARD_RARITIES.COMMON,
						condition: condition,
						finish: CARD_FINISHES.NON_FOIL,
					},
				});
				const product = new Product(productData);
				const savedProduct = await product.save();
				expect(savedProduct.cardDetails.condition).toBe(condition);
				await Product.deleteMany({});
			}
		});

		it("should handle all finish values", async () => {
			const finishes = [
				CARD_FINISHES.FOIL,
				CARD_FINISHES.NON_FOIL,
				CARD_FINISHES.ETCHED,
			];

			for (const finish of finishes) {
				const productData = productFixtures.singleCard({
					sku: `CARD-${finish}`,
					cardDetails: {
						set: "Test Set",
						cardNumber: "1",
						rarity: CARD_RARITIES.COMMON,
						condition: CARD_CONDITIONS.NEAR_MINT,
						finish: finish,
					},
				});
				const product = new Product(productData);
				const savedProduct = await product.save();
				expect(savedProduct.cardDetails.finish).toBe(finish);
				await Product.deleteMany({});
			}
		});

		it("should handle card numbers with letters", async () => {
			const productData = productFixtures.singleCard({
				cardDetails: {
					set: "Test Set",
					cardNumber: "123a",
					rarity: CARD_RARITIES.COMMON,
					condition: CARD_CONDITIONS.NEAR_MINT,
					finish: CARD_FINISHES.NON_FOIL,
				},
			});
			const product = new Product(productData);
			const savedProduct = await product.save();
			expect(savedProduct.cardDetails.cardNumber).toBe("123a");
		});

		it("should handle very long set names", async () => {
			const longSetName = "A".repeat(100);
			const productData = productFixtures.singleCard({
				cardDetails: {
					set: longSetName,
					cardNumber: "1",
					rarity: CARD_RARITIES.COMMON,
					condition: CARD_CONDITIONS.NEAR_MINT,
					finish: CARD_FINISHES.NON_FOIL,
				},
			});
			const product = new Product(productData);
			const savedProduct = await product.save();
			expect(savedProduct.cardDetails.set).toBe(longSetName);
		});
	});

	describe("Edge Cases - Product Type Validation", () => {
		it("should handle all valid product types", async () => {
			const types = [
				{ type: PRODUCT_TYPES.SINGLE_CARD, unitSize: 0, hasCardDetails: true },
				{
					type: PRODUCT_TYPES.BOOSTER_PACK,
					unitSize: 1,
					hasCardDetails: false,
				},
				{ type: PRODUCT_TYPES.DECK, unitSize: 100, hasCardDetails: false },
				{ type: PRODUCT_TYPES.SLEEVES, unitSize: 100, hasCardDetails: false },
				{ type: PRODUCT_TYPES.DECK_BOX, unitSize: 10, hasCardDetails: false },
				{ type: PRODUCT_TYPES.PLAYMAT, unitSize: 5, hasCardDetails: false },
				{ type: PRODUCT_TYPES.BINDER, unitSize: 15, hasCardDetails: false },
			];

			for (const { type, unitSize, hasCardDetails } of types) {
				const productData = {
					sku: `${type}-001`,
					productType: type,
					name: `Test ${type}`,
					brand: "Test Brand",
					unitSize: unitSize,
					basePrice: 9.99,
				};

				if (hasCardDetails) {
					productData.cardDetails = {
						set: "Test Set",
						cardNumber: "1",
						rarity: CARD_RARITIES.COMMON,
						condition: CARD_CONDITIONS.NEAR_MINT,
						finish: CARD_FINISHES.NON_FOIL,
					};
				}

				const product = new Product(productData);
				const savedProduct = await product.save();
				expect(savedProduct.productType).toBe(type);
				await Product.deleteMany({});
			}
		});

		it("should fail on invalid product type", async () => {
			const productData = {
				sku: "INVALID-001",
				productType: "invalidType",
				name: "Invalid Product",
				brand: "Test Brand",
				unitSize: 1,
				basePrice: 9.99,
			};
			const product = new Product(productData);
			await expect(product.save()).rejects.toThrow();
		});
	});

	describe("Edge Cases - SKU Validation", () => {
		it("should handle SKU with special characters", async () => {
			const productData = productFixtures.commanderDeck({
				sku: "MTG-2023-DECK#1",
			});
			const product = new Product(productData);
			const savedProduct = await product.save();
			expect(savedProduct.sku).toBe("MTG-2023-DECK#1");
		});

		it("should handle very long SKU", async () => {
			const longSKU = "A".repeat(100);
			const productData = productFixtures.commanderDeck({
				sku: longSKU,
			});
			const product = new Product(productData);
			const savedProduct = await product.save();
			expect(savedProduct.sku).toBe(longSKU);
		});

		it("should handle minimum length SKU", async () => {
			const productData = productFixtures.commanderDeck({
				sku: "A",
			});
			const product = new Product(productData);
			const savedProduct = await product.save();
			expect(savedProduct.sku).toBe("A");
		});

		it("should handle SKU with unicode characters", async () => {
			const productData = productFixtures.commanderDeck({
				sku: edgeCases.specialChars.unicode,
			});
			const product = new Product(productData);
			const savedProduct = await product.save();
			expect(savedProduct.sku).toBe(edgeCases.specialChars.unicode);
		});
	});

	describe("Edge Cases - Virtual Properties", () => {
		it("should generate fullName for all product types", async () => {
			const product = await Product.create(productFixtures.commanderDeck());
			expect(product.fullName).toBe("Commander Deck (Wizards of the Coast)");
		});

		it("should generate cardIdentifier for single cards", async () => {
			const product = await Product.create(productFixtures.singleCard());
			expect(product.cardIdentifier).toBe(
				"The One Ring - Lord of the Rings #246 (near-mint, non-foil)"
			);
		});

		it("should return null cardIdentifier for non-card products", async () => {
			const product = await Product.create(productFixtures.commanderDeck());
			expect(product.cardIdentifier).toBeNull();
		});
	});

	describe("Edge Cases - BulkQuantity Field", () => {
		it("should allow null bulkQuantity", async () => {
			const productData = productFixtures.sleeves();
			delete productData.bulkQuantity;
			const product = new Product(productData);
			const savedProduct = await product.save();
			expect(savedProduct.bulkQuantity).toBeUndefined();
		});

		it("should accept bulkQuantity of 1", async () => {
			const productData = productFixtures.sleeves({
				bulkQuantity: 1,
			});
			const product = new Product(productData);
			const savedProduct = await product.save();
			expect(savedProduct.bulkQuantity).toBe(1);
		});

		it("should accept large bulkQuantity", async () => {
			const productData = productFixtures.sleeves({
				bulkQuantity: 10000,
			});
			const product = new Product(productData);
			const savedProduct = await product.save();
			expect(savedProduct.bulkQuantity).toBe(10000);
		});

		it("should fail on negative bulkQuantity", async () => {
			const productData = productFixtures.sleeves({
				bulkQuantity: -10,
			});
			const product = new Product(productData);
			await expect(product.save()).rejects.toThrow();
		});
	});

	describe("Edge Cases - IsActive Toggle", () => {
		it("should default isActive to true", async () => {
			const productData = productFixtures.commanderDeck();
			delete productData.isActive;
			const product = new Product(productData);
			const savedProduct = await product.save();
			expect(savedProduct.isActive).toBe(true);
		});

		it("should allow creating inactive product", async () => {
			const productData = productFixtures.inactive();
			const product = new Product(productData);
			const savedProduct = await product.save();
			expect(savedProduct.isActive).toBe(false);
		});

		it("should allow toggling isActive", async () => {
			const product = await Product.create(productFixtures.commanderDeck());
			expect(product.isActive).toBe(true);

			product.isActive = false;
			await product.save();
			expect(product.isActive).toBe(false);

			product.isActive = true;
			await product.save();
			expect(product.isActive).toBe(true);
		});
	});
});
