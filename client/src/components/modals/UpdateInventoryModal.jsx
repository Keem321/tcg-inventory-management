/**
 * UpdateInventoryModal Component
 * Modal for updating existing inventory
 */

import { Modal, Form, Button, Alert, Row, Col } from "react-bootstrap";

function UpdateInventoryModal({
	show,
	onHide,
	selectedItem,
	updateForm,
	setUpdateForm,
	onSubmit,
	error,
}) {
	const isContainer = selectedItem?.cardContainer !== null;

	return (
		<Modal show={show} onHide={onHide}>
			<Modal.Header closeButton>
				<Modal.Title>
					{isContainer ? "Update Container" : "Update Inventory"}
				</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				{error && (
					<Alert variant="danger" className="mb-3">
						{error}
					</Alert>
				)}

				{selectedItem && (
					<>
						<Alert variant="info">
							{isContainer ? (
								<>
									<strong>Container:</strong>{" "}
									{selectedItem.cardContainer?.containerName || "N/A"}
									<br />
									<strong>Type:</strong>{" "}
									{selectedItem.cardContainer?.containerType || "N/A"}
									<br />
									<strong>Cards:</strong> {selectedItem.totalCards || 0} cards •{" "}
									{selectedItem.uniqueCardTypes || 0} types
									<br />
									<strong>Current Location:</strong> {selectedItem.location}
								</>
							) : (
								<>
									<strong>Product:</strong>{" "}
									{selectedItem.productId?.name || "N/A"}
									<br />
									<strong>Current Quantity:</strong> {selectedItem.quantity}
									<br />
									<strong>Current Location:</strong> {selectedItem.location}
								</>
							)}
						</Alert>

						<Row>
							{!isContainer && (
								<Col md={6}>
									<Form.Group className="mb-3">
										<Form.Label>Quantity *</Form.Label>
										<Form.Control
											type="number"
											min="0"
											value={updateForm.quantity}
											onChange={(e) =>
												setUpdateForm({
													...updateForm,
													quantity: e.target.value,
												})
											}
										/>
										{selectedItem.productId && (
											<Form.Text className="text-muted">
												Will use{" "}
												{selectedItem.productId.unitSize * updateForm.quantity}{" "}
												capacity units
											</Form.Text>
										)}
									</Form.Group>
								</Col>
							)}
							<Col md={isContainer ? 12 : 6}>
								<Form.Group className="mb-3">
									<Form.Label>Location *</Form.Label>
									<Form.Select
										value={updateForm.location}
										onChange={(e) =>
											setUpdateForm({
												...updateForm,
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

						{!isContainer && (
							<Form.Group className="mb-3">
								<Form.Label>Minimum Stock Level</Form.Label>
								<Form.Control
									type="number"
									min="0"
									value={updateForm.minStockLevel}
									onChange={(e) =>
										setUpdateForm({
											...updateForm,
											minStockLevel: e.target.value,
										})
									}
								/>
							</Form.Group>
						)}

						<Form.Group className="mb-3">
							<Form.Label>Notes</Form.Label>
							<Form.Control
								as="textarea"
								rows={2}
								value={updateForm.notes}
								onChange={(e) =>
									setUpdateForm({ ...updateForm, notes: e.target.value })
								}
								placeholder="Optional notes..."
							/>
						</Form.Group>

						{isContainer && (
							<Alert variant="warning">
								<small>
									<strong>Note:</strong> To add or remove cards from this
									container, please delete and recreate the container, or manage
									individual cards separately.
								</small>
							</Alert>
						)}
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
					disabled={!isContainer && updateForm.quantity < 0}
				>
					{isContainer ? "Update Container" : "Update Inventory"}
				</Button>
			</Modal.Footer>
		</Modal>
	);
}

export default UpdateInventoryModal;
