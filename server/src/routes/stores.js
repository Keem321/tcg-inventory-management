/**
 * Store routes
 * Handles store CRUD operations
 */

const express = require("express");
const { Store } = require("../models/Store");

const router = express.Router();

/**
 * GET /api/stores/:id
 * Get store by ID
 */
router.get("/:id", async (req, res) => {
	try {
		const store = await Store.findById(req.params.id);

		if (!store) {
			return res.status(404).json({
				success: false,
				message: "Store not found",
			});
		}

		res.json({
			success: true,
			store: {
				id: store._id,
				name: store.name,
				location: store.location,
				fullAddress: store.fullAddress,
				maxCapacity: store.maxCapacity,
				currentCapacity: store.currentCapacity,
				isActive: store.isActive,
			},
		});
	} catch (error) {
		console.error("Get store error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching store",
		});
	}
});

module.exports = router;
