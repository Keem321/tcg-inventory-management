/**
 * DeleteStoreModal Component
 * Modal for confirming store deletion
 */

import { useState } from "react";
import { Modal, Button, Alert } from "react-bootstrap";

function DeleteStoreModal({ show, onHide, store, onStoreDeleted }) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const handleConfirm = async () => {
		setLoading(true);
		setError(null);

		try {
			await onStoreDeleted(store._id);
			handleClose();
		} catch (err) {
			setError(err.response?.data?.message || err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setError(null);
		onHide();
	};

	return (
		<Modal show={show} onHide={handleClose}>
			<Modal.Header closeButton>
				<Modal.Title>Confirm Deletion</Modal.Title>
			</Modal.Header>

			<Modal.Body>
				{error && (
					<Alert variant="danger" dismissible onClose={() => setError(null)}>
						{error}
					</Alert>
				)}

				<p>
					Are you sure you want to delete <strong>{store?.name}</strong>?
				</p>

				{store && store.currentCapacity > 0 && (
					<Alert variant="warning">
						<strong>Warning:</strong> This store currently has{" "}
						{store.currentCapacity} units of inventory. All inventory records
						associated with this store will also be deleted.
					</Alert>
				)}

				<p className="text-muted mb-0">
					This action cannot be undone. All associated data will be permanently
					removed.
				</p>
			</Modal.Body>

			<Modal.Footer>
				<Button variant="secondary" onClick={handleClose} disabled={loading}>
					Cancel
				</Button>
				<Button variant="danger" onClick={handleConfirm} disabled={loading}>
					{loading ? "Deleting..." : "Confirm Delete"}
				</Button>
			</Modal.Footer>
		</Modal>
	);
}

export default DeleteStoreModal;
