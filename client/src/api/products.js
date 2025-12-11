/**
 * @module api/products
 * @description Product API client for managing TCG products
 */

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Product API namespace
 * @namespace productAPI
 */
export const productAPI = {
	/**
	 * Get all products with optional filtering
	 * @async
	 * @param {Object} [options={}] - Filter options
	 * @param {string} [options.productType] - Filter by product type
	 * @param {string} [options.brand] - Filter by brand
	 * @param {boolean|string} [options.isActive] - Filter by active status
	 * @param {string} [options.search] - Search term for name/SKU
	 * @returns {Promise<Object>} Response with success flag and products array
	 * @throws {Error} If request fails
	 */
	getProducts: async (options = {}) => {
		const params = {};
		if (options.productType) {
			params.productType = options.productType;
		}
		if (options.brand) {
			params.brand = options.brand;
		}
		if (options.isActive !== undefined) {
			params.isActive = options.isActive;
		}
		if (options.search) {
			params.search = options.search;
		}

		const response = await axios.get(`${API_URL}/api/products`, {
			params,
			withCredentials: true,
		});
		return response.data;
	},

	/**
	 * Get all unique brands from active products
	 * @async
	 * @returns {Promise<Object>} Response with success flag and brands array
	 * @throws {Error} If request fails
	 */
	getBrands: async () => {
		const response = await axios.get(`${API_URL}/api/products/brands`, {
			withCredentials: true,
		});
		return response.data;
	},

	/**
	 * Get product by ID with inventory details
	 * Includes per-store inventory breakdown (floor/back quantities)
	 * @async
	 * @param {string} productId - Product ID
	 * @returns {Promise<Object>} Response with product and inventory data
	 * @throws {Error} If product not found or request fails
	 */
	getProduct: async (productId) => {
		const response = await axios.get(`${API_URL}/api/products/${productId}`, {
			withCredentials: true,
		});
		return response.data;
	},

	/**
	 * Create a new product
	 * @async
	 * @param {Object} productData - Product data
	 * @param {string} productData.sku - Unique product SKU
	 * @param {string} productData.productType - Product type
	 * @param {string} productData.name - Product name
	 * @param {string} productData.brand - Brand name
	 * @param {number} productData.unitSize - Unit size in cubic units
	 * @param {number} productData.basePrice - Base price
	 * @returns {Promise<Object>} Response with created product
	 * @throws {Error} If validation fails or SKU already exists
	 */
	createProduct: async (productData) => {
		const response = await axios.post(`${API_URL}/api/products`, productData, {
			withCredentials: true,
		});
		return response.data;
	},

	/**
	 * Update an existing product
	 * Note: SKU, productType, and unitSize cannot be changed
	 * @async
	 * @param {string} productId - Product ID
	 * @param {Object} updates - Fields to update
	 * @returns {Promise<Object>} Response with updated product
	 * @throws {Error} If product not found or validation fails
	 */
	updateProduct: async (productId, updates) => {
		const response = await axios.put(
			`${API_URL}/api/products/${productId}`,
			updates,
			{
				withCredentials: true,
			}
		);
		return response.data;
	},

	/**
	 * Delete a product (soft delete - sets isActive to false)
	 * @async
	 * @param {string} productId - Product ID
	 * @returns {Promise<Object>} Response with deletion confirmation
	 * @throws {Error} If product not found
	 */
	deleteProduct: async (productId) => {
		const response = await axios.delete(
			`${API_URL}/api/products/${productId}`,
			{
				withCredentials: true,
			}
		);
		return response.data;
	},
};
