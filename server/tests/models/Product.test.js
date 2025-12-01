/**
 * Tests for Product Model
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Product } from "../../src/models/Product.js";
import "../setup.js"; // Import test setup

describe("Product Model", () => {
	describe("Schema Validation - Single Cards", () => {
		it("should create a valid single card product", async () => {
			const cardData = {
				sku: "MTG-MID-123-NM-F",
				productType: "singleCard",
				name: "Teferi, Who Slows the Sunset",
				description: "Legendary Planeswalker - Teferi",
				brand: "Magic: The Gathering",
				cardDetails: {
					set: "Innistrad: Midnight Hunt",
					cardNumber: "245",
					rarity: "mythic",
					condition: "near-mint",
					finish: "foil",
				},
				unitSize: 0,
				basePrice: 24.99,
			};

			const product = new Product(cardData);
			const savedProduct = await product.save();

			expect(savedProduct._id).toBeDefined();
			expect(savedProduct.sku).toBe("MTG-MID-123-NM-F");
			expect(savedProduct.productType).toBe("singleCard");
			expect(savedProduct.unitSize).toBe(0);
			expect(savedProduct.cardDetails.set).toBe("Innistrad: Midnight Hunt");
			expect(savedProduct.cardDetails.condition).toBe("near-mint");
			expect(savedProduct.cardDetails.finish).toBe("foil");
			expect(savedProduct.isActive).toBe(true);
		});

		it("should fail if single card has unitSize other than 0", async () => {
			const cardData = {
				sku: "MTG-TEST-001",
				productType: "singleCard",
				name: "Test Card",
				brand: "Magic: The Gathering",
				cardDetails: {
					set: "Test Set",
					cardNumber: "1",
					rarity: "common",
					condition: "near-mint",
					finish: "non-foil",
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
				productType: "singleCard",
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
				productType: "singleCard",
				name: "Test Card",
				brand: "Magic: The Gathering",
				cardDetails: {
					set: "Test Set",
					cardNumber: "1",
					rarity: "common",
					condition: "perfect",
					finish: "non-foil",
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
				productType: "singleCard",
				name: "Test Card",
				brand: "Magic: The Gathering",
				cardDetails: {
					set: "Test Set",
					cardNumber: "1",
					rarity: "common",
					condition: "near-mint",
					finish: "shiny",
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
				productType: "boosterPack",
				name: "Innistrad: Midnight Hunt Draft Booster",
				description: "15-card draft booster pack",
				brand: "Magic: The Gathering",
				unitSize: 1,
				basePrice: 3.99,
			};

			const product = new Product(boosterData);
			const savedProduct = await product.save();

			expect(savedProduct.productType).toBe("boosterPack");
			expect(savedProduct.unitSize).toBe(1);
			expect(savedProduct.cardDetails).toBeNull();
		});

		it("should create a valid accessory with bulkQuantity", async () => {
			const sleeveData = {
				sku: "DS-MATTE-BLK-100",
				productType: "sleeves",
				name: "Dragon Shield Matte Black",
				description: "100-count sleeve pack",
				brand: "Dragon Shield",
				unitSize: 1.5,
				basePrice: 9.99,
				bulkQuantity: 10,
			};

			const product = new Product(sleeveData);
			const savedProduct = await product.save();

			expect(savedProduct.bulkQuantity).toBe(10);
			expect(savedProduct.unitSize).toBe(1.5);
		});

		it("should create a valid deck box product", async () => {
			const deckBoxData = {
				sku: "UG-BOULDER-100",
				productType: "deckBox",
				name: "Ultimate Guard Boulder 100+",
				description: "Deck box for 100+ sleeved cards",
				brand: "Ultimate Guard",
				unitSize: 2,
				basePrice: 12.99,
			};

			const product = new Product(deckBoxData);
			const savedProduct = await product.save();

			expect(savedProduct.productType).toBe("deckBox");
			expect(savedProduct.bulkQuantity).toBeNull();
		});

		it("should fail if non-card product has unitSize of 0", async () => {
			const invalidData = {
				sku: "TEST-INVALID",
				productType: "boosterPack",
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
				productType: "boosterPack",
				name: "Test Booster",
				brand: "Test Brand",
				cardDetails: {
					set: "Test Set",
					cardNumber: "1",
					rarity: "common",
					condition: "near-mint",
					finish: "non-foil",
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
				productType: "boosterPack",
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
				productType: "boosterPack",
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
				productType: "boosterPack",
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
				productType: "boosterPack",
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
				productType: "boosterPack",
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
				productType: "boosterPack",
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
				productType: "boosterPack",
				name: "Product 1",
				brand: "Test Brand",
				unitSize: 1,
				basePrice: 3.99,
			};

			const productData2 = {
				sku: "SAME-SKU",
				productType: "boosterPack",
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
				productType: "boosterPack",
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
				productType: "singleCard",
				name: "Teferi, Who Slows the Sunset",
				brand: "Magic: The Gathering",
				cardDetails: {
					set: "Innistrad: Midnight Hunt",
					cardNumber: "245",
					rarity: "mythic",
					condition: "near-mint",
					finish: "foil",
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
				productType: "boosterPack",
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
				},
				{
					sku: "MTG-CARD-002",
					productType: "singleCard",
					name: "Black Lotus",
					brand: "Magic: The Gathering",
					cardDetails: {
						set: "Alpha",
						cardNumber: "232",
						rarity: "rare",
						condition: "moderately-played",
						finish: "non-foil",
					},
					unitSize: 0,
					basePrice: 15000.0,
				},
				{
					sku: "MTG-BOOSTER-001",
					productType: "boosterPack",
					name: "Draft Booster",
					brand: "Magic: The Gathering",
					unitSize: 1,
					basePrice: 3.99,
				},
				{
					sku: "PKM-CARD-001",
					productType: "singleCard",
					name: "Pikachu",
					brand: "Pokemon",
					cardDetails: {
						set: "Base Set",
						cardNumber: "25",
						rarity: "common",
						condition: "near-mint",
						finish: "holo",
					},
					unitSize: 0,
					basePrice: 5.0,
				},
				{
					sku: "UG-BOX-001",
					productType: "deckBox",
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
				"singleCard",
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
					productType: "boosterPack",
					name: "Set Booster",
					brand: "Magic: The Gathering",
					unitSize: 1,
					basePrice: 4.99,
				},
				{
					sku: "PKM-BOOSTER-1",
					productType: "boosterPack",
					name: "Booster Pack",
					brand: "Pokemon",
					unitSize: 1,
					basePrice: 3.99,
				},
				{
					sku: "DS-SLEEVES-1",
					productType: "sleeves",
					name: "Matte Black",
					brand: "Dragon Shield",
					unitSize: 1.5,
					basePrice: 9.99,
					bulkQuantity: 10,
				},
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
			const boosters = await Product.find({ productType: "boosterPack" });
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
				productType: "boosterPack",
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
});
