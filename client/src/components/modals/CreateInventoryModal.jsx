/**
 * CreateInventoryModal Component
 * Modal for adding new inventory to a store
 */

import { useState } from "react";
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
	onCheckDuplicate,
	error,
}) {
	const [duplicateWarning, setDuplicateWarning] = useState(null);
	const [confirmDifferentLocation, setConfirmDifferentLocation] =
		useState(false);
	const [checking, setChecking] = useState(false);

	const handleProductSelect = async (product) => {
		setSelectedProduct(product);
		setDuplicateWarning(null);
		setConfirmDifferentLocation(false);

		// Check for duplicates when product is selected
		if (onCheckDuplicate && newInventory.location) {
			await checkDuplicates(product._id, newInventory.location);
		}
	};

	const handleLocationChange = async (location) => {
		setNewInventory({
			...newInventory,
			location,
		});
		setDuplicateWarning(null);
		setConfirmDifferentLocation(false);

		// Check for duplicates when location changes
		if (selectedProduct && onCheckDuplicate) {
			await checkDuplicates(selectedProduct._id, location);
		}
	};

	const checkDuplicates = async (productId, location) => {
		if (!onCheckDuplicate) return;

		setChecking(true);
		try {
			const result = await onCheckDuplicate(productId, location);

			if (result.exactMatch) {
				setDuplicateWarning({
					type: "exact",
					message: `This product already exists in ${result.exactMatch.location} with quantity ${result.exactMatch.quantity}. Adding more will update that record.`,
				});
			} else if (result.differentLocation) {
				setDuplicateWarning({
					type: "different",
					message: `This product already exists in ${result.differentLocation.location} (quantity: ${result.differentLocation.quantity}). You are about to add it to a different location.`,
				});
			}
		} catch (err) {
			console.error("Error checking duplicates:", err);
		} finally {
			setChecking(false);
		}
	};

	const handleSubmit = () => {
		if (duplicateWarning?.type === "different" && !confirmDifferentLocation) {
			return;
		}
		onSubmit();
	};

	const handleClose = () => {
		setDuplicateWarning(null);
		setConfirmDifferentLocation(false);
		onHide();
	};

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
		<Modal show={show} onHide={handleClose} size="lg">
			<Modal.Header closeButton>
				<Modal.Title>Add Inventory</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				{error && (
					<Alert variant="danger" className="mb-3">
						{error}
					</Alert>
				)}

				{duplicateWarning && (
					<Alert
						variant={duplicateWarning.type === "exact" ? "info" : "warning"}
						className="mb-3"
					>
						<Alert.Heading>
							{duplicateWarning.type === "exact"
								? "Duplicate Detected"
								: "Warning: Different Location"}
						</Alert.Heading>
						<p className="mb-0">{duplicateWarning.message}</p>
						{duplicateWarning.type === "different" && (
							<Form.Check
								type="checkbox"
								className="mt-2"
								label="I confirm I want to add this product to a different location"
								checked={confirmDifferentLocation}
								onChange={(e) => setConfirmDifferentLocation(e.target.checked)}
							/>
						)}
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
										onClick={() => handleProductSelect(product)}
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
										totals {selectedProduct.unitSize * newInventory.quantity}{" "}
										capacity units
										{duplicateWarning?.type === "exact" &&
											" (will be added to existing stock)"}
									</Form.Text>
								</Form.Group>
							</Col>
							<Col md={6}>
								<Form.Group className="mb-3">
									<Form.Label>Location *</Form.Label>
									<Form.Select
										value={newInventory.location}
										onChange={(e) => handleLocationChange(e.target.value)}
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
				<Button variant="secondary" onClick={handleClose}>
					Cancel
				</Button>
				<Button
					variant="primary"
					onClick={handleSubmit}
					disabled={
						!selectedProduct ||
						Number(newInventory.quantity) <= 0 ||
						(duplicateWarning?.type === "different" &&
							!confirmDifferentLocation) ||
						checking
					}
				>
					{duplicateWarning?.type === "exact"
						? "Update Quantity"
						: "Add Inventory"}
				</Button>
			</Modal.Footer>
		</Modal>
	);
}

export default CreateInventoryModal;
