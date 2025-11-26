require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
	res.json({ status: "ok" });
});

// TODO: add routes here

// Connect to MongoDB
const PORT = process.env.PORT || 4000;
const MONGODB_URI =
	process.env.MONGODB_URI || "mongodb://localhost:27017/db-tcg-inventory";

mongoose
	.connect(MONGODB_URI)
	.then(() => {
		console.log("Connected to MongoDB");
		app.listen(PORT, () => {
			console.log(`Server is running on port ${PORT}`);
		});
	})
	.catch((error) => {
		console.error("Error connecting to MongoDB:", error);
	});
