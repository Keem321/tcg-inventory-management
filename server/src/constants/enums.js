/**
 * Centralized Enums and Constants
 * Single source of truth for all enum values used across models
 */

const CONTAINER_TYPES = {
	DISPLAY_CASE: "display-case",
	BULK_BOX: "bulk-box",
	BULK_BIN: "bulk-bin",
};

const LOCATIONS = {
	FLOOR: "floor",
	BACK: "back",
};

const PRODUCT_TYPES = {
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

const USER_ROLES = {
	EMPLOYEE: "employee",
	STORE_MANAGER: "store-manager",
	PARTNER: "partner",
};

const CARD_RARITIES = {
	COMMON: "common",
	UNCOMMON: "uncommon",
	RARE: "rare",
	MYTHIC_RARE: "mythic-rare",
};

const CARD_CONDITIONS = {
	MINT: "mint",
	NEAR_MINT: "near-mint",
	LIGHTLY_PLAYED: "lightly-played",
	MODERATELY_PLAYED: "moderately-played",
	HEAVILY_PLAYED: "heavily-played",
	DAMAGED: "damaged",
};

const CARD_FINISHES = {
	NON_FOIL: "non-foil",
	FOIL: "foil",
	ETCHED: "etched",
	HOLO: "holo",
	REVERSE_HOLO: "reverse-holo",
};

const US_STATES = [
	"AL",
	"AK",
	"AZ",
	"AR",
	"CA",
	"CO",
	"CT",
	"DE",
	"FL",
	"GA",
	"HI",
	"ID",
	"IL",
	"IN",
	"IA",
	"KS",
	"KY",
	"LA",
	"ME",
	"MD",
	"MA",
	"MI",
	"MN",
	"MS",
	"MO",
	"MT",
	"NE",
	"NV",
	"NH",
	"NJ",
	"NM",
	"NY",
	"NC",
	"ND",
	"OH",
	"OK",
	"OR",
	"PA",
	"RI",
	"SC",
	"SD",
	"TN",
	"TX",
	"UT",
	"VT",
	"VA",
	"WA",
	"WV",
	"WI",
	"WY",
];

// Helper function to get all values from an enum object
const getEnumValues = (enumObj) => Object.values(enumObj);

// Helper function to validate enum value
const isValidEnumValue = (enumObj, value) => {
	return Object.values(enumObj).includes(value);
};

module.exports = {
	CONTAINER_TYPES,
	LOCATIONS,
	PRODUCT_TYPES,
	USER_ROLES,
	CARD_RARITIES,
	CARD_CONDITIONS,
	CARD_FINISHES,
	US_STATES,
	getEnumValues,
	isValidEnumValue,
};
