/**
 * DeleteInventoryModal Component
 * Modal for confirming inventory deletion
 */

import { Modal, Button, Alert } from "react-bootstrap";

function DeleteInventoryModal({
	show,
	onHide,
	selectedItem,
	onConfirm,
	error,
}) {
	return (
		<Modal show={show} onHide={onHide}>
			<Modal.Header closeButton>
				<Modal.Title>Confirm Delete</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				{error && (
					<Alert variant="danger" className="mb-3">
						{error}
					</Alert>
				)}

				{selectedItem && (
					<>
						<p>Are you sure you want to remove this inventory item?</p>
						<Alert variant="warning">
							<strong>Product:</strong>{" "}
							{selectedItem.productId?.name ||
								selectedItem.cardContainer?.containerName ||
								"N/A"}
							<br />
							<strong>Quantity:</strong>{" "}
							{selectedItem.quantity || selectedItem.totalCards || "N/A"}
							<br />
							<strong>Location:</strong> {selectedItem.location}
						</Alert>
						<p className="text-muted small">
							This will remove the inventory from the store but will not delete
							the product from the system.
						</p>
					</>
				)}
			</Modal.Body>
			<Modal.Footer>
				<Button variant="secondary" onClick={onHide}>
					Cancel
				</Button>
				<Button variant="danger" onClick={onConfirm}>
					Delete Inventory
				</Button>
			</Modal.Footer>
		</Modal>
	);
}

export default DeleteInventoryModal;
