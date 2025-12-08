/**
 * Client-side Enums and Constants
 * Mirror of server-side enums for type safety and IDE support
 * Should match server/src/constants/enums.js
 */

export const CONTAINER_TYPES = {
	DISPLAY_CASE: "display-case",
	BULK_BOX: "bulk-box",
	BULK_BIN: "bulk-bin",
};

export const LOCATIONS = {
	FLOOR: "floor",
	BACK: "back",
};

export const PRODUCT_TYPES = {
	SINGLE_CARD: "singleCard",
	BOOSTER_PACK: "boosterPack",
	COLLECTOR_BOOSTER: "collectorBooster",
	DECK: "deck",
	DECK_BOX: "deckBox",
	DICE: "dice",
	SLEEVES: "sleeves",
	PLAYMAT: "playmat",
	BINDER: "binder",
	OTHER: "other",
};

export const USER_ROLES = {
	EMPLOYEE: "employee",
	STORE_MANAGER: "store-manager",
	PARTNER: "partner",
};

export const CARD_RARITIES = {
	COMMON: "common",
	UNCOMMON: "uncommon",
	RARE: "rare",
	MYTHIC: "mythic",
	MYTHIC_RARE: "mythic-rare",
};

export const CARD_CONDITIONS = {
	MINT: "mint",
	NEAR_MINT: "near-mint",
	LIGHTLY_PLAYED: "lightly-played",
	MODERATELY_PLAYED: "moderately-played",
	HEAVILY_PLAYED: "heavily-played",
	DAMAGED: "damaged",
};

export const CARD_FINISHES = {
	NON_FOIL: "non-foil",
	FOIL: "foil",
	ETCHED: "etched",
	HOLO: "holo",
	REVERSE_HOLO: "reverse-holo",
};

// Helper function to get all values from an enum object
export const getEnumValues = (enumObj) => Object.values(enumObj);

// Helper function to validate enum value
export const isValidEnumValue = (enumObj, value) => {
	return Object.values(enumObj).includes(value);
};

// Display name mappings for UI
export const PRODUCT_TYPE_LABELS = {
	[PRODUCT_TYPES.SINGLE_CARD]: "Single Card",
	[PRODUCT_TYPES.BOOSTER_PACK]: "Booster Pack",
	[PRODUCT_TYPES.COLLECTOR_BOOSTER]: "Collector Booster",
	[PRODUCT_TYPES.DECK]: "Deck",
	[PRODUCT_TYPES.DECK_BOX]: "Deck Box",
	[PRODUCT_TYPES.DICE]: "Dice",
	[PRODUCT_TYPES.SLEEVES]: "Sleeves",
	[PRODUCT_TYPES.PLAYMAT]: "Playmat",
	[PRODUCT_TYPES.BINDER]: "Binder",
	[PRODUCT_TYPES.OTHER]: "Other",
};

export const CARD_RARITY_LABELS = {
	[CARD_RARITIES.COMMON]: "Common",
	[CARD_RARITIES.UNCOMMON]: "Uncommon",
	[CARD_RARITIES.RARE]: "Rare",
	[CARD_RARITIES.MYTHIC]: "Mythic",
	[CARD_RARITIES.MYTHIC_RARE]: "Mythic Rare",
};

export const CARD_CONDITION_LABELS = {
	[CARD_CONDITIONS.MINT]: "Mint",
	[CARD_CONDITIONS.NEAR_MINT]: "Near Mint",
	[CARD_CONDITIONS.LIGHTLY_PLAYED]: "Lightly Played",
	[CARD_CONDITIONS.MODERATELY_PLAYED]: "Moderately Played",
	[CARD_CONDITIONS.HEAVILY_PLAYED]: "Heavily Played",
	[CARD_CONDITIONS.DAMAGED]: "Damaged",
};

export const CARD_FINISH_LABELS = {
	[CARD_FINISHES.NON_FOIL]: "Non-Foil",
	[CARD_FINISHES.FOIL]: "Foil",
	[CARD_FINISHES.ETCHED]: "Etched",
	[CARD_FINISHES.HOLO]: "Holo",
	[CARD_FINISHES.REVERSE_HOLO]: "Reverse Holo",
};
