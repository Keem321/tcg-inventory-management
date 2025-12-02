import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
};
