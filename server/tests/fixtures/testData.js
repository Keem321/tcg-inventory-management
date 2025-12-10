/**
 * Test Data Fixtures and Factories
 * Centralized test data creation for consistent and DRY tests
 */

import mongoose from "mongoose";
import {
	USER_ROLES,
	CARD_CONDITIONS,
	CARD_FINISHES,
	CARD_RARITIES,
	CONTAINER_TYPES,
	LOCATIONS,
	PRODUCT_TYPES,
} from "../../src/constants/enums.js";

/**
 * User Fixtures
 */
export const userFixtures = {
	partner: (overrides = {}) => ({
		username: "partner1",
		email: "partner@tcg.com",
		passwordHash:
			"$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
		firstName: "Partner",
		lastName: "User",
		role: USER_ROLES.PARTNER,
		assignedStoreId: null,
		isActive: true,
		...overrides,
	}),

	storeManager: (storeId, overrides = {}) => ({
		username: "manager1",
		email: "manager@tcg.com",
		passwordHash:
			"$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
		firstName: "Manager",
		lastName: "User",
		role: USER_ROLES.STORE_MANAGER,
		assignedStoreId: storeId,
		isActive: true,
		...overrides,
	}),

	employee: (storeId, overrides = {}) => ({
		username: "employee1",
		email: "employee@tcg.com",
		passwordHash:
			"$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
		firstName: "Employee",
		lastName: "User",
		role: USER_ROLES.EMPLOYEE,
		assignedStoreId: storeId,
		isActive: true,
		...overrides,
	}),

	inactive: (overrides = {}) => ({
		username: "inactive1",
		email: "inactive@tcg.com",
		passwordHash:
			"$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
		firstName: "Inactive",
		lastName: "User",
		role: USER_ROLES.EMPLOYEE,
		assignedStoreId: new mongoose.Types.ObjectId(),
		isActive: false,
		...overrides,
	}),
};

/**
 * Store Fixtures
 */
export const storeFixtures = {
	downtown: (overrides = {}) => ({
		name: "Downtown TCG Store",
		location: {
			address: "123 Main St",
			city: "Springfield",
			state: "IL",
			zipCode: "62701",
		},
		maxCapacity: 1000,
		currentCapacity: 500,
		isActive: true,
		...overrides,
	}),

	westside: (overrides = {}) => ({
		name: "Westside TCG Store",
		location: {
			address: "456 Oak Ave",
			city: "Springfield",
			state: "IL",
			zipCode: "62702",
		},
		maxCapacity: 1500,
		currentCapacity: 750,
		isActive: true,
		...overrides,
	}),

	seattle: (overrides = {}) => ({
		name: "Seattle Store",
		location: {
			address: "456 Oak St",
			city: "Seattle",
			state: "WA",
			zipCode: "98101",
		},
		maxCapacity: 10000,
		isActive: true,
		...overrides,
	}),

	denver: (overrides = {}) => ({
		name: "Denver Store",
		location: {
			address: "789 Pine St",
			city: "Denver",
			state: "CO",
			zipCode: "80202",
		},
		maxCapacity: 10000,
		isActive: true,
		...overrides,
	}),

	nearCapacity: (overrides = {}) => ({
		name: "Near Capacity Store",
		location: {
			address: "789 Pine St",
			city: "Denver",
			state: "CO",
			zipCode: "80201",
		},
		maxCapacity: 1000,
		currentCapacity: 950, // 95% capacity
		isActive: true,
		...overrides,
	}),

	atCapacity: (overrides = {}) => ({
		name: "At Capacity Store",
		location: {
			address: "321 Elm St",
			city: "Portland",
			state: "OR",
			zipCode: "97201",
		},
		maxCapacity: 1000,
		currentCapacity: 1000, // 100% capacity
		isActive: true,
		...overrides,
	}),

	empty: (overrides = {}) => ({
		name: "Empty Store",
		location: {
			address: "555 Maple Dr",
			city: "Seattle",
			state: "WA",
			zipCode: "98101",
		},
		maxCapacity: 2000,
		currentCapacity: 0,
		isActive: true,
		...overrides,
	}),
};

