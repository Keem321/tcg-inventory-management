/**
 * TCG Inventory Management - Server Entry Point
 */

require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const { connectDatabase } = require("./src/config/database");
const authRoutes = require("./src/routes/auth");
const storeRoutes = require("./src/routes/stores");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI =
	process.env.MONGODB_URI || "mongodb://localhost:27017/tcg-inventory";

// Middleware
app.use(
	cors({
		origin: process.env.CLIENT_URL || "http://localhost:5173",
		credentials: true,
	})
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
	session({
		secret: process.env.SESSION_SECRET || "default-unsecure-key",
		resave: false,
		saveUninitialized: false,
		cookie: {
			secure: process.env.NODE_ENV === "production",
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24, // 24 hours
		},
	})
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/stores", storeRoutes);

// A simple health check endpoint
app.get("/api/health", (req, res) => {
	res.json({ status: "ok", message: "Server is running" });
});

// Start server
async function startServer() {
	try {
		// Connect to MongoDB
		await connectDatabase(MONGODB_URI);

		// Start listening
		const server = app.listen(PORT, "0.0.0.0", () => {
			console.log(`🚀 Server running on http://localhost:${PORT}`);
			console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
		});

		server.on("error", (error) => {
			console.error("Server error:", error);
			process.exit(1);
		});

		// Handle process termination
		process.on("SIGTERM", () => {
			console.log("SIGTERM received. Closing server...");
			server.close(() => {
				console.log("Server closed");
				process.exit(0);
			});
		});
	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
}

startServer();

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
	console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
