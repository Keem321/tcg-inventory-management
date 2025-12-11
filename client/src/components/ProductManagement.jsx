import React, { useState, useEffect, useCallback } from "react";
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
	Collapse,
} from "react-bootstrap";
import { productAPI } from "../api/products";
import CreateProductModal from "./modals/CreateProductModal";
import { PRODUCT_TYPES, PRODUCT_TYPE_LABELS } from "../constants/enums";
import { useDebounce } from "../hooks";

// Product type theming with icons and colors
const PRODUCT_TYPE_THEME = {
	[PRODUCT_TYPES.SINGLE_CARD]: { icon: "🃏", color: "#10b981", bg: "#d1fae5" },
	[PRODUCT_TYPES.BOOSTER_PACK]: { icon: "🎴", color: "#3b82f6", bg: "#dbeafe" },
	[PRODUCT_TYPES.COLLECTOR_BOOSTER]: {
		icon: "⭐",
		color: "#8b5cf6",
		bg: "#f3e8ff",
	},
	[PRODUCT_TYPES.DECK]: { icon: "💼", color: "#f59e0b", bg: "#fef3c7" },
	[PRODUCT_TYPES.DECK_BOX]: { icon: "📦", color: "#ef4444", bg: "#fee2e2" },
	[PRODUCT_TYPES.DICE]: { icon: "🎲", color: "#06b6d4", bg: "#cffafe" },
	[PRODUCT_TYPES.SLEEVES]: { icon: "🛡️", color: "#6366f1", bg: "#e0e7ff" },
	[PRODUCT_TYPES.PLAYMAT]: { icon: "🎨", color: "#ec4899", bg: "#fce7f3" },
	[PRODUCT_TYPES.BINDER]: { icon: "📚", color: "#14b8a6", bg: "#ccfbf1" },
	[PRODUCT_TYPES.OTHER]: { icon: "📋", color: "#6b7280", bg: "#f3f4f6" },
};

/**
 * Product Management Component (Partner Only!)
 * Displays all products with expandable details showing inventory across stores
 */
