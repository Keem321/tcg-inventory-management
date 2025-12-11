/**
 * Authentication API Client
 * @module api/auth
 * @description Handles user authentication and session management
 */

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
	baseURL: API_URL,
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
	},
});

/**
 * Authentication API endpoints
 * @namespace authAPI
 */
export const authAPI = {
	/**
	 * Authenticate user with username and password
	 * @async
	 * @param {string} username - User's username
	 * @param {string} password - User's password
	 * @returns {Promise<Object>} Response containing user data and session info
	 * @throws {Error} If authentication fails
	 */
	login: async (username, password) => {
		const response = await api.post("/api/auth/login", { username, password });
		return response.data;
	},

	/**
	 * End current user session
	 * @async
	 * @returns {Promise<Object>} Response confirming logout
	 */
	logout: async () => {
		const response = await api.post("/api/auth/logout");
		return response.data;
	},

	/**
	 * Check if current session is valid
	 * @async
	 * @returns {Promise<Object>} Response containing current user data if session is valid
	 * @throws {Error} If session is invalid or expired
	 */
	checkSession: async () => {
		const response = await api.get("/api/auth/session");
		return response.data;
	},
};

export default api;
