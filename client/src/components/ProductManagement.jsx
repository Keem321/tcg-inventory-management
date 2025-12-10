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
	Collapse,
} from "react-bootstrap";
import { productAPI } from "../api/products";
import CreateProductModal from "./modals/CreateProductModal";
import { PRODUCT_TYPES, PRODUCT_TYPE_LABELS } from "../constants/enums";
import { useDebounce } from "../hooks";

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
					<p className="text-muted">
						Note: add dataTable like ordering functionality?
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
						<Table responsive hover>
							<thead>
								<tr>
									<th style={{ width: "50px" }}></th>
									<th>SKU</th>
									<th>Name</th>
									<th>Type</th>
									<th>Brand</th>
									<th>Price</th>
									<th>Status</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{products.length === 0 ? (
									<tr>
										<td colSpan="8" className="text-center text-muted">
											No products found
										</td>
									</tr>
								) : (
									products.map((product) => (
										<>
											{/* Main Product Row */}
											<tr key={product._id}>
												<td>
													<Button
														variant="link"
														size="sm"
														onClick={() => toggleProductExpansion(product._id)}
													>
														{expandedProducts.has(product._id) ? "▼" : "▶"}
													</Button>
												</td>
												<td>
													<code>{product.sku}</code>
												</td>
												<td>
													<strong>{product.name}</strong>
													{product.cardDetails && (
														<div className="small text-muted">
															{product.cardDetails.set} #
															{product.cardDetails.cardNumber}
														</div>
													)}
												</td>
												<td>{formatProductType(product.productType)}</td>
												<td>{product.brand}</td>
												<td>${product.basePrice.toFixed(2)}</td>
												<td>
													{product.isActive ? (
														<Badge bg="success">Active</Badge>
													) : (
														<Badge bg="secondary">Inactive</Badge>
													)}
												</td>
												<td>
													<Button
														variant="outline-warning"
														size="sm"
														onClick={() => handleDelete(product._id)}
														disabled={!product.isActive}
													>
														Deactivate
													</Button>
												</td>
											</tr>

											{/* Expanded Details Row */}
											<tr>
												<td colSpan="8" style={{ padding: 0 }}>
													<Collapse in={expandedProducts.has(product._id)}>
														<div className="p-3 bg-light">
															{loadingDetails.has(product._id) ? (
																<div className="text-center">
																	<Spinner animation="border" size="sm" />
																</div>
															) : productDetails[product._id] ? (
																<ProductDetails
																	product={productDetails[product._id].product}
																	inventory={
																		productDetails[product._id].inventory
																	}
																/>
															) : null}
														</div>
													</Collapse>
												</td>
											</tr>
										</>
									))
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
 * Shows detailed information and inventory breakdown
 */
function ProductDetails({ product, inventory }) {
	return (
		<Row>
			<Col md={6}>
				<h5>Product Details</h5>
				<dl className="row">
					<dt className="col-sm-4">SKU:</dt>
					<dd className="col-sm-8">
						<code>{product.sku}</code>
					</dd>

					<dt className="col-sm-4">Type:</dt>
					<dd className="col-sm-8">{product.productType}</dd>

					<dt className="col-sm-4">Brand:</dt>
					<dd className="col-sm-8">{product.brand}</dd>

					<dt className="col-sm-4">Unit Size:</dt>
					<dd className="col-sm-8">
						{product.unitSize === 0 ? "N/A (Card)" : product.unitSize}
					</dd>

					{product.bulkQuantity && (
						<>
							<dt className="col-sm-4">Bulk Qty:</dt>
							<dd className="col-sm-8">{product.bulkQuantity}</dd>
						</>
					)}

					{product.description && (
						<>
							<dt className="col-sm-4">Description:</dt>
							<dd className="col-sm-8">{product.description}</dd>
						</>
					)}

					{product.cardDetails && (
						<>
							<dt className="col-sm-4">Set:</dt>
							<dd className="col-sm-8">{product.cardDetails.set}</dd>

							<dt className="col-sm-4">Card #:</dt>
							<dd className="col-sm-8">{product.cardDetails.cardNumber}</dd>

							<dt className="col-sm-4">Rarity:</dt>
							<dd className="col-sm-8">{product.cardDetails.rarity}</dd>

							<dt className="col-sm-4">Condition:</dt>
							<dd className="col-sm-8">{product.cardDetails.condition}</dd>

							<dt className="col-sm-4">Finish:</dt>
							<dd className="col-sm-8">{product.cardDetails.finish}</dd>
						</>
					)}
				</dl>
			</Col>

			<Col md={6}>
				<h5>Inventory Across System</h5>
				<div className="mb-3">
					<strong>Total Quantity:</strong>{" "}
					<Badge bg="primary" className="ms-2">
						{inventory.totalQuantity}
					</Badge>
				</div>

				{inventory.stores.length === 0 ? (
					<p className="text-muted">No inventory in any store</p>
				) : (
					<Table size="sm" bordered>
						<thead>
							<tr>
								<th>Store</th>
								<th>Floor</th>
								<th>Back</th>
								<th>Total</th>
							</tr>
						</thead>
						<tbody>
							{inventory.stores.map((store) => (
								<tr key={store.storeId}>
									<td>{store.storeName}</td>
									<td>{store.floor}</td>
									<td>{store.back}</td>
									<td>
										<strong>{store.total}</strong>
									</td>
								</tr>
							))}
						</tbody>
					</Table>
				)}
			</Col>
		</Row>
	);
}

export default ProductManagement;
