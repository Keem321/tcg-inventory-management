import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const transferRequestAPI = {
	/**
	 * Create a new transfer request
	 * @param {Object} requestData - { fromStoreId, toStoreId, items, notes }
	 * @returns {Promise<Object>} Created transfer request
	 */
	createTransferRequest: async (requestData) => {
		const response = await axios.post(
			`${API_URL}/api/transfer-requests`,
			requestData,
			{
				withCredentials: true,
			}
		);
		return response.data;
	},

	/**
	 * Get all transfer requests (filtered by user permissions)
	 * @param {Object} options - Optional filters { status, storeId }
	 * @returns {Promise<Object>} Transfer requests
	 */
	getTransferRequests: async (options = {}) => {
		const params = {};
		if (options.status) {
			params.status = options.status;
		}
		if (options.storeId) {
			params.storeId = options.storeId;
		}

		const response = await axios.get(`${API_URL}/api/transfer-requests`, {
			params,
			withCredentials: true,
		});
		return response.data;
	},

	/**
	 * Get a specific transfer request by ID
	 * @param {string} id - Transfer request ID
	 * @returns {Promise<Object>} Transfer request
	 */
	getTransferRequestById: async (id) => {
		const response = await axios.get(`${API_URL}/api/transfer-requests/${id}`, {
			withCredentials: true,
		});
		return response.data;
	},

	/**
	 * Update transfer request status
	 * @param {string} id - Transfer request ID
	 * @param {string} status - New status
	 * @param {string} closeReason - Optional close reason (for status 'closed')
	 * @returns {Promise<Object>} Updated transfer request
	 */
	updateTransferStatus: async (id, status, closeReason = null) => {
		const response = await axios.patch(
			`${API_URL}/api/transfer-requests/${id}/status`,
			{ status, closeReason },
			{
				withCredentials: true,
			}
		);
		return response.data;
	},

	/**
	 * Delete a transfer request (soft delete)
	 * @param {string} id - Transfer request ID
	 * @returns {Promise<Object>} Deleted transfer request
	 */
	deleteTransferRequest: async (id) => {
		const response = await axios.delete(
			`${API_URL}/api/transfer-requests/${id}`,
			{
				withCredentials: true,
			}
		);
		return response.data;
	},
};
