/**
 * Transfer Request Repository
 * Handles all database operations for transfer requests
 */

const { TransferRequest } = require("../models/transferRequest.model");

/**
 * Generate unique request number
 * Format: TR-YYYYMMDD-XXXX
 * @returns {Promise<string>} Request number
 */
exports.generateRequestNumber = async () => {
	const today = new Date();
	const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

	// Find the highest request number for today
	const prefix = `TR-${dateStr}-`;
	const lastRequest = await TransferRequest.findOne({
		requestNumber: new RegExp(`^${prefix}`),
	})
		.sort({ requestNumber: -1 })
		.limit(1);

	let sequence = 1;
	if (lastRequest) {
		const lastSequence = parseInt(lastRequest.requestNumber.slice(-4));
		sequence = lastSequence + 1;
	}

	return `${prefix}${sequence.toString().padStart(4, "0")}`;
};

/**
 * Find all transfer requests with optional filters
 * @param {Object} filters - Query filters
 * @returns {Promise<Array>} Array of transfer request documents
 */
exports.findAll = async (filters = {}) => {
	const query = { isActive: true };

	// Only add filters that have values
	if (filters.status) {
		query.status = filters.status;
	}

	return await TransferRequest.find(query)
		.populate("fromStoreId", "name location")
		.populate("toStoreId", "name location")
		.populate("createdBy", "username email")
		.populate("requestedBy", "username email")
		.populate("sentBy", "username email")
		.populate("completedBy", "username email")
		.populate("closedBy", "username email")
		.populate("items.productId", "name sku productType")
		.populate("items.inventoryId", "location containerType")
		.sort({ createdAt: -1 });
};

/**
 * Find transfer requests by store
 * Returns requests where the store is either sender or receiver
 * @param {string} storeId - Store ID
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} Array of transfer request documents
 */
exports.findByStore = async (storeId, filters = {}) => {
	const query = {
		$or: [{ fromStoreId: storeId }, { toStoreId: storeId }],
		isActive: true,
	};

	// Only add filters that have values
	if (filters.status) {
		query.status = filters.status;
	}

	return await TransferRequest.find(query)
		.populate("fromStoreId", "name location")
		.populate("toStoreId", "name location")
		.populate("createdBy", "username email")
		.populate("requestedBy", "username email")
		.populate("sentBy", "username email")
		.populate("completedBy", "username email")
		.populate("closedBy", "username email")
		.populate("items.productId", "name sku productType")
		.populate("items.inventoryId", "location containerType")
		.sort({ createdAt: -1 });
};

/**
 * Find transfer request by ID
 * @param {string} id - Transfer request ID
 * @returns {Promise<Object|null>} Transfer request document or null
 */
exports.findById = async (id) => {
	return await TransferRequest.findById(id)
		.populate("fromStoreId", "name location fullAddress")
		.populate("toStoreId", "name location fullAddress")
		.populate("createdBy", "username email role")
		.populate("requestedBy", "username email role")
		.populate("sentBy", "username email role")
		.populate("completedBy", "username email role")
		.populate("closedBy", "username email role")
		.populate("items.productId", "name sku productType brand basePrice")
		.populate("items.inventoryId", "location containerType containerName")
		.populate("items.cardItems.productId", "name sku");
};

/**
 * Find transfer request by request number
 * @param {string} requestNumber - Request number
 * @returns {Promise<Object|null>} Transfer request document or null
 */
exports.findByRequestNumber = async (requestNumber) => {
	return await TransferRequest.findOne({ requestNumber, isActive: true })
		.populate("fromStoreId", "name location")
		.populate("toStoreId", "name location")
		.populate("createdBy", "username email")
		.populate("items.productId", "name sku productType")
		.populate("items.inventoryId", "location containerType");
};

/**
 * Create new transfer request
 * @param {Object} requestData - Transfer request data
 * @returns {Promise<Object>} Created transfer request document
 */
exports.create = async (requestData) => {
	const transferRequest = new TransferRequest(requestData);
	await transferRequest.save();
	return await this.findById(transferRequest._id);
};

/**
 * Update transfer request
 * @param {string} id - Transfer request ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated transfer request document
 */
exports.update = async (id, updateData) => {
	await TransferRequest.findByIdAndUpdate(id, updateData, {
		new: true,
		runValidators: true,
	});
	return await this.findById(id);
};

/**
 * Delete transfer request (soft delete)
 * @param {string} id - Transfer request ID
 * @returns {Promise<Object>} Updated transfer request
 */
exports.delete = async (id) => {
	return await this.update(id, { isActive: false });
};

/**
 * Count transfer requests by status
 * @param {string} storeId - Optional store ID to filter by
 * @returns {Promise<Object>} Count by status
 */
exports.countByStatus = async (storeId = null) => {
	const match = { isActive: true };

	if (storeId) {
		match.$or = [{ fromStoreId: storeId }, { toStoreId: storeId }];
	}

	const result = await TransferRequest.aggregate([
		{ $match: match },
		{ $group: { _id: "$status", count: { $sum: 1 } } },
	]);

	return result.reduce((acc, item) => {
		acc[item._id] = item.count;
		return acc;
	}, {});
};

module.exports = exports;
