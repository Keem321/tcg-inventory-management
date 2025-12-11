/**
 * Product Service
 * Handles business logic for product operations
 */

const mongoose = require("mongoose");
const productRepo = require("../repositories/product.repository");
const { LOCATIONS } = require("../constants/enums");

/**
 * Get all products with optional filtering
 * @param {Object} filters - { productType, brand, isActive, search }
 * @returns {Array} Array of products
 */
exports.getAllProducts = async (filters = {}) => {
	const { productType, brand, isActive, search } = filters;

	// Build filter query
	const queryFilters = {};
	if (productType) queryFilters.productType = productType;
	if (brand) queryFilters.brand = brand;
	if (isActive !== undefined) {
		// Handle both boolean and string values
		queryFilters.isActive = isActive === true || isActive === "true";
	}

	return productRepo.findAll(queryFilters, search || null);
};

/**
 * Get all unique brands
 * @returns {Array} Array of brand names sorted alphabetically
 */
exports.getAllBrands = async () => {
	const brands = await productRepo.getAllBrands();
	return brands.filter(Boolean).sort(); // Filter out null/empty and sort
};

/**
 * Get product by ID with inventory details across all stores
 * @param {String} productId - Product ID
 * @returns {Object} Product with inventory breakdown
 * @throws {Error} If product not found or invalid ID
 */
exports.getProductById = async (productId) => {
	// Validate ObjectId format
	if (!mongoose.Types.ObjectId.isValid(productId)) {
		const error = new Error("Invalid product ID format");
		error.statusCode = 400;
		throw error;
	}

	const product = await productRepo.findById(productId);

	if (!product) {
		const error = new Error("Product not found");
		error.statusCode = 404;
		throw error;
	}

	// Get inventory for this product across all stores
	const inventory = await productRepo.findInventoryByProduct(productId);

	// Calculate total quantity and per-store breakdown
	const storeInventory = {};
	let totalQuantity = 0;

	inventory.forEach((item) => {
		const storeId = item.storeId._id.toString();
		const storeName = item.storeId.name;

		if (!storeInventory[storeId]) {
			storeInventory[storeId] = {
				storeId,
				storeName,
				location: item.storeId.location,
				floor: 0,
				back: 0,
				total: 0,
			};
		}

		// Determine quantity based on item type
		let quantity = 0;

		if (item.cardContainer?.cardInventory) {
			// For card containers, find this specific product's quantity inside
			const matchingCards = item.cardContainer.cardInventory.filter((card) => {
				const cardProductId = card.productId?._id || card.productId;
				return cardProductId && cardProductId.toString() === productId;
			});
			quantity = matchingCards.reduce((sum, card) => sum + card.quantity, 0);
		} else {
			// For direct inventory, use the item's quantity
			quantity = item.quantity || 0;
		}

		if (item.location === LOCATIONS.FLOOR) {
			storeInventory[storeId].floor += quantity;
		} else {
			storeInventory[storeId].back += quantity;
		}
		storeInventory[storeId].total += quantity;
		totalQuantity += quantity;
	});

	return {
		product,
		inventory: {
			totalQuantity,
			stores: Object.values(storeInventory),
		},
	};
};

/**
 * Create new product
 * @param {Object} productData - Product data
 * @returns {Object} Created product
 * @throws {Error} If validation fails or SKU already exists
 */
exports.createProduct = async (productData) => {
	const {
		sku,
		productType,
		name,
		description,
		brand,
		cardDetails,
		unitSize,
		basePrice,
		bulkQuantity,
		isActive,
	} = productData;

	// Validate required fields
	if (
		!sku ||
		!productType ||
		!name ||
		!brand ||
		unitSize === undefined ||
		!basePrice
	) {
		const error = new Error("Missing required fields");
		error.statusCode = 400;
		throw error;
	}

	// Check for duplicate SKU
	const existingProduct = await productRepo.findBySku(sku);
	if (existingProduct) {
		const error = new Error("Product with this SKU already exists");
		error.statusCode = 400;
		throw error;
	}

	return productRepo.create({
		sku,
		productType,
		name,
		description,
		brand,
		cardDetails,
		unitSize,
		basePrice,
		bulkQuantity,
		isActive: isActive !== undefined ? isActive : true,
	});
};

/**
 * Update existing product
 * @param {String} productId - Product ID
 * @param {Object} updateData - Fields to update
 * @returns {Object} Updated product
 * @throws {Error} If validation fails or product not found
 */
exports.updateProduct = async (productId, updateData) => {
	// Validate ObjectId format
	if (!mongoose.Types.ObjectId.isValid(productId)) {
		const error = new Error("Invalid product ID format");
		error.statusCode = 400;
		throw error;
	}

	const {
		name,
		description,
		brand,
		cardDetails,
		basePrice,
		bulkQuantity,
		isActive,
	} = updateData;

	// Build updates object (SKU, productType, and unitSize cannot be changed)
	const updates = {};
	if (name !== undefined) updates.name = name;
	if (description !== undefined) updates.description = description;
	if (brand !== undefined) updates.brand = brand;
	if (cardDetails !== undefined) updates.cardDetails = cardDetails;
	if (basePrice !== undefined) updates.basePrice = basePrice;
	if (bulkQuantity !== undefined) updates.bulkQuantity = bulkQuantity;
	if (isActive !== undefined) updates.isActive = isActive;

	const product = await productRepo.update(productId, updates);

	if (!product) {
		const error = new Error("Product not found");
		error.statusCode = 404;
		throw error;
	}

	return product;
};

/**
 * Delete product (soft delete - set isActive to false)
 * @param {String} productId - Product ID
 * @throws {Error} If product not found
 */
exports.deleteProduct = async (productId) => {
	// Validate ObjectId format
	if (!mongoose.Types.ObjectId.isValid(productId)) {
		const error = new Error("Invalid product ID format");
		error.statusCode = 400;
		throw error;
	}

	// Check if product exists
	const product = await productRepo.findById(productId);
	if (!product) {
		const error = new Error("Product not found");
		error.statusCode = 404;
		throw error;
	}

	// Soft delete by setting isActive to false
	return productRepo.update(productId, { isActive: false });
};
