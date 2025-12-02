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

/**
 * Inventory Management Component
 * Displays and manages inventory across stores with role-based access
 */
function InventoryManagement({ user, onBack }) {
	const [inventory, setInventory] = useState([]);
	const [stores, setStores] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Filters
	const [selectedStore, setSelectedStore] = useState("");
	const [locationFilter, setLocationFilter] = useState("all"); // all, floor, back
	const [searchTerm, setSearchTerm] = useState("");

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

			if (isPartner && selectedStore === "all") {
				// Partner viewing all stores
				response = await inventoryAPI.getAllInventory(options);
			} else if (isPartner && selectedStore) {
				// Partner viewing specific store
				response = await inventoryAPI.getInventoryByStore(
					selectedStore,
					options
				);
			} else if (hasStoreAssignment) {
				// Employee/Manager viewing their assigned store
				response = await inventoryAPI.getInventoryByStore(
					user.assignedStoreId,
					options
				);
			}

			setInventory(response?.inventory || []);
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
			} // Load initial inventory
			await loadInventory();
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [isPartner, hasStoreAssignment, user?.assignedStoreId, loadInventory]);

	useEffect(() => {
		loadStoresAndInventory();
	}, [loadStoresAndInventory]);

	// Reload inventory when filters change
	useEffect(() => {
		if (!loading && (selectedStore || hasStoreAssignment)) {
			loadInventory();
		}
	}, [
		selectedStore,
		locationFilter,
		loading,
		hasStoreAssignment,
		loadInventory,
	]);

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
			{onBack && (
				<Button variant="link" onClick={onBack} className="mb-3 p-0">
					← Back to Dashboard
				</Button>
			)}
			<Row className="mb-4">
				<Col>
					<h2>Inventory Management</h2>
					<p className="text-muted">
						{isPartner
							? "View and manage inventory across all stores"
							: `Managing inventory for ${getStoreName(user.assignedStoreId)}`}
					</p>
				</Col>
			</Row>

			{error && (
				<Alert variant="danger" dismissible onClose={() => setError(null)}>
					{error}
				</Alert>
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
													<Button variant="link" size="sm">
														View
													</Button>
													{/* More actions will be added later */}
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
		</Container>
	);
}

export default InventoryManagement;
