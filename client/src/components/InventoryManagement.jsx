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
	const [searchTerm, setSearchTerm] = useState("");

	// CRUD Modals
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showUpdateModal, setShowUpdateModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [selectedItem, setSelectedItem] = useState(null);

	// Create form
	const [products, setProducts] = useState([]);
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
			} else if (isPartner && selectedStore) {
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
			setError(err.message);
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
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [isPartner, hasStoreAssignment, user?.assignedStoreId]);

	useEffect(() => {
		loadStoresAndInventory();
	}, [loadStoresAndInventory]);

	// Reload inventory when filters change or when selectedStore is first set
	useEffect(() => {
		if (!loading && selectedStore) {
			loadInventory();
		}
	}, [selectedStore, locationFilter, loading, loadInventory]);

	// Filter inventory by search term
	const filteredInventory = inventory.filter((item) => {
		if (!searchTerm) return true;

		const search = searchTerm.toLowerCase();
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
			setError("Failed to load products: " + err.message);
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
			setError("Failed to create inventory: " + err.message);
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

			// Calculate capacity change
			const oldSpace = selectedItem.productId?.unitSize * selectedItem.quantity;
			const newSpace = selectedItem.productId?.unitSize * updateForm.quantity;
			const spaceChange = newSpace - oldSpace;
			const availableSpace = storeCapacity.max - storeCapacity.current;

			if (spaceChange > availableSpace) {
				setError(
					`Not enough capacity. Required additional: ${spaceChange}, Available: ${availableSpace}`
				);
				return;
			}

			await inventoryAPI.updateInventory(selectedItem._id, {
				quantity: parseInt(updateForm.quantity),
				location: updateForm.location,
				minStockLevel: parseInt(updateForm.minStockLevel),
				notes: updateForm.notes || undefined,
			});

			setSuccess("Inventory updated successfully");
			setShowUpdateModal(false);
			setSelectedItem(null);
			await loadInventory();
		} catch (err) {
			setError("Failed to update inventory: " + err.message);
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
			setError("Failed to delete inventory: " + err.message);
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
							<Col md={4} className="mb-3">
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

						{/* Location Filter */}
						<Col md={4} className="mb-3">
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

						{/* Search */}
						<Col md={4} className="mb-3">
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
							<Table striped hover>
								<thead>
									<tr>
										{isPartner && selectedStore === "all" && <th>Store</th>}
										<th>Product</th>
										<th>SKU</th>
										<th>Type</th>
										<th>Location</th>
										<th>Quantity</th>
										<th>Min Stock</th>
										<th>Status</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{filteredInventory.map((item) => {
										const isContainer = item.cardContainer !== null;
										const isLowStock =
											!isContainer &&
											item.quantity < item.minStockLevel &&
											item.minStockLevel > 0;

										return (
											<tr key={item._id}>
												{isPartner && selectedStore === "all" && (
													<td>{item.storeId?.name || "N/A"}</td>
												)}
												<td>
													{isContainer ? (
														<>
															<strong>
																{item.cardContainer.containerName}
															</strong>
															<br />
															<small className="text-muted">
																{item.cardContainer.containerType} •{" "}
																{item.totalCards} cards • {item.uniqueCardTypes}{" "}
																types
															</small>
														</>
													) : (
														<>
															<strong>{item.productId?.name || "N/A"}</strong>
															<br />
															<small className="text-muted">
																{item.productId?.brand || "N/A"}
															</small>
														</>
													)}
												</td>
												<td>
													{isContainer ? (
														<Badge bg="secondary">Container</Badge>
													) : (
														item.productId?.sku || "N/A"
													)}
												</td>
												<td>
													{isContainer
														? "Card Container"
														: item.productId?.productType || "N/A"}
												</td>
												<td>
													<Badge
														bg={
															item.location === "floor" ? "success" : "warning"
														}
													>
														{item.location === "floor" ? "Floor" : "Back"}
													</Badge>
												</td>
												<td>
													{isContainer ? (
														<span className="text-muted">—</span>
													) : (
														<>
															{item.quantity}
															{isLowStock && (
																<Badge bg="danger" className="ms-2">
																	Low
																</Badge>
															)}
														</>
													)}
												</td>
												<td>
													{isContainer ? (
														<span className="text-muted">—</span>
													) : (
														item.minStockLevel
													)}
												</td>
												<td>
													{item.isActive ? (
														<Badge bg="success">Active</Badge>
													) : (
														<Badge bg="secondary">Inactive</Badge>
													)}
												</td>
												<td>
													<ButtonGroup size="sm">
														<Button
															variant="outline-primary"
															onClick={() => handleOpenUpdateModal(item)}
															disabled={isContainer}
														>
															Edit
														</Button>
														<Button
															variant="outline-danger"
															onClick={() => handleOpenDeleteModal(item)}
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
