import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const storeAPI = {
	/**
	 * Get all stores
	 * @returns {Promise<Object>} List of stores
	 */
	getStores: async () => {
		const response = await axios.get(`${API_URL}/api/stores`, {
			withCredentials: true,
		});
		return response.data;
	},

	/**
	 * Get store by ID
	 * @param {string} storeId - Store ID
	 * @returns {Promise<Object>} Store data
	 */
	getStore: async (storeId) => {
		const response = await axios.get(`${API_URL}/api/stores/${storeId}`, {
			withCredentials: true,
		});
		return response.data;
	},

	/**
	 * Create a new store
	 * @param {Object} storeData - Store data (name, location, maxCapacity)
	 * @returns {Promise<Object>} Created store data
	 */
	createStore: async (storeData) => {
		const response = await axios.post(`${API_URL}/api/stores`, storeData, {
			withCredentials: true,
		});
		return response.data;
	},

	/**
	 * Update an existing store
	 * @param {string} storeId - Store ID
	 * @param {Object} updates - Fields to update
	 * @returns {Promise<Object>} Updated store data
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
	 * Delete a store
	 * @param {string} storeId - Store ID
	 * @returns {Promise<Object>} Deletion confirmation
	 */
	deleteStore: async (storeId) => {
		const response = await axios.delete(`${API_URL}/api/stores/${storeId}`, {
			withCredentials: true,
		});
		return response.data;
	},
};