/**
 * Product Fixtures
 */
export const productFixtures = {
	commanderDeck: (overrides = {}) => ({
		sku: "DECK-001",
		productType: PRODUCT_TYPES.DECK,
		name: "Commander Deck",
		description: "Pre-constructed Commander deck",
		brand: "Wizards of the Coast",
		unitSize: 100,
		basePrice: 39.99,
		isActive: true,
		...overrides,
	}),

	sleeves: (overrides = {}) => ({
		sku: "SLEEVES-001",
		productType: PRODUCT_TYPES.SLEEVES,
		name: "Dragon Shield Sleeves",
		description: "100 count card sleeves",
		brand: "Dragon Shield",
		unitSize: 1.5,
		bulkQuantity: 10,
		basePrice: 9.99,
		isActive: true,
		...overrides,
	}),

	singleCard: (overrides = {}) => ({
		sku: "MTG-LTR-001",
		productType: PRODUCT_TYPES.SINGLE_CARD,
		name: "The One Ring",
		description: "Legendary Artifact",
		brand: "Wizards of the Coast",
		cardDetails: {
			set: "Lord of the Rings",
			cardNumber: "246",
			rarity: CARD_RARITIES.MYTHIC_RARE,
			condition: CARD_CONDITIONS.NEAR_MINT,
			finish: CARD_FINISHES.NON_FOIL,
		},
		unitSize: 0,
		basePrice: 89.99,
		isActive: true,
		...overrides,
	}),

	blackLotus: (overrides = {}) => ({
		sku: "MTG-CARD-002",
		productType: PRODUCT_TYPES.SINGLE_CARD,
		name: "Black Lotus",
		description: "The most iconic Magic card",
		brand: "Wizards of the Coast",
		cardDetails: {
			set: "Alpha",
			cardNumber: "232",
			rarity: CARD_RARITIES.RARE,
			condition: CARD_CONDITIONS.NEAR_MINT,
			finish: CARD_FINISHES.NON_FOIL,
		},
		unitSize: 0,
		basePrice: 15000.0,
		isActive: true,
		...overrides,
	}),

	boosterPack: (overrides = {}) => ({
		sku: "MTG-BOOSTER-001",
		productType: PRODUCT_TYPES.BOOSTER_PACK,
		name: "Draft Booster",
		description: "15-card draft booster pack",
		brand: "Magic: The Gathering",
		unitSize: 1,
		basePrice: 3.99,
		isActive: true,
		...overrides,
	}),

	playmat: (overrides = {}) => ({
		sku: "ACC-PLAYMAT-001",
		productType: PRODUCT_TYPES.PLAYMAT,
		name: "Premium Playmat",
		description: "High-quality gaming playmat",
		brand: "Ultra Pro",
		unitSize: 5,
		basePrice: 24.99,
		isActive: true,
		...overrides,
	}),

	deckBox: (overrides = {}) => ({
		sku: "ACC-DECKBOX-001",
		productType: PRODUCT_TYPES.DECK_BOX,
		name: "Boulder 100+ Deck Box",
		description: "Premium deck box for 100+ sleeved cards",
		brand: "Ultimate Guard",
		unitSize: 2,
		basePrice: 12.99,
		isActive: true,
		...overrides,
	}),

	binder: (overrides = {}) => ({
		sku: "ACC-BINDER-001",
		productType: PRODUCT_TYPES.BINDER,
		name: "9-Pocket Binder",
		description: "Premium card binder with 9-pocket pages",
		brand: "Ultra Pro",
		unitSize: 8,
		basePrice: 19.99,
		isActive: true,
		...overrides,
	}),

	dice: (overrides = {}) => ({
		sku: "ACC-DICE-001",
		productType: PRODUCT_TYPES.DICE,
		name: "Spindown D20 Set",
		description: "Set of spindown life counter dice",
		brand: "Chessex",
		unitSize: 0.5,
		basePrice: 4.99,
		isActive: true,
		...overrides,
	}),

	collectorBooster: (overrides = {}) => ({
		sku: "MTG-COLLECTOR-001",
		productType: PRODUCT_TYPES.COLLECTOR_BOOSTER,
		name: "Collector Booster",
		description: "Premium collector booster pack",
		brand: "Magic: The Gathering",
		unitSize: 1,
		basePrice: 24.99,
		isActive: true,
		...overrides,
	}),

	other: (overrides = {}) => ({
		sku: "ACC-OTHER-001",
		productType: PRODUCT_TYPES.OTHER,
		name: "Miscellaneous Accessory",
		description: "Other TCG accessory",
		brand: "Generic",
		unitSize: 1,
		basePrice: 9.99,
		isActive: true,
		...overrides,
	}),

	inactive: (overrides = {}) => ({
		sku: "INACTIVE-001",
		productType: PRODUCT_TYPES.DECK,
		name: "Discontinued Deck",
		description: "No longer available",
		brand: "Wizards of the Coast",
		unitSize: 100,
		basePrice: 29.99,
		isActive: false,
		...overrides,
	}),
};

