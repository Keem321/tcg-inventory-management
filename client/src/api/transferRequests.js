/**
 * @module api/transferRequests
 * @description Transfer Request API client for inventory movement between stores
 */

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Transfer Request API namespace
 * @namespace transferRequestAPI
 */
export const transferRequestAPI = {
	/**
	 * Create a new transfer request
	 * Store managers can only create requests involving their store
	 * @async
	 * @param {Object} requestData - Request data
	 * @param {string} requestData.fromStoreId - Source store ID
	 * @param {string} requestData.toStoreId - Destination store ID
	 * @param {Array<Object>} requestData.items - Items to transfer
	 * @param {string} [requestData.notes] - Additional notes
	 * @returns {Promise<Object>} Response with created transfer request and request number
	 * @throws {Error} If validation fails or insufficient inventory
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
	 * Partners see all, managers see only their store's requests
	 * @async
	 * @param {Object} [options={}] - Filter options
	 * @param {string} [options.status] - Filter by status
	 * @param {string} [options.storeId] - Filter by store ID (partners only)
	 * @returns {Promise<Object>} Response with transfer requests array
	 * @throws {Error} If request fails
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
	 * @async
	 * @param {string} id - Transfer request ID
	 * @returns {Promise<Object>} Response with transfer request details
	 * @throws {Error} If not found or insufficient permissions
	 */
	getTransferRequestById: async (id) => {
		const response = await axios.get(`${API_URL}/api/transfer-requests/${id}`, {
			withCredentials: true,
		});
		return response.data;
	},

	/**
	 * Update transfer request status
	 * Enforces role-based state transition rules
	 * @async
	 * @param {string} id - Transfer request ID
	 * @param {string} status - New status ('approved', 'in-transit', 'completed', 'cancelled')
	 * @param {string} [closeReason=null] - Reason for closing/cancelling
	 * @returns {Promise<Object>} Response with updated transfer request
	 * @throws {Error} If invalid transition or insufficient permissions
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
	 * Only partners can delete, and only if status is 'open' or 'closed'
	 * @async
	 * @param {string} id - Transfer request ID
	 * @returns {Promise<Object>} Response with deletion confirmation
	 * @throws {Error} If not a partner or invalid status
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
