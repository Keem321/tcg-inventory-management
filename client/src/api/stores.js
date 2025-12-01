import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const storeAPI = {
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
};
