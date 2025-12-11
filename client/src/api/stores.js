/**
 * @module api/stores
 * @description Store API client for managing store locations
 */

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Store API namespace
 * @namespace storeAPI
 */
export const storeAPI = {
	/**
	 * Get all active stores
	 * @async
	 * @returns {Promise<Object>} Response with success flag and stores array
	 * @throws {Error} If request fails
	 */
	getStores: async () => {
		const response = await axios.get(`${API_URL}/api/stores`, {
			withCredentials: true,
		});
		return response.data;
	},

	/**
	 * Get store by ID
	 * @async
	 * @param {string} storeId - Store ID
	 * @returns {Promise<Object>} Response with store data including capacity information
	 * @throws {Error} If store not found or request fails
	 */
	getStore: async (storeId) => {
		const response = await axios.get(`${API_URL}/api/stores/${storeId}`, {
			withCredentials: true,
		});
		return response.data;
	},

	/**
	 * Create a new store
	 * @async
	 * @param {Object} storeData - Store data
	 * @param {string} storeData.name - Store name
	 * @param {Object} storeData.location - Store location
	 * @param {number} storeData.maxCapacity - Maximum capacity in cubic units
	 * @returns {Promise<Object>} Response with created store
	 * @throws {Error} If validation fails
	 */
	createStore: async (storeData) => {
		const response = await axios.post(`${API_URL}/api/stores`, storeData, {
			withCredentials: true,
		});
		return response.data;
	},

	/**
	 * Update an existing store
	 * Note: Cannot set maxCapacity below current capacity
	 * @async
	 * @param {string} storeId - Store ID
	 * @param {Object} updates - Fields to update
	 * @returns {Promise<Object>} Response with updated store
	 * @throws {Error} If store not found or validation fails
	 */
	updateStore: async (storeId, updates) => {
		const response = await axios.put(
			`${API_URL}/api/stores/${storeId}`,
			updates,
			{
				withCredentials: true,
			}
		);
		return response.data;
	},

	/**
	 * Delete a store (soft delete - sets isActive to false)
	 * Cannot delete stores with assigned users or active inventory
	 * @async
	 * @param {string} storeId - Store ID
	 * @returns {Promise<Object>} Response with deletion confirmation
	 * @throws {Error} If store has assigned users or inventory
	 */
	deleteStore: async (storeId) => {
		const response = await axios.delete(`${API_URL}/api/stores/${storeId}`, {
			withCredentials: true,
		});
		return response.data;
	},
};
