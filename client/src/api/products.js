import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const productAPI = {
	/**
	 * Get all products with optional filtering
	 * @param {Object} options - Filter options (productType, brand, isActive, search)
	 * @returns {Promise<Object>} Products data
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
	 * Get all unique brands
	 * @returns {Promise<Object>} Brands data
	 */
	getBrands: async () => {
		const response = await axios.get(`${API_URL}/api/products/brands`, {
			withCredentials: true,
		});
		return response.data;
	},

	/**
	 * Get product by ID with inventory details
	 * @param {string} productId - Product ID
	 * @returns {Promise<Object>} Product data with inventory breakdown
	 */
	getProduct: async (productId) => {
		const response = await axios.get(`${API_URL}/api/products/${productId}`, {
			withCredentials: true,
		});
		return response.data;
	},

	/**
	 * Create a new product
	 * @param {Object} productData - Product data
	 * @returns {Promise<Object>} Created product
	 */
	createProduct: async (productData) => {
		const response = await axios.post(`${API_URL}/api/products`, productData, {
			withCredentials: true,
		});
		return response.data;
	},

	/**
	 * Update an existing product
	 * @param {string} productId - Product ID
	 * @param {Object} updates - Fields to update
	 * @returns {Promise<Object>} Updated product
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
	 * Delete a product
	 * @param {string} productId - Product ID
	 * @returns {Promise<Object>} Deletion confirmation
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
