/**
 * CreateTransferRequestModal Component
 * Modal for creating new transfer requests between stores
 */

import { useState, useEffect } from "react";
import {
	Modal,
	Form,
	Button,
	Alert,
	Badge,
	Row,
	Col,
	Table,
	Spinner,
} from "react-bootstrap";
import { inventoryAPI } from "../../api/inventory";

function CreateTransferRequestModal({
	show,
	onHide,
	stores,
	user,
	onSubmit,
	error,
}) {
	const [fromStoreId, setFromStoreId] = useState("");
	const [toStoreId, setToStoreId] = useState("");
	const [availableInventory, setAvailableInventory] = useState([]);
	const [selectedItems, setSelectedItems] = useState([]);
	const [transferNotes, setTransferNotes] = useState("");
	const [loadingInventory, setLoadingInventory] = useState(false);
	const [localError, setLocalError] = useState(null);

	const isPartner = user?.role === "partner";
	const isManager = user?.role === "store-manager";
	const userStoreId = user?.assignedStoreId;

	// Auto-set destination to manager's store when modal opens
	useEffect(() => {
		if (show && isManager && userStoreId) {
			setToStoreId(userStoreId);
		}
	}, [show, isManager, userStoreId]);

	// Load available inventory when source store is selected
	useEffect(() => {
		if (!fromStoreId) {
			setAvailableInventory([]);
			return;
		}

		const loadInventory = async () => {
			try {
				setLoadingInventory(true);
				setLocalError(null);
				const response = await inventoryAPI.getInventoryByStore(fromStoreId);
				setAvailableInventory(response.inventory || []);
			} catch (err) {
				console.error("Error loading inventory:", err);
				setLocalError(err.response?.data?.message || err.message);
			} finally {
				setLoadingInventory(false);
			}
		};

		loadInventory();
	}, [fromStoreId]);

	const handleAddItem = (inventory) => {
		if (selectedItems.find((item) => item.inventoryId === inventory._id)) {
			setLocalError("Item already added to transfer");
			return;
		}

		const newItem = {
			inventoryId: inventory._id,
			productId: inventory.productId._id,
			requestedQuantity: 1,
			maxQuantity: inventory.quantity,
			productName: inventory.productId.name,
			sku: inventory.productId.sku,
			location: inventory.location,
		};

		setSelectedItems([...selectedItems, newItem]);
		setLocalError(null);
	};

	const handleRemoveItem = (inventoryId) => {
		setSelectedItems(
			selectedItems.filter((item) => item.inventoryId !== inventoryId)
		);
	};

	const handleUpdateQuantity = (inventoryId, quantity) => {
		setSelectedItems(
			selectedItems.map((item) =>
				item.inventoryId === inventoryId
					? { ...item, requestedQuantity: parseInt(quantity) }
					: item
			)
		);
	};

	const handleSubmit = () => {
		setLocalError(null);

		if (!fromStoreId || !toStoreId) {
			setLocalError("Please select both source and destination stores");
			return;
		}

		if (selectedItems.length === 0) {
			setLocalError("Please select at least one item to transfer");
			return;
		}

		const requestData = {
			fromStoreId,
			toStoreId,
			items: selectedItems.map((item) => ({
				inventoryId: item.inventoryId,
				productId: item.productId,
				requestedQuantity: item.requestedQuantity,
			})),
			notes: transferNotes,
		};

		onSubmit(requestData);
	};

	const handleClose = () => {
		setFromStoreId("");
		setToStoreId(isManager ? userStoreId : "");
		setSelectedItems([]);
		setTransferNotes("");
		setAvailableInventory([]);
		setLocalError(null);
		onHide();
	};

	// Get filtered stores for dropdowns
	const getSourceStores = () => {
		return stores.filter((store) => {
			// Partners can select any store
			if (isPartner) return true;
			// Managers can select any store EXCEPT their own
			return store._id !== userStoreId;
		});
	};

	const getDestinationStores = () => {
		return stores.filter((store) => {
			// Managers can ONLY select their own store
			if (isManager) {
				return store._id === userStoreId;
			}
			// Partners: Can't transfer to the same store as source
			if (store._id === fromStoreId) return false;
			// Partners can select any store (except source)
			return true;
		});
	};

	return (
		<Modal show={show} onHide={handleClose} size="lg">
			<Modal.Header closeButton>
				<Modal.Title>Create Transfer Request</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				{(error || localError) && (
					<Alert
						variant="danger"
						dismissible
						onClose={() => setLocalError(null)}
					>
						{error || localError}
					</Alert>
				)}

				<Form>
					<Row>
						<Col md={6}>
							<Form.Group className="mb-3">
								<Form.Label>From Store (Source)</Form.Label>
								<Form.Select
									value={fromStoreId}
									onChange={(e) => {
										setFromStoreId(e.target.value);
										setSelectedItems([]);
									}}
								>
									<option value="">Select source store...</option>
									{getSourceStores().map((store) => (
										<option key={store._id} value={store._id}>
											{store.name} - {store.location?.city},{" "}
											{store.location?.state}
										</option>
									))}
								</Form.Select>
								{isManager && (
									<Form.Text className="text-muted">
										Request inventory FROM other stores TO your store.
									</Form.Text>
								)}
							</Form.Group>
						</Col>
						<Col md={6}>
							<Form.Group className="mb-3">
								<Form.Label>To Store (Destination)</Form.Label>
								<Form.Select
									value={toStoreId}
									onChange={(e) => setToStoreId(e.target.value)}
									disabled={isManager} // Managers can't change destination
								>
									<option value="">Select destination store...</option>
									{getDestinationStores().map((store) => (
										<option key={store._id} value={store._id}>
											{store.name} - {store.location?.city},{" "}
											{store.location?.state}
										</option>
									))}
								</Form.Select>
								{isManager && (
									<Form.Text className="text-muted">
										Your store will receive the requested inventory.
									</Form.Text>
								)}
							</Form.Group>
						</Col>
					</Row>

					{fromStoreId && (
						<>
							<h5 className="mt-3">Available Inventory</h5>
							{loadingInventory ? (
								<Spinner animation="border" size="sm" />
							) : availableInventory.length === 0 ? (
								<Alert variant="info">
									No inventory available at the selected store.
								</Alert>
							) : (
								<div
									style={{
										maxHeight: "200px",
										overflowY: "auto",
										border: "1px solid #dee2e6",
										borderRadius: "4px",
										padding: "10px",
									}}
								>
									<Table size="sm" hover>
										<thead>
											<tr>
												<th>Product</th>
												<th>SKU</th>
												<th>Location</th>
												<th>Available</th>
												<th>Action</th>
											</tr>
										</thead>
										<tbody>
											{availableInventory.map((inv) => (
												<tr key={inv._id}>
													<td>{inv.productId?.name}</td>
													<td>
														<code>{inv.productId?.sku}</code>
													</td>
													<td>
														<Badge
															bg={
																inv.location === "floor"
																	? "primary"
																	: "secondary"
															}
														>
															{inv.location}
														</Badge>
													</td>
													<td>{inv.quantity}</td>
													<td>
														<Button
															variant="outline-success"
															size="sm"
															onClick={() => handleAddItem(inv)}
															disabled={selectedItems.some(
																(item) => item.inventoryId === inv._id
															)}
														>
															Add
														</Button>
													</td>
												</tr>
											))}
										</tbody>
									</Table>
								</div>
							)}
						</>
					)}

					{selectedItems.length > 0 && (
						<>
							<h5 className="mt-3">Selected Items</h5>
							<Table size="sm">
								<thead>
									<tr>
										<th>Product</th>
										<th>SKU</th>
										<th>Max Qty</th>
										<th>Request Qty</th>
										<th>Action</th>
									</tr>
								</thead>
								<tbody>
									{selectedItems.map((item) => (
										<tr key={item.inventoryId}>
											<td>{item.productName}</td>
											<td>
												<code>{item.sku}</code>
											</td>
											<td>{item.maxQuantity}</td>
											<td>
												<Form.Control
													type="number"
													min="1"
													max={item.maxQuantity}
													value={item.requestedQuantity}
													onChange={(e) =>
														handleUpdateQuantity(
															item.inventoryId,
															e.target.value
														)
													}
													style={{ width: "80px" }}
												/>
											</td>
											<td>
												<Button
													variant="outline-danger"
													size="sm"
													onClick={() => handleRemoveItem(item.inventoryId)}
												>
													Remove
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</Table>
						</>
					)}

					<Form.Group className="mb-3">
						<Form.Label>Notes (Optional)</Form.Label>
						<Form.Control
							as="textarea"
							rows={3}
							value={transferNotes}
							onChange={(e) => setTransferNotes(e.target.value)}
							placeholder="Add any notes about this transfer..."
						/>
					</Form.Group>
				</Form>
			</Modal.Body>
			<Modal.Footer>
				<Button variant="secondary" onClick={handleClose}>
					Cancel
				</Button>
				<Button
					variant="primary"
					onClick={handleSubmit}
					disabled={!fromStoreId || !toStoreId || selectedItems.length === 0}
				>
					Create Request
				</Button>
			</Modal.Footer>
		</Modal>
	);
}

export default CreateTransferRequestModal;
