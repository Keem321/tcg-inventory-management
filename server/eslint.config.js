/**
 * ESLint configuration for server
 * Using flat config format (ESLint 9+)
 */

const js = require("@eslint/js");

module.exports = [
	{
		ignores: ["node_modules/**", "coverage/**", "dist/**"],
	},
	// Test files use ES6 modules
	{
		files: ["tests/**/*.js"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: {
				// Node.js globals
				__dirname: "readonly",
				__filename: "readonly",
				Buffer: "readonly",
				console: "readonly",
				exports: "writable",
				global: "readonly",
				module: "writable",
				process: "readonly",
				require: "readonly",
				setTimeout: "readonly",
				clearTimeout: "readonly",
				setInterval: "readonly",
				clearInterval: "readonly",
			},
		},
		rules: {
			...js.configs.recommended.rules,
			"no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
			"no-console": "off",
			"prefer-const": "warn",
			"no-var": "error",

			// Custom rules for enum detection
			"no-restricted-syntax": [
				"warn",
				{
					selector: "Literal[value='employee']",
					message:
						"Use USER_ROLES.EMPLOYEE instead of hardcoded 'employee'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='store-manager']",
					message:
						"Use USER_ROLES.STORE_MANAGER instead of hardcoded 'store-manager'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='partner']",
					message:
						"Use USER_ROLES.PARTNER instead of hardcoded 'partner'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='floor']",
					message:
						"Use LOCATIONS.FLOOR instead of hardcoded 'floor'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='back']",
					message:
						"Use LOCATIONS.BACK instead of hardcoded 'back'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='display-case']",
					message:
						"Use CONTAINER_TYPES.DISPLAY_CASE instead of hardcoded 'display-case'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='bulk-box']",
					message:
						"Use CONTAINER_TYPES.BULK_BOX instead of hardcoded 'bulk-box'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='bulk-bin']",
					message:
						"Use CONTAINER_TYPES.BULK_BIN instead of hardcoded 'bulk-bin'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='singleCard']",
					message:
						"Use PRODUCT_TYPES.SINGLE_CARD instead of hardcoded 'singleCard'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='sleeves']",
					message:
						"Use PRODUCT_TYPES.SLEEVES instead of hardcoded 'sleeves'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='boosterPack']",
					message:
						"Use PRODUCT_TYPES.BOOSTER_PACK instead of hardcoded 'boosterPack'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='common']",
					message:
						"Use CARD_RARITIES.COMMON instead of hardcoded 'common'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='uncommon']",
					message:
						"Use CARD_RARITIES.UNCOMMON instead of hardcoded 'uncommon'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='rare']",
					message:
						"Use CARD_RARITIES.RARE instead of hardcoded 'rare'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='near-mint']",
					message:
						"Use CARD_CONDITIONS.NEAR_MINT instead of hardcoded 'near-mint'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='non-foil']",
					message:
						"Use CARD_FINISHES.NON_FOIL instead of hardcoded 'non-foil'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='foil']",
					message:
						"Use CARD_FINISHES.FOIL instead of hardcoded 'foil'. Import from '../../src/constants/enums.js'",
				},
				// Common typos and incorrect casing variations
				{
					selector: "Literal[value='single-card']",
					message:
						"Use PRODUCT_TYPES.SINGLE_CARD instead of 'single-card' (should be camelCase: singleCard). Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='SingleCard']",
					message:
						"Use PRODUCT_TYPES.SINGLE_CARD instead of 'SingleCard' (incorrect casing). Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='booster-pack']",
					message:
						"Use PRODUCT_TYPES.BOOSTER_PACK instead of 'booster-pack' (should be camelCase: boosterPack). Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='BoosterPack']",
					message:
						"Use PRODUCT_TYPES.BOOSTER_PACK instead of 'BoosterPack' (incorrect casing). Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='collector-booster']",
					message:
						"Use PRODUCT_TYPES.COLLECTOR_BOOSTER instead of 'collector-booster' (should be camelCase: collectorBooster). Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='CollectorBooster']",
					message:
						"Use PRODUCT_TYPES.COLLECTOR_BOOSTER instead of 'CollectorBooster' (incorrect casing). Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='deck-box']",
					message:
						"Use PRODUCT_TYPES.DECK_BOX instead of 'deck-box' (should be camelCase: deckBox). Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='DeckBox']",
					message:
						"Use PRODUCT_TYPES.DECK_BOX instead of 'DeckBox' (incorrect casing). Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='collectorBooster']",
					message:
						"Use PRODUCT_TYPES.COLLECTOR_BOOSTER instead of hardcoded 'collectorBooster'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='deckBox']",
					message:
						"Use PRODUCT_TYPES.DECK_BOX instead of hardcoded 'deckBox'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='playmat']",
					message:
						"Use PRODUCT_TYPES.PLAYMAT instead of hardcoded 'playmat'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='binder']",
					message:
						"Use PRODUCT_TYPES.BINDER instead of hardcoded 'binder'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='etched']",
					message:
						"Use CARD_FINISHES.ETCHED instead of hardcoded 'etched'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='holo']",
					message:
						"Use CARD_FINISHES.HOLO instead of hardcoded 'holo'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='reverse-holo']",
					message:
						"Use CARD_FINISHES.REVERSE_HOLO instead of hardcoded 'reverse-holo'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='mythic']",
					message:
						"Use CARD_RARITIES.MYTHIC_RARE instead of hardcoded 'mythic-rare'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='mythic-rare']",
					message:
						"Use CARD_RARITIES.MYTHIC_RARE instead of hardcoded 'mythic-rare'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='mint']",
					message:
						"Use CARD_CONDITIONS.MINT instead of hardcoded 'mint'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='lightly-played']",
					message:
						"Use CARD_CONDITIONS.LIGHTLY_PLAYED instead of hardcoded 'lightly-played'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='moderately-played']",
					message:
						"Use CARD_CONDITIONS.MODERATELY_PLAYED instead of hardcoded 'moderately-played'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='heavily-played']",
					message:
						"Use CARD_CONDITIONS.HEAVILY_PLAYED instead of hardcoded 'heavily-played'. Import from '../../src/constants/enums.js'",
				},
				{
					selector: "Literal[value='damaged']",
					message:
						"Use CARD_CONDITIONS.DAMAGED instead of hardcoded 'damaged'. Import from '../../src/constants/enums.js'",
				},
			],
		},
	},
	// Source files use CommonJS
	{
		files: ["src/**/*.js", "index.js"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "commonjs",
			globals: {
				// Node.js globals
				__dirname: "readonly",
				__filename: "readonly",
				Buffer: "readonly",
				console: "readonly",
				exports: "writable",
				global: "readonly",
				module: "writable",
				process: "readonly",
				require: "readonly",
				setTimeout: "readonly",
				clearTimeout: "readonly",
				setInterval: "readonly",
				clearInterval: "readonly",
			},
		},
		rules: {
			...js.configs.recommended.rules,
			"no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
			"no-console": "off",
			"prefer-const": "warn",
			"no-var": "error",

			// Custom rules for enum detection
			"no-restricted-syntax": [
				"warn",
				{
					selector: "Literal[value='employee']",
					message:
						"Use USER_ROLES.EMPLOYEE instead of hardcoded 'employee'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='store-manager']",
					message:
						"Use USER_ROLES.STORE_MANAGER instead of hardcoded 'store-manager'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='partner']",
					message:
						"Use USER_ROLES.PARTNER instead of hardcoded 'partner'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='floor']",
					message:
						"Use LOCATIONS.FLOOR instead of hardcoded 'floor'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='back']",
					message:
						"Use LOCATIONS.BACK instead of hardcoded 'back'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='display-case']",
					message:
						"Use CONTAINER_TYPES.DISPLAY_CASE instead of hardcoded 'display-case'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='bulk-box']",
					message:
						"Use CONTAINER_TYPES.BULK_BOX instead of hardcoded 'bulk-box'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='bulk-bin']",
					message:
						"Use CONTAINER_TYPES.BULK_BIN instead of hardcoded 'bulk-bin'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='singleCard']",
					message:
						"Use PRODUCT_TYPES.SINGLE_CARD instead of hardcoded 'singleCard'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='boosterPack']",
					message:
						"Use PRODUCT_TYPES.BOOSTER_PACK instead of hardcoded 'boosterPack'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='common']",
					message:
						"Use CARD_RARITIES.COMMON instead of hardcoded 'common'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='uncommon']",
					message:
						"Use CARD_RARITIES.UNCOMMON instead of hardcoded 'uncommon'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='rare']",
					message:
						"Use CARD_RARITIES.RARE instead of hardcoded 'rare'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='near-mint']",
					message:
						"Use CARD_CONDITIONS.NEAR_MINT instead of hardcoded 'near-mint'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='non-foil']",
					message:
						"Use CARD_FINISHES.NON_FOIL instead of hardcoded 'non-foil'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='foil']",
					message:
						"Use CARD_FINISHES.FOIL instead of hardcoded 'foil'. Import from '../constants/enums.js'",
				},
				// Common typos and incorrect casing variations
				{
					selector: "Literal[value='single-card']",
					message:
						"Use PRODUCT_TYPES.SINGLE_CARD instead of 'single-card' (should be camelCase: singleCard). Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='SingleCard']",
					message:
						"Use PRODUCT_TYPES.SINGLE_CARD instead of 'SingleCard' (incorrect casing). Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='booster-pack']",
					message:
						"Use PRODUCT_TYPES.BOOSTER_PACK instead of 'booster-pack' (should be camelCase: boosterPack). Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='BoosterPack']",
					message:
						"Use PRODUCT_TYPES.BOOSTER_PACK instead of 'BoosterPack' (incorrect casing). Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='collector-booster']",
					message:
						"Use PRODUCT_TYPES.COLLECTOR_BOOSTER instead of 'collector-booster' (should be camelCase: collectorBooster). Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='CollectorBooster']",
					message:
						"Use PRODUCT_TYPES.COLLECTOR_BOOSTER instead of 'CollectorBooster' (incorrect casing). Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='deck-box']",
					message:
						"Use PRODUCT_TYPES.DECK_BOX instead of 'deck-box' (should be camelCase: deckBox). Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='DeckBox']",
					message:
						"Use PRODUCT_TYPES.DECK_BOX instead of 'DeckBox' (incorrect casing). Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='collectorBooster']",
					message:
						"Use PRODUCT_TYPES.COLLECTOR_BOOSTER instead of hardcoded 'collectorBooster'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='deckBox']",
					message:
						"Use PRODUCT_TYPES.DECK_BOX instead of hardcoded 'deckBox'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='playmat']",
					message:
						"Use PRODUCT_TYPES.PLAYMAT instead of hardcoded 'playmat'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='binder']",
					message:
						"Use PRODUCT_TYPES.BINDER instead of hardcoded 'binder'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='etched']",
					message:
						"Use CARD_FINISHES.ETCHED instead of hardcoded 'etched'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='holo']",
					message:
						"Use CARD_FINISHES.HOLO instead of hardcoded 'holo'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='reverse-holo']",
					message:
						"Use CARD_FINISHES.REVERSE_HOLO instead of hardcoded 'reverse-holo'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='mythic-rare']",
					message:
						"Use CARD_RARITIES.MYTHIC_RARE instead of hardcoded 'mythic-rare'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='mint']",
					message:
						"Use CARD_CONDITIONS.MINT instead of hardcoded 'mint'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='lightly-played']",
					message:
						"Use CARD_CONDITIONS.LIGHTLY_PLAYED instead of hardcoded 'lightly-played'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='moderately-played']",
					message:
						"Use CARD_CONDITIONS.MODERATELY_PLAYED instead of hardcoded 'moderately-played'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='heavily-played']",
					message:
						"Use CARD_CONDITIONS.HEAVILY_PLAYED instead of hardcoded 'heavily-played'. Import from '../constants/enums.js'",
				},
				{
					selector: "Literal[value='damaged']",
					message:
						"Use CARD_CONDITIONS.DAMAGED instead of hardcoded 'damaged'. Import from '../constants/enums.js'",
				},
			],
		},
	},
	{
		// Disable enum checks in model files and enum definition file
		files: ["src/constants/enums.js", "src/models/*.js"],
		rules: {
			"no-restricted-syntax": "off",
		},
	},
];