/**
 * Inventory Fixtures
 */
export const inventoryFixtures = {
	floor: (storeId, productId, overrides = {}) => ({
		storeId,
		productId,
		location: LOCATIONS.FLOOR,
		quantity: 50,
		minStockLevel: 10,
		isActive: true,
		...overrides,
	}),

	back: (storeId, productId, overrides = {}) => ({
		storeId,
		productId,
		location: LOCATIONS.BACK,
		quantity: 100,
		minStockLevel: 20,
		isActive: true,
		...overrides,
	}),

	lowStock: (storeId, productId, overrides = {}) => ({
		storeId,
		productId,
		location: LOCATIONS.FLOOR,
		quantity: 5,
		minStockLevel: 10,
		isActive: true,
		...overrides,
	}),

	outOfStock: (storeId, productId, overrides = {}) => ({
		storeId,
		productId,
		location: LOCATIONS.FLOOR,
		quantity: 0,
		minStockLevel: 5,
		isActive: true,
		...overrides,
	}),

	withNotes: (storeId, productId, overrides = {}) => ({
		storeId,
		productId,
		location: LOCATIONS.FLOOR,
		quantity: 30,
		notes: "Reserved for tournament",
		isActive: true,
		...overrides,
	}),

	// Card Container Fixtures
	displayCase: (storeId, cardInventory = [], overrides = {}) => ({
		storeId,
		location: LOCATIONS.FLOOR,
		cardContainer: {
			containerType: CONTAINER_TYPES.DISPLAY_CASE,
			containerName: "Display Case A3",
			containerUnitSize: 5,
			cardInventory,
		},
		isActive: true,
		...overrides,
	}),

	bulkBox: (storeId, cardInventory = [], overrides = {}) => ({
		storeId,
		location: LOCATIONS.BACK,
		cardContainer: {
			containerType: CONTAINER_TYPES.BULK_BOX,
			containerName: "Commons Box - Alpha",
			containerUnitSize: 3,
			cardInventory,
		},
		isActive: true,
		...overrides,
	}),

	bulkBin: (storeId, cardInventory = [], overrides = {}) => ({
		storeId,
		location: LOCATIONS.FLOOR,
		cardContainer: {
			containerType: CONTAINER_TYPES.BULK_BIN,
			containerName: "Bulk Bin - Floor 1",
			containerUnitSize: 10,
			cardInventory,
		},
		isActive: true,
		...overrides,
	}),

	emptyContainer: (storeId, overrides = {}) => ({
		storeId,
		location: LOCATIONS.FLOOR,
		cardContainer: {
			containerType: CONTAINER_TYPES.DISPLAY_CASE,
			containerName: "Empty Display Case",
			containerUnitSize: 5,
			cardInventory: [],
		},
		isActive: true,
		...overrides,
	}),

	inactive: (storeId, productId, overrides = {}) => ({
		storeId,
		productId,
		location: LOCATIONS.FLOOR,
		quantity: 50,
		isActive: false,
		...overrides,
	}),
};

