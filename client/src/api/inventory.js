/**
 * Inventory API Client
 * @module api/inventory
 * @description Handles inventory management operations including containers and card inventory
 */

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Inventory API endpoints
 * @namespace inventoryAPI
 */
export const inventoryAPI = {
	/**
	 * Get inventory for a specific store
	 * @param {string} storeId - Store ID
	 * @param {Object} options - Optional filters (location, productId)
	 * @returns {Promise<Object>} Inventory data
	 */
	getInventoryByStore: async (storeId, options = {}) => {
		const params = {};
		if (options.location) {
			params.location = options.location;
		}
		if (options.productId) {
			params.productId = options.productId;
		}

		const response = await axios.get(
			`${API_URL}/api/inventory/store/${storeId}`,
			{
				params,
				withCredentials: true,
			}
		);
		return response.data;
	},

	/**
	 * Get all inventory across all stores (Partner only)
	 * @param {Object} options - Optional filters
	 * @returns {Promise<Object>} All inventory data
	 */
	getAllInventory: async (options = {}) => {
		const params = {};
		if (options.location) {
			params.location = options.location;
		}
		if (options.storeId) {
			params.storeId = options.storeId;
		}

		const response = await axios.get(`${API_URL}/api/inventory`, {
			params,
			withCredentials: true,
		});
		return response.data;
	},

	/**
	 * Check for duplicate inventory entries
	 * @param {string} storeId - Store ID
	 * @param {string} productId - Product ID
	 * @param {string} location - Location (floor/back)
	 * @returns {Promise<Object>} Duplicate check results
	 */
	checkDuplicate: async (storeId, productId, location) => {
		const response = await axios.post(
			`${API_URL}/api/inventory/check-duplicate`,
			{ storeId, productId, location },
			{
				withCredentials: true,
			}
		);
		return response.data;
	},

	/**
	 * Create new inventory item
	 * @param {Object} inventoryData - Inventory data
	 * @returns {Promise<Object>} Created inventory
	 */
	createInventory: async (inventoryData) => {
		const response = await axios.post(
			`${API_URL}/api/inventory`,
			inventoryData,
			{
				withCredentials: true,
			}
		);
		return response.data;
	},

	/**
	 * Update inventory item
	 * @param {string} inventoryId - Inventory ID
	 * @param {Object} updates - Fields to update
	 * @returns {Promise<Object>} Updated inventory
	 */
	updateInventory: async (inventoryId, updates) => {
		const response = await axios.put(
			`${API_URL}/api/inventory/${inventoryId}`,
			updates,
			{
				withCredentials: true,
			}
		);
		return response.data;
	},

	/**
	 * Delete inventory item
	 * @param {string} inventoryId - Inventory ID
	 * @returns {Promise<Object>} Deletion confirmation
	 */
	deleteInventory: async (inventoryId) => {
		const response = await axios.delete(
			`${API_URL}/api/inventory/${inventoryId}`,
			{
				withCredentials: true,
			}
		);
		return response.data;
	},
};
