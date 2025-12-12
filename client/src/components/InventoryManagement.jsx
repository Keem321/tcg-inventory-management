/**
 * InventoryManagement Component
 * Main page for managing inventory with role-based access
 */

import { useState, useEffect, useCallback } from "react";
import {
	Container,
	Row,
	Col,
	Card,
	Form,
	Table,
	Button,
	Badge,
	Spinner,
	Alert,
	ButtonGroup,
} from "react-bootstrap";
import { inventoryAPI } from "../api/inventory";
import { storeAPI } from "../api/stores";
import { productAPI } from "../api/products";
import CreateInventoryModal from "./modals/CreateInventoryModal";
import UpdateInventoryModal from "./modals/UpdateInventoryModal";
import DeleteInventoryModal from "./modals/DeleteInventoryModal";
import { PRODUCT_TYPES, PRODUCT_TYPE_LABELS } from "../constants/enums";
import { useDebounce } from "../hooks";

/**
 * Inventory Management Component
 * Displays and manages inventory across stores with role-based access
 */
function InventoryManagement({ user }) {
	const [inventory, setInventory] = useState([]);
	const [stores, setStores] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);

	// Store capacity
	const [storeCapacity, setStoreCapacity] = useState({
		current: 0,
		max: 0,
	});

	// Filters
	const [selectedStore, setSelectedStore] = useState("");
	const [locationFilter, setLocationFilter] = useState("all"); // all, floor, back
	const [productTypeFilter, setProductTypeFilter] = useState("");
	const [brandFilter, setBrandFilter] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const debouncedSearchTerm = useDebounce(searchTerm, 300, 2);

	// CRUD Modals
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showUpdateModal, setShowUpdateModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [selectedItem, setSelectedItem] = useState(null);

	// Create form
	const [products, setProducts] = useState([]);
	const [brands, setBrands] = useState([]);
	const [productSearch, setProductSearch] = useState("");
	const [selectedProduct, setSelectedProduct] = useState(null);
	const [newInventory, setNewInventory] = useState({
		quantity: 0,
		location: "floor",
		minStockLevel: 0,
		notes: "",
	});

	// Update form
	const [updateForm, setUpdateForm] = useState({
		quantity: 0,
		location: "floor",
		minStockLevel: 0,
		notes: "",
	});

	// Determine user's accessible stores
	const isPartner = user?.role === "partner";
	const hasStoreAssignment = user?.assignedStoreId;

	const loadInventory = useCallback(async () => {
		try {
			setError(null);

			const options = {};
			if (locationFilter !== "all") {
				options.location = locationFilter;
			}

			let response;
			let currentStoreId = null;

			if (isPartner && selectedStore === "all") {
				// Partner viewing all stores
				response = await inventoryAPI.getAllInventory(options);
			} else if (isPartner && selectedStore && selectedStore !== "all") {
				// Partner viewing specific store
				currentStoreId = selectedStore;
				response = await inventoryAPI.getInventoryByStore(
					selectedStore,
					options
				);
			} else if (hasStoreAssignment) {
				// Employee/Manager viewing their assigned store
				currentStoreId = user.assignedStoreId;
				response = await inventoryAPI.getInventoryByStore(
					user.assignedStoreId,
					options
				);
			}

			setInventory(response?.inventory || []);

			// Load store capacity if viewing a specific store
			if (currentStoreId) {
				const storeResponse = await storeAPI.getStore(currentStoreId);
				if (storeResponse?.store) {
					setStoreCapacity({
						current: storeResponse.store.currentCapacity || 0,
						max: storeResponse.store.maxCapacity || 0,
					});
				}
			} else {
				setStoreCapacity({ current: 0, max: 0 });
			}
		} catch (err) {
			setError(err.response?.data?.message || err.message);
		}
	}, [
		locationFilter,
		selectedStore,
		isPartner,
		hasStoreAssignment,
		user?.assignedStoreId,
	]);

	const loadStoresAndInventory = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			// Load stores
			const response = await storeAPI.getStores();
			setStores(response.stores);

			// Set initial store selection based on role
			if (!isPartner && hasStoreAssignment) {
				// Employee/Manager: auto-select their assigned store
				setSelectedStore(user.assignedStoreId);
			} else if (isPartner && response.stores.length > 0) {
				// Partner: select first store or show all
				setSelectedStore("all");
			}
		} catch (err) {
			setError(err.response?.data?.message || err.message);
		} finally {
			setLoading(false);
		}
	}, [isPartner, hasStoreAssignment, user?.assignedStoreId]);

	useEffect(() => {
		loadStoresAndInventory();
	}, [loadStoresAndInventory]);

	// Load brands on mount
	useEffect(() => {
		const loadBrands = async () => {
			try {
				const response = await productAPI.getBrands();
				setBrands(response.brands);
			} catch (err) {
				console.error("Error loading brands:", err);
			}
		};
		loadBrands();
	}, []);

	// Reload inventory when filters change or when selectedStore is first set
	useEffect(() => {
		// Don't load if still loading stores, or if no store selected
		if (loading || !selectedStore) {
			return;
		}

		// For partners, validate that selectedStore is either "all" or a valid ObjectId
		if (isPartner) {
			if (selectedStore !== "all" && !/^[0-9a-fA-F]{24}$/.test(selectedStore)) {
				return; // Skip if invalid format
			}
		}

		// For employees/managers, validate assignedStoreId
		if (!isPartner && hasStoreAssignment) {
			if (!/^[0-9a-fA-F]{24}$/.test(user?.assignedStoreId)) {
				return; // Skip if invalid format
			}
		}

		loadInventory();
	}, [
		selectedStore,
		locationFilter,
		loading,
		loadInventory,
		isPartner,
		hasStoreAssignment,
		user?.assignedStoreId,
	]);

	// Filter inventory by search term, product type, and brand
	const filteredInventory = inventory.filter((item) => {
		// Product type filter
		if (
			productTypeFilter &&
			item.productId?.productType !== productTypeFilter
		) {
			return false;
		}

		// Brand filter
		if (brandFilter && item.productId?.brand !== brandFilter) {
			return false;
		}

		// Search filter
		if (!debouncedSearchTerm) return true;

		const search = debouncedSearchTerm.toLowerCase();
		const productName = item.productId?.name?.toLowerCase() || "";
		const productSku = item.productId?.sku?.toLowerCase() || "";
		const storeName = item.storeId?.name?.toLowerCase() || "";
		const containerName =
			item.cardContainer?.containerName?.toLowerCase() || "";

		return (
			productName.includes(search) ||
			productSku.includes(search) ||
			storeName.includes(search) ||
			containerName.includes(search)
		);
	});

	// Product types for filter
	const productTypes = Object.values(PRODUCT_TYPES);

	// Format product type for display
	const formatProductType = (type) => {
		return PRODUCT_TYPE_LABELS[type] || type;
	};

	// Get store name by ID
	const getStoreName = (storeId) => {
		const store = stores.find((s) => s._id === storeId);
		return store?.name || "Unknown Store";
	};

	// CRUD Handlers
	const handleOpenCreateModal = async () => {
		try {
			const response = await productAPI.getProducts();
			setProducts(response.products || []);
			setShowCreateModal(true);
		} catch (err) {
			setError(
				"Failed to load products: " +
					(err.response?.data?.message || err.message)
			);
		}
	};

	const handleCheckDuplicate = async (productId, location) => {
		try {
			const targetStoreId = isPartner ? selectedStore : user.assignedStoreId;

			if (!targetStoreId || targetStoreId === "all") {
				return { exactMatch: null, differentLocation: null };
			}

			const result = await inventoryAPI.checkDuplicate(
				targetStoreId,
				productId,
				location
			);
			return result;
		} catch (err) {
			console.error("Error checking duplicate:", err);
			return { exactMatch: null, differentLocation: null };
		}
	};

	const handleCreateInventory = async () => {
		try {
			setError(null);
			if (!selectedProduct) {
				setError("Please select a product");
				return;
			}

			const targetStoreId = isPartner ? selectedStore : user.assignedStoreId;

			if (!targetStoreId || targetStoreId === "all") {
				setError("Please select a specific store");
				return;
			}

			// Check capacity
			const requiredSpace = selectedProduct.unitSize * newInventory.quantity;
			const availableSpace = storeCapacity.max - storeCapacity.current;

			if (requiredSpace > availableSpace) {
				setError(
					`Not enough capacity. Required: ${requiredSpace}, Available: ${availableSpace}`
				);
				return;
			}

			const response = await inventoryAPI.createInventory({
				storeId: targetStoreId,
				productId: selectedProduct._id,
				quantity: parseInt(newInventory.quantity),
				location: newInventory.location,
				minStockLevel: parseInt(newInventory.minStockLevel),
				notes: newInventory.notes || undefined,
			});

			if (response.merged) {
				setSuccess(
					`Inventory updated - added ${newInventory.quantity} units to existing stock`
				);
			} else {
				setSuccess("Inventory created successfully");
			}

			setShowCreateModal(false);
			setSelectedProduct(null);
			setNewInventory({
				quantity: 0,
				location: "floor",
				minStockLevel: 0,
				notes: "",
			});
			setProductSearch("");
			await loadInventory();
		} catch (err) {
			setError(
				"Failed to create inventory: " +
					(err.response?.data?.message || err.message)
			);
		}
	};

	const handleOpenUpdateModal = (item) => {
		setSelectedItem(item);
		setUpdateForm({
			quantity: item.quantity || 0,
			location: item.location || "floor",
			minStockLevel: item.minStockLevel || 0,
			notes: item.notes || "",
		});
		setShowUpdateModal(true);
	};

	const handleUpdateInventory = async () => {
		try {
			setError(null);

			if (!selectedItem) return;

			const isContainer = selectedItem.cardContainer !== null;

			// For non-containers, calculate capacity change
			if (!isContainer) {
				const oldSpace =
					selectedItem.productId?.unitSize * selectedItem.quantity;
				const newSpace = selectedItem.productId?.unitSize * updateForm.quantity;
				const spaceChange = newSpace - oldSpace;
				const availableSpace = storeCapacity.max - storeCapacity.current;

				if (spaceChange > availableSpace) {
					setError(
						`Not enough capacity. Required additional: ${spaceChange}, Available: ${availableSpace}`
					);
					return;
				}
			}

			// Build update payload based on item type
			const updatePayload = {
				location: updateForm.location,
				notes: updateForm.notes || undefined,
			};

			// Only include quantity and minStockLevel for non-containers
			if (!isContainer) {
				updatePayload.quantity = parseInt(updateForm.quantity);
				updatePayload.minStockLevel = parseInt(updateForm.minStockLevel);
			}

			await inventoryAPI.updateInventory(selectedItem._id, updatePayload);

			setSuccess(
				isContainer
					? "Container updated successfully"
					: "Inventory updated successfully"
			);
			setShowUpdateModal(false);
			setSelectedItem(null);
			await loadInventory();
		} catch (err) {
			setError(
				"Failed to update inventory: " +
					(err.response?.data?.message || err.message)
			);
		}
	};

	const handleOpenDeleteModal = (item) => {
		setSelectedItem(item);
		setShowDeleteModal(true);
	};

	const handleDeleteInventory = async () => {
		try {
			setError(null);

			if (!selectedItem) return;

			await inventoryAPI.deleteInventory(selectedItem._id);

			setSuccess("Inventory removed successfully");
			setShowDeleteModal(false);
			setSelectedItem(null);
			await loadInventory();
		} catch (err) {
			setError(
				"Failed to delete inventory: " +
					(err.response?.data?.message || err.message)
			);
		}
	};

	if (loading) {
		return (
			<Container className="mt-4 text-center">
				<Spinner animation="border" role="status">
					<span className="visually-hidden">Loading...</span>
				</Spinner>
				<p className="mt-2">Loading inventory...</p>
			</Container>
		);
	}

	return (
		<Container className="mt-4">
			<div className="mb-4">
				<h2>Inventory Management</h2>
				<p className="text-muted">
					{isPartner
						? "View and manage inventory across all stores"
						: `Managing inventory for ${getStoreName(user.assignedStoreId)}`}
				</p>
			</div>

			{error && (
				<Alert variant="danger" dismissible onClose={() => setError(null)}>
					{error}
				</Alert>
			)}

			{success && (
				<Alert variant="success" dismissible onClose={() => setSuccess(null)}>
					{success}
				</Alert>
			)}

			{/* Store Capacity Display */}
			{storeCapacity.max > 0 && (
				<Card className="mb-4">
					<Card.Body>
						<div className="d-flex justify-content-between align-items-center mb-3">
							<h5 className="mb-0">Store Capacity</h5>
							<Badge
								bg={
									storeCapacity.current / storeCapacity.max >= 0.9
										? "danger"
										: storeCapacity.current / storeCapacity.max >= 0.75
										? "warning"
										: "success"
								}
								className="fs-6"
							>
								{Math.round((storeCapacity.current / storeCapacity.max) * 100)}%
							</Badge>
						</div>
						<div className="mb-2">
							<div className="d-flex justify-content-between text-muted small mb-1">
								<span>
									{storeCapacity.current} / {storeCapacity.max} units
								</span>
								<span>
									{storeCapacity.max - storeCapacity.current} units available
								</span>
							</div>
							<div className="progress" style={{ height: "20px" }}>
								<div
									className={`progress-bar ${
										storeCapacity.current / storeCapacity.max >= 0.9
											? "bg-danger"
											: storeCapacity.current / storeCapacity.max >= 0.75
											? "bg-warning"
											: "bg-success"
									}`}
									role="progressbar"
									style={{
										width: `${
											(storeCapacity.current / storeCapacity.max) * 100
										}%`,
									}}
									aria-valuenow={storeCapacity.current}
									aria-valuemin="0"
									aria-valuemax={storeCapacity.max}
								/>
							</div>
						</div>
						{storeCapacity.current / storeCapacity.max >= 0.9 && (
							<Alert variant="danger" className="mb-0 mt-2">
								<strong>Warning:</strong> Store is at{" "}
								{Math.round((storeCapacity.current / storeCapacity.max) * 100)}%
								capacity!
							</Alert>
						)}
					</Card.Body>
				</Card>
			)}

			{/* Filters */}
			<Card className="mb-4">
				<Card.Body>
					<Row>
						{/* Store Selector (Partners only) */}
						{isPartner && (
							<Col md={3} className="mb-3">
								<Form.Group>
									<Form.Label>Store</Form.Label>
									<Form.Select
										value={selectedStore}
										onChange={(e) => setSelectedStore(e.target.value)}
									>
										<option value="all">All Stores</option>
										{stores.map((store) => (
											<option key={store._id} value={store._id}>
												{store.name}
											</option>
										))}
									</Form.Select>
								</Form.Group>
							</Col>
						)}

						{/* Product Type Filter */}
						<Col md={isPartner ? 3 : 4} className="mb-3">
							<Form.Group>
								<Form.Label>Product Type</Form.Label>
								<Form.Select
									value={productTypeFilter}
									onChange={(e) => setProductTypeFilter(e.target.value)}
								>
									<option value="">All Types</option>
									{productTypes.map((type) => (
										<option key={type} value={type}>
											{formatProductType(type)}
										</option>
									))}
								</Form.Select>
							</Form.Group>
						</Col>

						{/* Brand Filter */}
						<Col md={isPartner ? 3 : 4} className="mb-3">
							<Form.Group>
								<Form.Label>Brand</Form.Label>
								<Form.Select
									value={brandFilter}
									onChange={(e) => setBrandFilter(e.target.value)}
								>
									<option value="">All Brands</option>
									{brands.map((brand) => (
										<option key={brand} value={brand}>
											{brand}
										</option>
									))}
								</Form.Select>
							</Form.Group>
						</Col>

						{/* Location Filter */}
						<Col md={isPartner ? 3 : 4} className="mb-3">
							<Form.Group>
								<Form.Label>Location</Form.Label>
								<ButtonGroup className="d-block">
									<Button
										variant={
											locationFilter === "all" ? "primary" : "outline-primary"
										}
										onClick={() => setLocationFilter("all")}
									>
										All
									</Button>
									<Button
										variant={
											locationFilter === "floor" ? "primary" : "outline-primary"
										}
										onClick={() => setLocationFilter("floor")}
									>
										Floor
									</Button>
									<Button
										variant={
											locationFilter === "back" ? "primary" : "outline-primary"
										}
										onClick={() => setLocationFilter("back")}
									>
										Back
									</Button>
								</ButtonGroup>
							</Form.Group>
						</Col>
					</Row>
					<Row>
						{/* Search */}
						<Col md={12} className="mb-3">
							<Form.Group>
								<Form.Label>Search</Form.Label>
								<Form.Control
									type="text"
									placeholder="Search by product, SKU, store..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</Form.Group>
						</Col>
					</Row>
				</Card.Body>
			</Card>

			{/* Inventory Table */}
			<Card>
				<Card.Body>
					<div className="d-flex justify-content-between align-items-center mb-3">
						<h5 className="mb-0">
							Inventory Items ({filteredInventory.length})
						</h5>
						{(selectedStore && selectedStore !== "all") ||
						hasStoreAssignment ? (
							<Button
								variant="primary"
								onClick={handleOpenCreateModal}
								disabled={
									storeCapacity.max > 0 &&
									storeCapacity.current >= storeCapacity.max
								}
							>
								+ Add Inventory
							</Button>
						) : null}
					</div>

					{filteredInventory.length === 0 ? (
						<Alert variant="info">
							No inventory items found.{" "}
							{searchTerm && "Try adjusting your search criteria."}
						</Alert>
					) : (
						<div className="table-responsive">
							<Table
								hover
								style={{ borderCollapse: "separate", borderSpacing: "0 4px" }}
							>
								<thead>
									<tr>
										{isPartner && selectedStore === "all" && (
											<th style={{ borderBottom: "2px solid #dee2e6" }}>
												Store
											</th>
										)}
										<th style={{ borderBottom: "2px solid #dee2e6" }}>
											Product
										</th>
										<th style={{ borderBottom: "2px solid #dee2e6" }}>SKU</th>
										<th style={{ borderBottom: "2px solid #dee2e6" }}>Type</th>
										<th style={{ borderBottom: "2px solid #dee2e6" }}>
											Location
										</th>
										<th style={{ borderBottom: "2px solid #dee2e6" }}>
											Quantity
										</th>
										<th style={{ borderBottom: "2px solid #dee2e6" }}>
											Min Stock
										</th>
										<th style={{ borderBottom: "2px solid #dee2e6" }}>
											Status
										</th>
										<th style={{ borderBottom: "2px solid #dee2e6" }}>
											Actions
										</th>
									</tr>
								</thead>
								<tbody>
									{filteredInventory.map((item) => {
										const isContainer = item.cardContainer !== null;
										const isLowStock =
											!isContainer &&
											item.quantity < item.minStockLevel &&
											item.minStockLevel > 0;

										// For containers, return container row + nested card rows
										if (isContainer) {
											const cards = item.cardContainer?.cardInventory || [];
											const containerColors = {
												border: "#8b5cf6",
												bg: "#f3e8ff",
												nested: "#faf5ff",
											};

											return (
												<>
													{/* Container Header Row */}
													<tr
														key={item._id}
														style={{
															borderLeft: `4px solid ${containerColors.border}`,
														}}
													>
														{isPartner && selectedStore === "all" && (
															<td
																style={{
																	verticalAlign: "middle",
																	padding: "1rem 0.75rem",
																	backgroundColor: containerColors.bg,
																	fontWeight: "500",
																}}
															>
																{item.storeId?.name || "N/A"}
															</td>
														)}
														<td
															style={{
																verticalAlign: "middle",
																padding: "1rem 0.75rem",
																backgroundColor: containerColors.bg,
															}}
														>
															<div
																style={{
																	fontSize: "1.5rem",
																	display: "inline-block",
																	marginRight: "0.5rem",
																}}
															>
																📦
															</div>
															<strong
																style={{
																	fontSize: "1.05rem",
																	color: containerColors.border,
																}}
															>
																{item.cardContainer.containerName}
															</strong>
															<br />
															<small
																className="text-muted"
																style={{ fontSize: "0.85rem" }}
															>
																{item.cardContainer.containerType
																	.replace("-", " ")
																	.replace(/\b\w/g, (l) =>
																		l.toUpperCase()
																	)}{" "}
																• {item.totalCards} cards •{" "}
																{item.uniqueCardTypes} types
															</small>
														</td>
														<td
															style={{
																verticalAlign: "middle",
																padding: "1rem 0.75rem",
																backgroundColor: containerColors.bg,
															}}
														>
															<Badge
																bg="secondary"
																style={{
																	fontSize: "0.85rem",
																	padding: "0.4rem 0.8rem",
																}}
															>
																Container
															</Badge>
														</td>
														<td
															style={{
																verticalAlign: "middle",
																padding: "1rem 0.75rem",
																backgroundColor: containerColors.bg,
																fontWeight: "500",
															}}
														>
															Card Container
														</td>
														<td
															style={{
																verticalAlign: "middle",
																padding: "1rem 0.75rem",
																backgroundColor: containerColors.bg,
															}}
														>
															<Badge
																bg={
																	item.location === "floor"
																		? "success"
																		: "warning"
																}
																style={{
																	fontSize: "0.85rem",
																	padding: "0.4rem 0.8rem",
																}}
															>
																{item.location === "floor" ? "Floor" : "Back"}
															</Badge>
														</td>
														<td
															colSpan="2"
															style={{
																verticalAlign: "middle",
																padding: "1rem 0.75rem",
																backgroundColor: containerColors.bg,
																color: "#6c757d",
															}}
														>
															<small>Contains {cards.length} card types</small>
														</td>
														<td
															style={{
																verticalAlign: "middle",
																padding: "1rem 0.75rem",
																backgroundColor: containerColors.bg,
															}}
														>
															{item.isActive ? (
																<Badge bg="success">Active</Badge>
															) : (
																<Badge bg="secondary">Inactive</Badge>
															)}
														</td>
														<td
															style={{
																verticalAlign: "middle",
																padding: "1rem 0.75rem",
																backgroundColor: containerColors.bg,
															}}
														>
															<ButtonGroup size="sm">
																<Button
																	variant="outline-primary"
																	onClick={() => handleOpenUpdateModal(item)}
																	style={{ fontWeight: "500" }}
																>
																	Edit
																</Button>
																<Button
																	variant="outline-danger"
																	onClick={() => handleOpenDeleteModal(item)}
																	style={{ fontWeight: "500" }}
																>
																	Delete
																</Button>
															</ButtonGroup>
														</td>
													</tr>
													{/* Nested Card Rows */}
													{cards.map((card, idx) => (
														<tr
															key={`${item._id}-card-${idx}`}
															style={{
																borderLeft: `4px solid ${containerColors.border}`,
															}}
														>
															{isPartner && selectedStore === "all" && (
																<td
																	style={{
																		padding: "0.5rem 0.75rem",
																		backgroundColor: containerColors.nested,
																	}}
																></td>
															)}
															<td
																style={{
																	paddingLeft: "3rem",
																	padding: "0.5rem 0.75rem 0.5rem 3rem",
																	backgroundColor: containerColors.nested,
																}}
															>
																<small
																	style={{
																		fontSize: "0.9rem",
																		color: "#495057",
																	}}
																>
																	<span
																		style={{
																			color: containerColors.border,
																			marginRight: "0.25rem",
																		}}
																	>
																		↳
																	</span>{" "}
																	{card.productId?.name || "Unknown Card"}
																</small>
															</td>
															<td
																style={{
																	padding: "0.5rem 0.75rem",
																	backgroundColor: containerColors.nested,
																}}
															>
																<small style={{ fontSize: "0.85rem" }}>
																	<code>{card.productId?.sku || "N/A"}</code>
																</small>
															</td>
															<td
																style={{
																	padding: "0.5rem 0.75rem",
																	backgroundColor: containerColors.nested,
																}}
															>
																<small
																	style={{
																		fontSize: "0.85rem",
																		color: "#6c757d",
																	}}
																>
																	Single Card
																</small>
															</td>
															<td
																style={{
																	padding: "0.5rem 0.75rem",
																	backgroundColor: containerColors.nested,
																}}
															></td>
															<td
																style={{
																	padding: "0.5rem 0.75rem",
																	backgroundColor: containerColors.nested,
																}}
															>
																<Badge
																	bg="info"
																	pill
																	style={{ fontSize: "0.85rem" }}
																>
																	{card.quantity}
																</Badge>
															</td>
															<td
																style={{
																	padding: "0.5rem 0.75rem",
																	backgroundColor: containerColors.nested,
																}}
															></td>
															<td
																style={{
																	padding: "0.5rem 0.75rem",
																	backgroundColor: containerColors.nested,
																}}
															></td>
															<td
																style={{
																	padding: "0.5rem 0.75rem",
																	backgroundColor: containerColors.nested,
																}}
															></td>
														</tr>
													))}
												</>
											);
										}

										// Regular product row
										const locationColors = {
											floor: { border: "#198754", bg: "#d1e7dd" },
											back: { border: "#ffc107", bg: "#fff8e1" },
										};
										const colors =
											locationColors[item.location] || locationColors.floor;

										return (
											<tr
												key={item._id}
												style={{ borderLeft: `4px solid ${colors.border}` }}
											>
												{isPartner && selectedStore === "all" && (
													<td
														style={{
															verticalAlign: "middle",
															padding: "1rem 0.75rem",
															backgroundColor: colors.bg,
															fontWeight: "500",
														}}
													>
														{item.storeId?.name || "N/A"}
													</td>
												)}
												<td
													style={{
														verticalAlign: "middle",
														padding: "1rem 0.75rem",
														backgroundColor: colors.bg,
													}}
												>
													<div
														style={{ fontSize: "1.05rem", fontWeight: "600" }}
													>
														{item.productId?.name || "N/A"}
													</div>
													<small
														className="text-muted"
														style={{ fontSize: "0.85rem" }}
													>
														{item.productId?.brand || "N/A"}
													</small>
												</td>
												<td
													style={{
														verticalAlign: "middle",
														padding: "1rem 0.75rem",
														backgroundColor: colors.bg,
													}}
												>
													<code style={{ fontSize: "0.9rem" }}>
														{item.productId?.sku || "N/A"}
													</code>
												</td>
												<td
													style={{
														verticalAlign: "middle",
														padding: "1rem 0.75rem",
														backgroundColor: colors.bg,
														fontSize: "0.9rem",
													}}
												>
													{item.productId?.productType || "N/A"}
												</td>
												<td
													style={{
														verticalAlign: "middle",
														padding: "1rem 0.75rem",
														backgroundColor: colors.bg,
													}}
												>
													<Badge
														bg={
															item.location === "floor" ? "success" : "warning"
														}
														style={{
															fontSize: "0.85rem",
															padding: "0.4rem 0.8rem",
														}}
													>
														{item.location === "floor" ? "Floor" : "Back"}
													</Badge>
												</td>
												<td
													style={{
														verticalAlign: "middle",
														padding: "1rem 0.75rem",
														backgroundColor: colors.bg,
													}}
												>
													<span
														style={{
															fontSize: "1.1rem",
															fontWeight: "600",
															color: isLowStock ? "#dc3545" : "#212529",
														}}
													>
														{item.quantity}
													</span>
													{isLowStock && (
														<Badge bg="danger" className="ms-2">
															Low Stock
														</Badge>
													)}
												</td>
												<td
													style={{
														verticalAlign: "middle",
														padding: "1rem 0.75rem",
														backgroundColor: colors.bg,
														fontSize: "0.95rem",
														color: "#6c757d",
													}}
												>
													{item.minStockLevel}
												</td>
												<td
													style={{
														verticalAlign: "middle",
														padding: "1rem 0.75rem",
														backgroundColor: colors.bg,
													}}
												>
													{item.isActive ? (
														<Badge bg="success">Active</Badge>
													) : (
														<Badge bg="secondary">Inactive</Badge>
													)}
												</td>
												<td
													style={{
														verticalAlign: "middle",
														padding: "1rem 0.75rem",
														backgroundColor: colors.bg,
													}}
												>
													<ButtonGroup size="sm">
														<Button
															variant="outline-primary"
															onClick={() => handleOpenUpdateModal(item)}
															style={{ fontWeight: "500" }}
														>
															Edit
														</Button>
														<Button
															variant="outline-danger"
															onClick={() => handleOpenDeleteModal(item)}
															style={{ fontWeight: "500" }}
														>
															Delete
														</Button>
													</ButtonGroup>
												</td>
											</tr>
										);
									})}
								</tbody>
							</Table>
						</div>
					)}
				</Card.Body>
			</Card>

			{/* Create Inventory Modal */}
			<CreateInventoryModal
				show={showCreateModal}
				onHide={() => setShowCreateModal(false)}
				products={products}
				productSearch={productSearch}
				setProductSearch={setProductSearch}
				selectedProduct={selectedProduct}
				setSelectedProduct={setSelectedProduct}
				newInventory={newInventory}
				setNewInventory={setNewInventory}
				storeCapacity={storeCapacity}
				onSubmit={handleCreateInventory}
				onCheckDuplicate={handleCheckDuplicate}
				error={error}
			/>

			{/* Update Inventory Modal */}
			<UpdateInventoryModal
				show={showUpdateModal}
				onHide={() => setShowUpdateModal(false)}
				selectedItem={selectedItem}
				updateForm={updateForm}
				setUpdateForm={setUpdateForm}
				onSubmit={handleUpdateInventory}
				error={error}
			/>

			{/* Delete Confirmation Modal */}
			<DeleteInventoryModal
				show={showDeleteModal}
				onHide={() => setShowDeleteModal(false)}
				selectedItem={selectedItem}
				onConfirm={handleDeleteInventory}
				error={error}
			/>
		</Container>
	);
}

export default InventoryManagement;