// eslint-disable-next-line no-unused-vars
function ProductManagement({ user }) {
	const [products, setProducts] = useState([]);
	const [brands, setBrands] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [expandedProducts, setExpandedProducts] = useState(new Set());
	const [productDetails, setProductDetails] = useState({});
	const [loadingDetails, setLoadingDetails] = useState(new Set());

	// Modal state
	const [showCreateModal, setShowCreateModal] = useState(false);

	// Sorting state
	const [sortColumn, setSortColumn] = useState("productType");
	const [sortDirection, setSortDirection] = useState("asc");

	// Filters
	const [productTypeFilter, setProductTypeFilter] = useState("");
	const [brandFilter, setBrandFilter] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const debouncedSearchTerm = useDebounce(searchTerm, 300, 2);
	const [activeFilter, setActiveFilter] = useState("active"); // "active", "inactive", "all"

	// Product types for filter
	const productTypes = Object.values(PRODUCT_TYPES);

	// Load products
	const loadProducts = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const options = {};
			if (productTypeFilter) options.productType = productTypeFilter;
			if (brandFilter) options.brand = brandFilter;
			if (debouncedSearchTerm) options.search = debouncedSearchTerm;
			if (activeFilter === "active") options.isActive = true;
			else if (activeFilter === "inactive") options.isActive = false;
			// if "all", don't set isActive filter

			const response = await productAPI.getProducts(options);
			setProducts(response.products);
		} catch (err) {
			setError(err.response?.data?.message || err.message);
		} finally {
			setLoading(false);
		}
	}, [productTypeFilter, brandFilter, debouncedSearchTerm, activeFilter]);

	useEffect(() => {
		loadProducts();
	}, [loadProducts]);

	// Load all brands on mount
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

	// Toggle product expansion and load details
	const toggleProductExpansion = async (productId) => {
		const newExpanded = new Set(expandedProducts);

		if (expandedProducts.has(productId)) {
			// Collapse
			newExpanded.delete(productId);
			setExpandedProducts(newExpanded);
		} else {
			// Expand and load details if not already loaded
			newExpanded.add(productId);
			setExpandedProducts(newExpanded);

			if (!productDetails[productId]) {
				// Load product details
				const newLoadingDetails = new Set(loadingDetails);
				newLoadingDetails.add(productId);
				setLoadingDetails(newLoadingDetails);

				try {
					const response = await productAPI.getProduct(productId);
					setProductDetails((prev) => ({
						...prev,
						[productId]: response,
					}));
				} catch (err) {
					setError(err.response?.data?.message || err.message);
				} finally {
					const updatedLoadingDetails = new Set(loadingDetails);
					updatedLoadingDetails.delete(productId);
					setLoadingDetails(updatedLoadingDetails);
				}
			}
		}
	};

	// Format product type for display
	const formatProductType = (type) => {
		return PRODUCT_TYPE_LABELS[type] || type;
	};

	// Sort products
	const sortedProducts = [...products].sort((a, b) => {
		let aVal, bVal;

		switch (sortColumn) {
			case "name":
				aVal = a.name.toLowerCase();
				bVal = b.name.toLowerCase();
				break;
			case "sku":
				aVal = a.sku.toLowerCase();
				bVal = b.sku.toLowerCase();
				break;
			case "productType":
				aVal = a.productType.toLowerCase();
				bVal = b.productType.toLowerCase();
				break;
			case "brand":
				aVal = a.brand.toLowerCase();
				bVal = b.brand.toLowerCase();
				break;
			case "basePrice":
				aVal = a.basePrice;
				bVal = b.basePrice;
				break;
			default:
				return 0;
		}

		if (sortDirection === "asc") {
			return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
		} else {
			return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
		}
	});

	// Handle column sort
	const handleSort = (column) => {
		if (sortColumn === column) {
			// Toggle direction
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			// New column, default to ascending
			setSortColumn(column);
			setSortDirection("asc");
		}
	};

	// Get theme for product type
	const getProductTheme = (type) => {
		return (
			PRODUCT_TYPE_THEME[type] || {
				icon: "📋",
				color: "#6b7280",
				bg: "#f3f4f6",
			}
		);
	};

	// Handle delete product (soft delete - deactivate)
	const handleDelete = async (productId) => {
		if (
			!window.confirm(
				"Are you sure you want to deactivate this product? It will no longer be available for new inventory."
			)
		) {
			return;
		}

		try {
			await productAPI.deleteProduct(productId);
			loadProducts();
		} catch (err) {
			setError(err.response?.data?.message || err.message);
		}
	};

	// Handle activate product (reactivate)
	const handleActivate = async (productId) => {
		if (
			!window.confirm(
				"Are you sure you want to reactivate this product? It will be available for new inventory again."
			)
		) {
			return;
		}

		try {
			await productAPI.updateProduct(productId, { isActive: true });
			loadProducts();
		} catch (err) {
			setError(err.response?.data?.message || err.message);
		}
	};

	// Handle create product
	const handleCreateProduct = async (productData) => {
		await productAPI.createProduct(productData);
		loadProducts();
		setShowCreateModal(false);
	};

	return (
		<Container className="py-4">
			<Row className="mb-4">
				<Col>
					<h2>Product Management</h2>
					<p className="text-muted">
						Manage product catalog and view inventory across all stores
					</p>
				</Col>
				<Col xs="auto">
					<Button variant="primary" onClick={() => setShowCreateModal(true)}>
						Add New Product
					</Button>
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
						<Col md={3}>
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
						<Col md={3}>
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
						<Col md={4}>
							<Form.Group>
								<Form.Label>Search</Form.Label>
								<Form.Control
									type="text"
									placeholder="Search products..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</Form.Group>
						</Col>
						<Col md={2}>
							<Form.Group>
								<Form.Label>Status</Form.Label>
								<Form.Select
									value={activeFilter}
									onChange={(e) => setActiveFilter(e.target.value)}
								>
									<option value="active">Show Active</option>
									<option value="inactive">Show Inactive</option>
									<option value="all">Show All</option>
								</Form.Select>
							</Form.Group>
						</Col>
					</Row>
				</Card.Body>
			</Card>

			{/* Products Table */}
			<Card>
				<Card.Body>
					{loading ? (
						<div className="text-center py-5">
							<Spinner animation="border" role="status">
								<span className="visually-hidden">Loading...</span>
							</Spinner>
							<p className="text-muted mt-2">Loading products...</p>
						</div>
					) : (
						<Table
							responsive
							hover
							style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
						>
							<thead>
								<tr>
									<th
										style={{
											width: "40px",
											cursor: "default",
											borderBottom: "2px solid #dee2e6",
										}}
									></th>
									<th
										style={{
											cursor: "pointer",
											borderBottom: "2px solid #dee2e6",
										}}
										onClick={() => handleSort("productType")}
									>
										Type{" "}
										{sortColumn === "productType" &&
											(sortDirection === "asc" ? "↑" : "↓")}
									</th>
									<th
										style={{
											cursor: "pointer",
											borderBottom: "2px solid #dee2e6",
										}}
										onClick={() => handleSort("name")}
									>
										Product Details{" "}
										{sortColumn === "name" &&
											(sortDirection === "asc" ? "↑" : "↓")}
									</th>
									<th
										style={{
											cursor: "pointer",
											borderBottom: "2px solid #dee2e6",
										}}
										onClick={() => handleSort("brand")}
									>
										Brand{" "}
										{sortColumn === "brand" &&
											(sortDirection === "asc" ? "↑" : "↓")}
									</th>
									<th
										style={{
											cursor: "pointer",
											borderBottom: "2px solid #dee2e6",
										}}
										onClick={() => handleSort("basePrice")}
									>
										Price{" "}
										{sortColumn === "basePrice" &&
											(sortDirection === "asc" ? "↑" : "↓")}
									</th>
									<th style={{ borderBottom: "2px solid #dee2e6" }}>Status</th>
									<th style={{ borderBottom: "2px solid #dee2e6" }}>Actions</th>
								</tr>
							</thead>
							<tbody>
								{sortedProducts.length === 0 ? (
									<tr>
										<td
											colSpan="7"
											className="text-center text-muted"
											style={{ padding: "2rem" }}
										>
											No products found
										</td>
									</tr>
								) : (
									sortedProducts.map((product) => {
										const theme = getProductTheme(product.productType);
										return (
											<React.Fragment key={product._id}>
												{/* Main Product Row */}
												<tr
													style={{
														borderLeft: `4px solid ${theme.color}`,
													}}
												>
													<td
														style={{
															verticalAlign: "middle",
															padding: "1rem 0.5rem",
															backgroundColor: theme.bg,
														}}
													>
														<Button
															variant="link"
															size=""
															style={{
																textDecoration: "none",
																padding: "0.25rem",
															}}
															onClick={() =>
																toggleProductExpansion(product._id)
															}
														>
															{expandedProducts.has(product._id) ? "▼" : "⯈"}
														</Button>
													</td>
													<td
														style={{
															verticalAlign: "middle",
															padding: "1rem 0.75rem",
															backgroundColor: theme.bg,
														}}
													>
														<div className="d-flex align-items-center gap-2">
															<span style={{ fontSize: "1.5rem" }}>
																{theme.icon}
															</span>
															<div>
																<div
																	style={{
																		fontWeight: "600",
																		color: theme.color,
																	}}
																>
																	{formatProductType(product.productType)}
																</div>
															</div>
														</div>
													</td>
													<td
														style={{
															verticalAlign: "middle",
															padding: "1rem 0.75rem",
															backgroundColor: theme.bg,
														}}
													>
														<div>
															<div
																style={{
																	fontWeight: "600",
																	fontSize: "1.05rem",
																	marginBottom: "0.25rem",
																}}
															>
																{product.name}
															</div>
															<code className="bg-white px-2 py-1 rounded small">
																{product.sku}
															</code>
															{product.cardDetails && (
																<div className="small text-muted mt-1">
																	{product.cardDetails.set} • #
																	{product.cardDetails.cardNumber} •{" "}
																	{product.cardDetails.rarity}
																	{product.cardDetails.condition &&
																		` • ${product.cardDetails.condition}`}
																</div>
															)}
															{product.description && (
																<div className="small text-muted mt-1">
																	{product.description}
																</div>
															)}
															{product.unitSize > 0 && (
																<div className="small text-muted mt-1">
																	Unit Size: {product.unitSize}
																	{product.bulkQuantity &&
																		` • Bulk Qty: ${product.bulkQuantity}`}
																</div>
															)}
														</div>
													</td>
													<td
														style={{
															verticalAlign: "middle",
															padding: "1rem 0.75rem",
															backgroundColor: theme.bg,
														}}
													>
														<div style={{ fontWeight: "500" }}>
															{product.brand}
														</div>
													</td>
													<td
														style={{
															verticalAlign: "middle",
															padding: "1rem 0.75rem",
															backgroundColor: theme.bg,
														}}
													>
														<div
															style={{
																fontSize: "1.25rem",
																fontWeight: "600",
																color: "#0d6efd",
															}}
														>
															${product.basePrice.toFixed(2)}
														</div>
													</td>
													<td
														style={{
															verticalAlign: "middle",
															padding: "1rem 0.75rem",
															backgroundColor: theme.bg,
														}}
													>
														{product.isActive ? (
															<Badge bg="success">Active</Badge>
														) : (
															<Badge bg="secondary">Inactive</Badge>
														)}
													</td>
													<td
														style={{
															verticalAlign: "middle",
															padding: "1rem 0.75rem",
															backgroundColor: theme.bg,
														}}
													>
														{product.isActive ? (
															<Button
																variant="warning"
																size="sm"
																onClick={() => handleDelete(product._id)}
															>
																Deactivate
															</Button>
														) : (
															<Button
																variant="success"
																size="sm"
																onClick={() => handleActivate(product._id)}
															>
																Activate
															</Button>
														)}
													</td>
												</tr>

												{/* Expanded Inventory Details Row */}
												<tr style={{ backgroundColor: theme.bg }}>
													<td
														colSpan="7"
														style={{
															padding: 0,
															borderLeft: `4px solid ${theme.color}`,
															backgroundColor: theme.bg,
														}}
													>
														<Collapse in={expandedProducts.has(product._id)}>
															<div
																className="p-3"
																style={{
																	borderTop: `1px solid ${theme.color}`,
																}}
															>
																{loadingDetails.has(product._id) ? (
																	<div className="text-center">
																		<Spinner animation="border" size="sm" />
																	</div>
																) : productDetails[product._id] ? (
																	<ProductDetails
																		inventory={
																			productDetails[product._id].inventory
																		}
																	/>
																) : null}
															</div>
														</Collapse>
													</td>
												</tr>
											</React.Fragment>
										);
									})
								)}
							</tbody>
						</Table>
					)}
				</Card.Body>
			</Card>

			{/* Create Product Modal */}
			<CreateProductModal
				show={showCreateModal}
				onHide={() => setShowCreateModal(false)}
				onProductCreated={handleCreateProduct}
			/>
		</Container>
	);
}

/**
 * Product Details Component
 * Shows inventory breakdown across stores
 */
function ProductDetails({ inventory }) {
	return (
		<div>
			<div className="d-flex justify-content-between align-items-center mb-3">
				<h6 className="mb-0">Inventory Across System</h6>
				<Badge bg="primary" pill style={{ fontSize: "0.9rem" }}>
					Total: {inventory.totalQuantity}
				</Badge>
			</div>

			{inventory.stores.length === 0 ? (
				<p className="text-muted">No inventory in any store</p>
			) : (
				<Table size="sm" hover>
					<thead>
						<tr>
							<th>Store</th>
							<th className="text-end">Floor</th>
							<th className="text-end">Back</th>
							<th className="text-end">Total</th>
						</tr>
					</thead>
					<tbody>
						{inventory.stores.map((store) => (
							<tr key={store.storeId}>
								<td>
									<strong>{store.storeName}</strong>
								</td>
								<td className="text-end">{store.floor}</td>
								<td className="text-end">{store.back}</td>
								<td className="text-end">
									<Badge bg="info">{store.total}</Badge>
								</td>
							</tr>
						))}
					</tbody>
				</Table>
			)}
		</div>
	);
}

export default ProductManagement;
