/**
 * Authentication routes
 * Handles login, logout, and session management
 */

const express = require("express");
const bcrypt = require("bcrypt");
const { User } = require("../models/User");

const router = express.Router();

/**
 * POST /api/auth/login
 * Login user and create session
 */
router.post("/login", async (req, res) => {
	try {
		const { username, password } = req.body;

		// Validate input
		if (!username || !password) {
			return res.status(400).json({
				success: false,
				message: "Username and password are required",
			});
		}

		// Find user by username
		const user = await User.findOne({ username });

		if (!user) {
			return res.status(401).json({
				success: false,
				message: "Invalid username or password",
			});
		}

		// Check if user is active
		if (!user.isActive) {
			return res.status(403).json({
				success: false,
				message: "Account is inactive. Please contact administrator.",
			});
		}

		// Verify password
		const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

		if (!isPasswordValid) {
			return res.status(401).json({
				success: false,
				message: "Invalid username or password",
			});
		}

		// Update last login
		user.lastLogin = new Date();
		await user.save();

		// Create session
		req.session.userId = user._id.toString();
		req.session.role = user.role;
		req.session.assignedStoreId = user.assignedStoreId?.toString() || null;

		// Return user data (without password hash)
		res.json({
			success: true,
			message: "Login successful",
			user: {
				id: user._id,
				username: user.username,
				email: user.email,
				role: user.role,
				assignedStoreId: user.assignedStoreId,
				firstName: user.firstName,
				lastName: user.lastName,
				fullName: user.fullName,
			},
		});
	} catch (error) {
		console.error("Login error:", error);

		// In development, return more detailed error
		const isDev = process.env.NODE_ENV !== "production";
		res.status(500).json({
			success: false,
			message: "An error occurred during login",
			...(isDev && { error: error.message, stack: error.stack }),
		});
	}
});

/**
 * POST /api/auth/logout
 * Logout user and destroy session
 */
router.post("/logout", (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			return res.status(500).json({
				success: false,
				message: "Error during logout",
			});
		}

		res.clearCookie("connect.sid");
		res.json({
			success: true,
			message: "Logout successful",
		});
	});
});

/**
 * GET /api/auth/session
 * Check current session and return user data
 */
router.get("/session", async (req, res) => {
	try {
		if (!req.session.userId) {
			return res.status(401).json({
				success: false,
				message: "Not authenticated",
			});
		}

		// Fetch current user data
		const user = await User.findById(req.session.userId);

		if (!user || !user.isActive) {
			req.session.destroy();
			return res.status(401).json({
				success: false,
				message: "Session invalid",
			});
		}

		res.json({
			success: true,
			user: {
				id: user._id,
				username: user.username,
				email: user.email,
				role: user.role,
				assignedStoreId: user.assignedStoreId,
				firstName: user.firstName,
				lastName: user.lastName,
				fullName: user.fullName,
			},
		});
	} catch (error) {
		console.error("Session check error:", error);
		res.status(500).json({
			success: false,
			message: "Error checking session",
		});
	}
});

module.exports = router;
