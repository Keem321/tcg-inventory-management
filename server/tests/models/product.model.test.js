/**
 * Tests for Product Model
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Product } from "../../src/models/product.model.js";
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
			const product = new Product(productFixtures.singleCard({}));
			const savedProduct = await product.save();

			expect(savedProduct._id).toBeDefined();
		});

		it("should fail if single card has unitSize other than 0", async () => {
			const product = new Product(
				productFixtures.singleCard({
					unitSize: 1,
				})
			);
			await expect(product.save()).rejects.toThrow(
				"Single cards must have unitSize of 0"
			);
		});

		it("should fail if single card missing cardDetails", async () => {
			const cardData = productFixtures.singleCard({});
			delete cardData.cardDetails;

			const product = new Product(cardData);
			await expect(product.save()).rejects.toThrow();
		});

		it("should fail if cardDetails has invalid condition", async () => {
			const product = new Product(
				productFixtures.singleCard({
					cardDetails: {
						set: "Test Set",
						cardNumber: "1",
						rarity: CARD_RARITIES.COMMON,
						condition: "perfect",
						finish: CARD_FINISHES.NON_FOIL,
					},
				})
			);
			await expect(product.save()).rejects.toThrow();
		});

		it("should fail if cardDetails has invalid finish", async () => {
			const product = new Product(
				productFixtures.singleCard({
					cardDetails: {
						set: "Test Set",
						cardNumber: "1",
						rarity: CARD_RARITIES.COMMON,
						condition: CARD_CONDITIONS.NEAR_MINT,
						finish: "pretty",
					},
				})
			);
			await expect(product.save()).rejects.toThrow();
		});
	});

	describe("Schema Validation - Non-Card Products", () => {
		it("should create a valid booster pack product", async () => {
			const product = new Product(productFixtures.boosterPack({}));
			const savedProduct = await product.save();

			expect(savedProduct.productType).toBe(PRODUCT_TYPES.BOOSTER_PACK);
			expect(savedProduct.unitSize).toBe(1);
			expect(savedProduct.cardDetails).toBeNull();
		});

		it("should create a valid accessory with bulkQuantity", async () => {
			const sleeveData = productFixtures.sleeves({});

			const product = new Product(sleeveData);
			const savedProduct = await product.save();

			expect(savedProduct.bulkQuantity).toBe(sleeveData.bulkQuantity);
		});

		it("should create a valid deck box product", async () => {
			const product = new Product(productFixtures.deckBox({}));
			const savedProduct = await product.save();

			expect(savedProduct.productType).toBe(PRODUCT_TYPES.DECK_BOX);
		});

		it("should fail if non-card product has unitSize of 0", async () => {
			const product = new Product(
				productFixtures.boosterPack({
					unitSize: 0,
				})
			);
			await expect(product.save()).rejects.toThrow(
				"Non-card products must have unitSize greater than 0"
			);
		});

		it("should fail if non-card product has cardDetails", async () => {
			const invalidData = productFixtures.boosterPack({});
			invalidData.cardDetails = {
				set: "Test Set",
				cardNumber: "1",
				rarity: CARD_RARITIES.COMMON,
				condition: CARD_CONDITIONS.NEAR_MINT,
				finish: CARD_FINISHES.NON_FOIL,
			};

			const product = new Product(invalidData);
			await expect(product.save()).rejects.toThrow(
				"Non-card products cannot have cardDetails"
			);
		});
	});

	describe("Required Fields Validation", () => {
		it("should fail if sku is missing", async () => {
			const productData = productFixtures.boosterPack({});
			delete productData.sku;

			const product = new Product(productData);
			await expect(product.save()).rejects.toThrow();
		});

		it("should fail if productType is missing", async () => {
			const productData = productFixtures.boosterPack({});
			delete productData.productType;

			const product = new Product(productData);
			await expect(product.save()).rejects.toThrow();
		});

		it("should fail if name is missing", async () => {
			const productData = productFixtures.boosterPack({});
			delete productData.name;

			const product = new Product(productData);
			await expect(product.save()).rejects.toThrow();
		});

		it("should fail if brand is missing", async () => {
			const productData = productFixtures.boosterPack({});
			delete productData.brand;

			const product = new Product(productData);
			await expect(product.save()).rejects.toThrow();
		});

		it("should fail if unitSize is missing", async () => {
			const productData = productFixtures.boosterPack({});
			delete productData.unitSize;

			const product = new Product(productData);
			await expect(product.save()).rejects.toThrow();
		});

		it("should fail if basePrice is missing", async () => {
			const productData = productFixtures.boosterPack({});
			delete productData.basePrice;

			const product = new Product(productData);
			await expect(product.save()).rejects.toThrow();
		});

		it("should fail if basePrice is negative", async () => {
			const product = new Product(
				productFixtures.boosterPack({
					basePrice: -5,
				})
			);
			await expect(product.save()).rejects.toThrow();
		});

		it("should fail if productType is invalid", async () => {
			const product = new Product(
				productFixtures.boosterPack({
					productType: "invalidType",
				})
			);
			await expect(product.save()).rejects.toThrow();
		});

		it("should enforce unique SKU", async () => {
			const productData1 = productFixtures.boosterPack({
				sku: "SAME-SKU",
				name: "Product 1",
			});

			const productData2 = productFixtures.boosterPack({
				sku: "SAME-SKU",
				name: "Product 2",
			});

			await new Product(productData1).save();
			await expect(new Product(productData2).save()).rejects.toThrow();
		});
	});

	describe("Virtual Properties", () => {
		it("should generate fullName virtual for non-card product", async () => {
			const product = new Product(productFixtures.boosterPack({}));
			const savedProduct = await product.save();

			expect(savedProduct.fullName).toBe(
				"Magic: The Gathering - Draft Booster"
			);
		});

		it("should generate cardIdentifier virtual for single card", async () => {
			const product = new Product(productFixtures.singleCard({}));
			const savedProduct = await product.save();

			expect(savedProduct.cardIdentifier).toBe(
				"The One Ring (Lord of the Rings #246)"
			);
		});

		it("should return null cardIdentifier for non-card product", async () => {
			const product = new Product(productFixtures.boosterPack({}));
			const savedProduct = await product.save();

			expect(savedProduct.cardIdentifier).toBeNull();
		});
	});

	describe("Static Methods", () => {
		beforeEach(async () => {
			// Create test data
			await Product.create([
				productFixtures.singleCard(),
				productFixtures.blackLotus(),
				productFixtures.boosterPack(),
				productFixtures.deckBox({ isActive: false }),
			]);
		});

		it("should find products by type and brand", async () => {
			const mtgCards = await Product.findByTypeAndBrand(
				PRODUCT_TYPES.SINGLE_CARD,
				"Wizards of the Coast"
			);
			expect(mtgCards).toHaveLength(2);
			expect(mtgCards.every((p) => p.brand === "Wizards of the Coast")).toBe(
				true
			);
		});

		it("should find cards by set", async () => {
			const alphaCards = await Product.findCardsBySet("Alpha");
			expect(alphaCards).toHaveLength(1);
			expect(alphaCards[0].cardDetails.cardNumber).toBe("232");
		});

		it("should search products by text", async () => {
			// Ensure text index is created
			await Product.ensureIndexes();

			const results = await Product.searchProducts("Ring");
			expect(results.length).toBeGreaterThan(0);
			expect(results[0].name).toContain("Ring");
		});
	});

	describe("Product Queries", () => {
		beforeEach(async () => {
			await Product.create([
				productFixtures.boosterPack({
					sku: "MTG-BOOSTER-1",
					name: "Set Booster",
					basePrice: 4.99,
				}),
				productFixtures.boosterPack({
					sku: "PKM-BOOSTER-1",
					name: "Booster Pack",
					brand: "Pokemon",
				}),
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
			const product = new Product(
				productFixtures.boosterPack({
					sku: "  TEST-001  ",
					name: "  Test Product  ",
					description: "  Test Description  ",
					brand: "  Test Brand  ",
				})
			);
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
});
