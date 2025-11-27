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
 * Authentication API
 *
 * Endpoints (server-side routes in /server/routes/auth.js):
 * - POST /api/auth/login - Authenticates user with username/password
 * - POST /api/auth/logout - Ends user session
 * - GET /api/auth/session - Verifies current session status
 */
export const authAPI = {
	login: async (username, password) => {
		const response = await api.post("/api/auth/login", { username, password });
		return response.data;
	},

	logout: async () => {
		const response = await api.post("/api/auth/logout");
		return response.data;
	},

	checkSession: async () => {
		const response = await api.get("/api/auth/session");
		return response.data;
	},
};

export default api;
