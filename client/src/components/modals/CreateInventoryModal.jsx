/**
 * CreateInventoryModal Component
 * Modal for adding new inventory to a store
 */

import { Modal, Form, Button, Alert, Badge, Row, Col } from "react-bootstrap";

function CreateInventoryModal({
	show,
	onHide,
	products,
	productSearch,
	setProductSearch,
	selectedProduct,
	setSelectedProduct,
	newInventory,
	setNewInventory,
	storeCapacity,
	onSubmit,
	error,
}) {
	const filteredProducts = products.filter((product) => {
		if (!productSearch) return true;
		const search = productSearch.toLowerCase();
		return (
			product.name?.toLowerCase().includes(search) ||
			product.sku?.toLowerCase().includes(search) ||
			product.brand?.toLowerCase().includes(search)
		);
	});

	return (
		<Modal show={show} onHide={onHide} size="lg">
			<Modal.Header closeButton>
				<Modal.Title>Add Inventory</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				{error && (
					<Alert variant="danger" className="mb-3">
						{error}
					</Alert>
				)}

				{/* Product Search */}
				<Form.Group className="mb-3">
					<Form.Label>Search Products</Form.Label>
					<Form.Control
						type="text"
						placeholder="Search by name, SKU, or brand..."
						value={productSearch}
						onChange={(e) => setProductSearch(e.target.value)}
					/>
				</Form.Group>

				{/* Product Selection */}
				<Form.Group className="mb-3">
					<Form.Label>Select Product</Form.Label>
					<div
						style={{
							maxHeight: "200px",
							overflowY: "auto",
							border: "1px solid #dee2e6",
							borderRadius: "4px",
						}}
					>
						{filteredProducts.length === 0 ? (
							<div className="p-3 text-muted text-center">
								No products found
							</div>
						) : (
							<div className="list-group list-group-flush">
								{filteredProducts.map((product) => (
									<button
										key={product._id}
										type="button"
										className={`list-group-item list-group-item-action ${
											selectedProduct?._id === product._id ? "active" : ""
										}`}
										onClick={() => setSelectedProduct(product)}
									>
										<div className="d-flex justify-content-between">
											<div>
												<strong>{product.name}</strong>
												<br />
												<small>
													{product.brand} • {product.sku}
												</small>
											</div>
											<div className="text-end">
												<Badge bg="secondary">
													Unit Size: {product.unitSize}
												</Badge>
											</div>
										</div>
									</button>
								))}
							</div>
						)}
					</div>
				</Form.Group>

				{selectedProduct && (
					<>
						<Alert variant="info">
							<strong>Selected:</strong> {selectedProduct.name} (Unit Size:{" "}
							{selectedProduct.unitSize})
							<br />
							<strong>Available Capacity:</strong>{" "}
							{storeCapacity.max - storeCapacity.current} units
						</Alert>

						<Row>
							<Col md={6}>
								<Form.Group className="mb-3">
									<Form.Label>Quantity *</Form.Label>
									<Form.Control
										type="number"
										min="0"
										value={newInventory.quantity}
										onChange={(e) =>
											setNewInventory({
												...newInventory,
												quantity: e.target.value,
											})
										}
									/>
									<Form.Text className="text-muted">
										Will use {selectedProduct.unitSize * newInventory.quantity}{" "}
										capacity units
									</Form.Text>
								</Form.Group>
							</Col>
							<Col md={6}>
								<Form.Group className="mb-3">
									<Form.Label>Location *</Form.Label>
									<Form.Select
										value={newInventory.location}
										onChange={(e) =>
											setNewInventory({
												...newInventory,
												location: e.target.value,
											})
										}
									>
										<option value="floor">Floor</option>
										<option value="back">Back</option>
									</Form.Select>
								</Form.Group>
							</Col>
						</Row>

						<Form.Group className="mb-3">
							<Form.Label>Minimum Stock Level</Form.Label>
							<Form.Control
								type="number"
								min="0"
								value={newInventory.minStockLevel}
								onChange={(e) =>
									setNewInventory({
										...newInventory,
										minStockLevel: e.target.value,
									})
								}
							/>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label>Notes</Form.Label>
							<Form.Control
								as="textarea"
								rows={2}
								value={newInventory.notes}
								onChange={(e) =>
									setNewInventory({ ...newInventory, notes: e.target.value })
								}
								placeholder="Optional notes..."
							/>
						</Form.Group>
					</>
				)}
			</Modal.Body>
			<Modal.Footer>
				<Button variant="secondary" onClick={onHide}>
					Cancel
				</Button>
				<Button
					variant="primary"
					onClick={onSubmit}
					disabled={!selectedProduct || Number(newInventory.quantity) <= 0}
				>
					Add Inventory
				</Button>
			</Modal.Footer>
		</Modal>
	);
}

export default CreateInventoryModal;