/**
 * Boundary Value Fixtures
 */
export const boundaryFixtures = {
	// Store capacity boundaries
	storeCapacity: {
		zero: { maxCapacity: 1000, currentCapacity: 0 },
		almostFull: { maxCapacity: 1000, currentCapacity: 999 },
		exactlyFull: { maxCapacity: 1000, currentCapacity: 1000 },
		minValid: { maxCapacity: 1, currentCapacity: 0 },
		largeCapacity: { maxCapacity: 999999, currentCapacity: 500000 },
	},

	// Price boundaries
	price: {
		zero: 0,
		penny: 0.01,
		max: 999999.99,
		typical: 19.99,
	},

	// Quantity boundaries
	quantity: {
		zero: 0,
		one: 1,
		max: 999999,
	},

	// String length boundaries
	strings: {
		empty: "",
		single: "a",
		typical: "Test Product Name",
		maxLength: "a".repeat(255),
	},
};

/**
 * Factory Functions for Creating Multiple Related Entities
 */
export const factories = {
	/**
	 * Create a complete store with assigned users
	 */
	async createStoreWithUsers(Store, User, storeData = {}) {
		const store = await Store.create(storeFixtures.downtown(storeData));
		const manager = await User.create(
			userFixtures.storeManager(store._id, { username: "mgr" + store._id })
		);
		const employee = await User.create(
			userFixtures.employee(store._id, {
				username: "emp" + store._id,
				email: "emp" + store._id + "@test.com",
			})
		);

		return { store, manager, employee };
	},

	/**
	 * Create a product with inventory across multiple stores
	 */
	async createProductWithInventory(
		Product,
		Inventory,
		stores,
		productData = {}
	) {
		const product = await Product.create(
			productFixtures.commanderDeck(productData)
		);
		const inventory = await Promise.all(
			stores.map((store, index) =>
				Inventory.create(
					inventoryFixtures.floor(store._id, product._id, {
						quantity: (index + 1) * 10,
					})
				)
			)
		);

		return { product, inventory };
	},

	/**
	 * Create multiple products of different types
	 */
	async createProductCatalog(Product) {
		const deck = await Product.create(productFixtures.commanderDeck());
		const sleeves = await Product.create(productFixtures.sleeves());
		const card = await Product.create(productFixtures.singleCard());
		const booster = await Product.create(productFixtures.boosterPack());

		return { deck, sleeves, card, booster };
	},
};

/**
 * Edge Case Test Data
 */
export const edgeCases = {
	// Invalid IDs
	invalidIds: {
		malformed: "invalid-id",
		nonExistent: "507f1f77bcf86cd799439011",
		empty: "",
		null: null,
		undefined: undefined,
	},

	// Invalid email formats
	invalidEmails: [
		"notanemail",
		"@example.com",
		"user@",
		"user@@example.com",
		"user name@example.com",
		"",
	],

	// Invalid state codes
	invalidStates: [
		"", // empty
		"A", // too short
		"ABC", // too long
		"12", // numbers
		"Or", // lowercase (should be caught before validation)
	],

	// Invalid zip codes
	invalidZipCodes: [
		"", // empty
		"1234", // too short
		"123456", // too long
		"ABCDE", // letters
	],

	// Negative values
	negativeValues: {
		price: -1,
		quantity: -5,
		capacity: -100,
		minStock: -10,
	},

	// Whitespace variations
	whitespace: {
		leading: "  test",
		trailing: "test  ",
		both: "  test  ",
		internal: "test  value",
		tabs: "\ttest\t",
		newlines: "\ntest\n",
	},

	// Special characters
	specialChars: {
		sql: "'; DROP TABLE users--",
		script: "<script>alert('xss')</script>",
		unicode: "Test™ Product® ©",
		emoji: "Test 🎮 Product",
	},
};
