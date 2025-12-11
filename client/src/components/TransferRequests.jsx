/**
 * Transfer Requests Component
 * Manage inventory transfers between stores with multi-stage workflow
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
	Modal,
} from "react-bootstrap";
import { transferRequestAPI } from "../api/transferRequests";
import { storeAPI } from "../api/stores";
import CreateTransferRequestModal from "./modals/CreateTransferRequestModal";

function TransferRequests({ user }) {
	const [transferRequests, setTransferRequests] = useState([]);
	const [stores, setStores] = useState([]);
	const [userStore, setUserStore] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);

	// Filters
	const [statusFilter, setStatusFilter] = useState("all");
	const [storeFilter, setStoreFilter] = useState("all");

	// Modals
	const [showCreateModal, setShowCreateModal] = useState(false);

	// Detail modal
	const [showDetailModal, setShowDetailModal] = useState(false);
	const [selectedRequest, setSelectedRequest] = useState(null);
	const [loadingDetail, setLoadingDetail] = useState(false);

	// Status update modal
	const [showStatusModal, setShowStatusModal] = useState(false);
	const [newStatus, setNewStatus] = useState("");
	const [closeReason, setCloseReason] = useState("");

	// User permissions
	const isPartner = user?.role === "partner";
	const isManager = user?.role === "store-manager";

	// Load transfer requests
	const loadTransferRequests = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const options = {};
			if (statusFilter !== "all") {
				options.status = statusFilter;
			}
			if (storeFilter !== "all") {
				options.storeId = storeFilter;
			}

			const response = await transferRequestAPI.getTransferRequests(options);
			setTransferRequests(response.transferRequests);
		} catch (err) {
			setError(err.response?.data?.message || err.message);
		} finally {
			setLoading(false);
		}
	}, [statusFilter, storeFilter]);

	useEffect(() => {
		loadTransferRequests();
	}, [loadTransferRequests]);

	// Load stores on mount
	useEffect(() => {
		const loadStores = async () => {
			try {
				const response = await storeAPI.getStores();
				const storesList = response.stores || [];
				setStores(storesList);

				// If manager, find their store
				if (isManager && user?.assignedStoreId) {
					const managerStore = storesList.find(
						(s) => s._id === user.assignedStoreId
					);
					setUserStore(managerStore);
				}
			} catch (err) {
				console.error("Error loading stores:", err);
				setError(err.response?.data?.message || err.message);
			}
		};
		loadStores();
	}, [isManager, user?.assignedStoreId]);

	// Handle create transfer request
	const handleCreateTransfer = async (requestData) => {
		try {
			await transferRequestAPI.createTransferRequest(requestData);
			setSuccess("Transfer request created successfully");
			setShowCreateModal(false);
			setError(null);
			loadTransferRequests();
		} catch (err) {
			setError(err.response?.data?.message || err.message);
		}
	};

	// View request details
	const handleViewDetails = async (requestId) => {
		try {
			setLoadingDetail(true);
			setShowDetailModal(true);
			const response = await transferRequestAPI.getTransferRequestById(
				requestId
			);
			setSelectedRequest(response.transferRequest);
		} catch (err) {
			setError(err.response?.data?.message || err.message);
			setShowDetailModal(false);
		} finally {
			setLoadingDetail(false);
		}
	};

	// Handle status update
	const handleUpdateStatus = async () => {
		try {
			await transferRequestAPI.updateTransferStatus(
				selectedRequest._id,
				newStatus,
				closeReason
			);
			setSuccess(`Transfer request status updated to ${newStatus}`);
			setShowStatusModal(false);
			setShowDetailModal(false);
			setCloseReason("");
			loadTransferRequests();
		} catch (err) {
			setError(err.response?.data?.message || err.message);
		}
	};

	// Open status update modal
	const openStatusModal = (status) => {
		setNewStatus(status);
		setShowStatusModal(true);
	};

	// Get status badge variant
	const getStatusBadge = (status) => {
		const variants = {
			open: "secondary",
			requested: "info",
			sent: "warning",
			complete: "success",
			closed: "danger",
		};
		return variants[status] || "secondary";
	};

	// Format date
	const formatDate = (dateString) => {
		if (!dateString) return "-";
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// Check if user can perform action
	const canTransitionTo = (request, targetStatus) => {
		if (!request) return false;

		const currentStatus = request.status;

		// Partners can do most transitions
		if (isPartner) {
			if (targetStatus === "closed") return true;
			if (currentStatus === "complete") return false; // Can't uncomplete
			return true;
		}

		// Managers need store-specific permissions
		if (isManager) {
			const userStoreId = user?.assignedStoreId;
			if (!userStoreId) return false;

			// Submit request (to store)
			if (currentStatus === "open" && targetStatus === "requested") {
				return request.toStoreId._id === userStoreId;
			}
			// Send items (from store)
			if (currentStatus === "requested" && targetStatus === "sent") {
				return request.fromStoreId._id === userStoreId;
			}
			// Confirm receipt (to store)
			if (currentStatus === "sent" && targetStatus === "complete") {
				return request.toStoreId._id === userStoreId;
			}
		}

		return false;
	};

	return (
		<Container className="py-4">
			<Row className="mb-4">
				<Col>
					<h2>
						Transfer Requests
						{isManager && userStore && ` for ${userStore.name}`}
					</h2>
					<p className="text-muted">
						Manage inventory transfers between stores
					</p>
				</Col>
				<Col xs="auto">
					{(isPartner || isManager) && (
						<Button variant="primary" onClick={() => setShowCreateModal(true)}>
							New Transfer Request
						</Button>
					)}
				</Col>
			</Row>

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

			{/* Filters */}
			<Card className="mb-4">
				<Card.Body>
					<Row>
						<Col md={4}>
							<Form.Group>
								<Form.Label>Filter by Status</Form.Label>
								<Form.Select
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value)}
								>
									<option value="all">All Statuses</option>
									<option value="open">Open</option>
									<option value="requested">Requested</option>
									<option value="sent">Sent</option>
									<option value="complete">Complete</option>
									<option value="closed">Closed</option>
								</Form.Select>
							</Form.Group>
						</Col>
						<Col md={4}>
							<Form.Group>
								<Form.Label>Filter by Store</Form.Label>
								<Form.Select
									value={storeFilter}
									onChange={(e) => setStoreFilter(e.target.value)}
								>
									<option value="all">All Stores</option>
									{stores.map((store) => (
										<option value={store._id} key={store._id}>
											{store.name}
										</option>
									))}
								</Form.Select>
							</Form.Group>
						</Col>
					</Row>
				</Card.Body>
			</Card>

			{/* Transfer Requests Table */}
			<Card>
				<Card.Body>
					{loading ? (
						<div className="text-center py-5">
							<Spinner animation="border" />
							<p className="text-muted mt-2">Loading transfer requests...</p>
						</div>
					) : (
						<Table responsive hover>
							<thead>
								<tr>
									<th>Request #</th>
									<th>From Store</th>
									<th>To Store</th>
									<th>Items</th>
									<th>Status</th>
									<th>Created</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{transferRequests.length === 0 ? (
									<tr>
										<td colSpan="7" className="text-center text-muted">
											No transfer requests found
										</td>
									</tr>
								) : (
									transferRequests.map((request) => (
										<tr key={request._id}>
											<td>
												<code>{request.requestNumber}</code>
											</td>
											<td>{request.fromStoreId?.name}</td>
											<td>{request.toStoreId?.name}</td>
											<td>{request.items?.length || 0} items</td>
											<td>
												<Badge bg={getStatusBadge(request.status)}>
													{request.status}
												</Badge>
											</td>
											<td>{formatDate(request.createdAt)}</td>
											<td>
												<Button
													variant="outline-primary"
													size="sm"
													onClick={() => handleViewDetails(request._id)}
												>
													View Details
												</Button>
											</td>
										</tr>
									))
								)}
							</tbody>
						</Table>
					)}
				</Card.Body>
			</Card>

			{/* Create Transfer Modal */}
			<CreateTransferRequestModal
				show={showCreateModal}
				onHide={() => setShowCreateModal(false)}
				stores={stores}
				user={user}
				onSubmit={handleCreateTransfer}
				error={error}
			/>

			{/* Detail Modal */}
			<Modal
				show={showDetailModal}
				onHide={() => setShowDetailModal(false)}
				size="lg"
			>
				<Modal.Header closeButton>
					<Modal.Title>
						Transfer Request Details
						{selectedRequest && (
							<>
								{" - "}
								<code>{selectedRequest.requestNumber}</code>
							</>
						)}
					</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{loadingDetail ? (
						<div className="text-center py-5">
							<Spinner animation="border" />
						</div>
					) : selectedRequest ? (
						<>
							<Row>
								<Col md={6}>
									<h5>From Store</h5>
									<p>
										<strong>{selectedRequest.fromStoreId?.name}</strong>
										<br />
										{selectedRequest.fromStoreId?.location?.city},{" "}
										{selectedRequest.fromStoreId?.location?.state}
									</p>
								</Col>
								<Col md={6}>
									<h5>To Store</h5>
									<p>
										<strong>{selectedRequest.toStoreId?.name}</strong>
										<br />
										{selectedRequest.toStoreId?.location?.city},{" "}
										{selectedRequest.toStoreId?.location?.state}
									</p>
								</Col>
							</Row>

							<h5 className="mt-3">Status</h5>
							<Badge
								bg={getStatusBadge(selectedRequest.status)}
								className="mb-3"
							>
								{selectedRequest.status}
							</Badge>

							<h5 className="mt-3">Items</h5>
							<Table size="sm">
								<thead>
									<tr>
										<th>Product</th>
										<th>SKU</th>
										<th>Quantity</th>
										<th>Location</th>
									</tr>
								</thead>
								<tbody>
									{selectedRequest.items?.map((item, idx) => (
										<tr key={idx}>
											<td>{item.productId?.name}</td>
											<td>
												<code>{item.productId?.sku}</code>
											</td>
											<td>{item.requestedQuantity}</td>
											<td>
												<Badge
													bg={
														item.inventoryId?.location === "floor"
															? "primary"
															: "secondary"
													}
												>
													{item.inventoryId?.location || "N/A"}
												</Badge>
											</td>
										</tr>
									))}
								</tbody>
							</Table>

							{selectedRequest.notes && (
								<>
									<h5 className="mt-3">Notes</h5>
									<p>{selectedRequest.notes}</p>
								</>
							)}

							<h5 className="mt-3">Timeline</h5>
							<ul>
								<li>
									<strong>Created:</strong>{" "}
									{formatDate(selectedRequest.createdAt)} by{" "}
									{selectedRequest.createdBy?.username}
								</li>
								{selectedRequest.requestedAt && (
									<li>
										<strong>Requested:</strong>{" "}
										{formatDate(selectedRequest.requestedAt)} by{" "}
										{selectedRequest.requestedBy?.username}
									</li>
								)}
								{selectedRequest.sentAt && (
									<li>
										<strong>Sent:</strong> {formatDate(selectedRequest.sentAt)}{" "}
										by {selectedRequest.sentBy?.username}
									</li>
								)}
								{selectedRequest.completedAt && (
									<li>
										<strong>Completed:</strong>{" "}
										{formatDate(selectedRequest.completedAt)} by{" "}
										{selectedRequest.completedBy?.username}
									</li>
								)}
								{selectedRequest.closedAt && (
									<li>
										<strong>Closed:</strong>{" "}
										{formatDate(selectedRequest.closedAt)} by{" "}
										{selectedRequest.closedBy?.username}
										{selectedRequest.closeReason && (
											<>
												<br />
												<em>Reason: {selectedRequest.closeReason}</em>
											</>
										)}
									</li>
								)}
							</ul>

							{/* Status Transition Buttons */}
							<div className="mt-4">
								<h5>Actions</h5>
								{selectedRequest.status === "open" &&
									canTransitionTo(selectedRequest, "requested") && (
										<Button
											variant="info"
											className="me-2"
											onClick={() => openStatusModal("requested")}
										>
											Submit Request
										</Button>
									)}
								{selectedRequest.status === "requested" &&
									canTransitionTo(selectedRequest, "sent") && (
										<Button
											variant="warning"
											className="me-2"
											onClick={() => openStatusModal("sent")}
										>
											Mark as Sent
										</Button>
									)}
								{selectedRequest.status === "sent" &&
									canTransitionTo(selectedRequest, "complete") && (
										<Button
											variant="success"
											className="me-2"
											onClick={() => openStatusModal("complete")}
										>
											Confirm Receipt
										</Button>
									)}
								{canTransitionTo(selectedRequest, "closed") &&
									selectedRequest.status !== "complete" &&
									selectedRequest.status !== "closed" && (
										<Button
											variant="danger"
											onClick={() => openStatusModal("closed")}
										>
											Close Request
										</Button>
									)}
							</div>
						</>
					) : null}
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => setShowDetailModal(false)}>
						Close
					</Button>
				</Modal.Footer>
			</Modal>

			{/* Status Update Confirmation Modal */}
			<Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
				<Modal.Header closeButton>
					<Modal.Title>Confirm Status Update</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<p>
						Are you sure you want to update the status to{" "}
						<Badge bg={getStatusBadge(newStatus)}>{newStatus}</Badge>?
					</p>

					{newStatus === "sent" && (
						<Alert variant="warning">
							<strong>Note:</strong> Marking as sent will deduct the requested
							items from the source store inventory.
						</Alert>
					)}

					{newStatus === "complete" && (
						<Alert variant="success">
							<strong>Note:</strong> Marking as complete will add the items to
							the destination store inventory.
						</Alert>
					)}

					{newStatus === "closed" && (
						<Form.Group>
							<Form.Label>Reason for Closing (Optional)</Form.Label>
							<Form.Control
								as="textarea"
								rows={3}
								value={closeReason}
								onChange={(e) => setCloseReason(e.target.value)}
								placeholder="Explain why this request is being closed..."
							/>
						</Form.Group>
					)}
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => setShowStatusModal(false)}>
						Cancel
					</Button>
					<Button variant="primary" onClick={handleUpdateStatus}>
						Confirm
					</Button>
				</Modal.Footer>
			</Modal>
		</Container>
	);
}

export default TransferRequests;
