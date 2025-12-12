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
						<Table
							responsive
							hover
							style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
						>
							<thead>
								<tr>
									<th style={{ borderBottom: "2px solid #dee2e6" }}>
										Request #
									</th>
									<th style={{ borderBottom: "2px solid #dee2e6" }}>
										Transfer Route
									</th>
									<th style={{ borderBottom: "2px solid #dee2e6" }}>Items</th>
									<th style={{ borderBottom: "2px solid #dee2e6" }}>Status</th>
									<th style={{ borderBottom: "2px solid #dee2e6" }}>Created</th>
									<th style={{ borderBottom: "2px solid #dee2e6" }}>Actions</th>
								</tr>
							</thead>
							<tbody>
								{transferRequests.length === 0 ? (
									<tr>
										<td
											colSpan="6"
											className="text-center text-muted"
											style={{ padding: "2rem" }}
										>
											No transfer requests found
										</td>
									</tr>
								) : (
									transferRequests.map((request) => {
										const statusColors = {
											open: { border: "#6c757d", bg: "#f8f9fa" },
											requested: { border: "#0dcaf0", bg: "#e7f6fd" },
											sent: { border: "#ffc107", bg: "#fff8e1" },
											complete: { border: "#198754", bg: "#d1e7dd" },
											closed: { border: "#dc3545", bg: "#f8d7da" },
										};
										const colors =
											statusColors[request.status] || statusColors.open;

										return (
											<tr
												key={request._id}
												style={{ borderLeft: `4px solid ${colors.border}` }}
											>
												<td
													style={{
														verticalAlign: "middle",
														padding: "1rem 0.75rem",
														backgroundColor: colors.bg,
													}}
												>
													<code
														style={{
															fontSize: "0.95rem",
															fontWeight: "600",
														}}
													>
														{request.requestNumber}
													</code>
												</td>
												<td
													style={{
														verticalAlign: "middle",
														padding: "1rem 0.75rem",
														backgroundColor: colors.bg,
													}}
												>
													<div className="d-flex align-items-center gap-2">
														<div>
															<strong>{request.fromStoreId?.name}</strong>
															<div className="small text-muted">
																{request.fromStoreId?.location?.city}
															</div>
														</div>
														<span
															style={{ fontSize: "1.2rem", color: "#6c757d" }}
														>
															→
														</span>
														<div>
															<strong>{request.toStoreId?.name}</strong>
															<div className="small text-muted">
																{request.toStoreId?.location?.city}
															</div>
														</div>
													</div>
												</td>
												<td
													style={{
														verticalAlign: "middle",
														padding: "1rem 0.75rem",
														backgroundColor: colors.bg,
													}}
												>
													<Badge
														bg="primary"
														pill
														style={{ fontSize: "0.9rem" }}
													>
														{request.items?.length || 0} items
													</Badge>
												</td>
												<td
													style={{
														verticalAlign: "middle",
														padding: "1rem 0.75rem",
														backgroundColor: colors.bg,
													}}
												>
													<Badge
														bg={getStatusBadge(request.status)}
														style={{
															fontSize: "0.85rem",
															padding: "0.4rem 0.8rem",
															textTransform: "uppercase",
															fontWeight: "600",
														}}
													>
														{request.status}
													</Badge>
												</td>
												<td
													style={{
														verticalAlign: "middle",
														padding: "1rem 0.75rem",
														backgroundColor: colors.bg,
													}}
												>
													<div style={{ fontSize: "0.9rem" }}>
														{formatDate(request.createdAt)}
													</div>
													<div
														className="small text-muted"
														style={{ fontSize: "0.8rem" }}
													>
														by {request.createdBy?.username}
													</div>
												</td>
												<td
													style={{
														verticalAlign: "middle",
														padding: "1rem 0.75rem",
														backgroundColor: colors.bg,
													}}
												>
													<Button
														variant="outline-primary"
														size="sm"
														onClick={() => handleViewDetails(request._id)}
														style={{ fontWeight: "500" }}
													>
														View Details
													</Button>
												</td>
											</tr>
										);
									})
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
							{/* Store Route Section */}
							<Card className="mb-3" style={{ backgroundColor: "#f8f9fa" }}>
								<Card.Body>
									<Row className="align-items-center">
										<Col md={5}>
											<div className="text-center">
												<div className="small text-muted mb-1">FROM</div>
												<h5 className="mb-1">
													{selectedRequest.fromStoreId?.name}
												</h5>
												<div className="text-muted small">
													{selectedRequest.fromStoreId?.location?.city},{" "}
													{selectedRequest.fromStoreId?.location?.state}
												</div>
											</div>
										</Col>
										<Col
											md={2}
											className="text-center"
											style={{ fontSize: "2rem", color: "#0d6efd" }}
										>
											→
										</Col>
										<Col md={5}>
											<div className="text-center">
												<div className="small text-muted mb-1">TO</div>
												<h5 className="mb-1">
													{selectedRequest.toStoreId?.name}
												</h5>
												<div className="text-muted small">
													{selectedRequest.toStoreId?.location?.city},{" "}
													{selectedRequest.toStoreId?.location?.state}
												</div>
											</div>
										</Col>
									</Row>
								</Card.Body>
							</Card>

							{/* Status Section */}
							<div className="mb-3 d-flex align-items-center gap-2">
								<h6 className="mb-0">Status:</h6>
								<Badge
									bg={getStatusBadge(selectedRequest.status)}
									style={{
										fontSize: "0.9rem",
										padding: "0.5rem 1rem",
										textTransform: "uppercase",
										fontWeight: "600",
									}}
								>
									{selectedRequest.status}
								</Badge>
							</div>

							{/* Items Section */}
							<Card className="mb-3">
								<Card.Header
									style={{ backgroundColor: "#e7f1ff", fontWeight: "600" }}
								>
									Transfer Items
								</Card.Header>
								<Card.Body className="p-0">
									<Table size="sm" className="mb-0" hover>
										<thead style={{ backgroundColor: "#f8f9fa" }}>
											<tr>
												<th style={{ padding: "0.75rem" }}>Product</th>
												<th style={{ padding: "0.75rem" }}>SKU</th>
												<th style={{ padding: "0.75rem" }}>Quantity</th>
												<th style={{ padding: "0.75rem" }}>Location</th>
											</tr>
										</thead>
										<tbody>
											{selectedRequest.items?.map((item, idx) => (
												<tr key={idx}>
													<td style={{ padding: "0.75rem" }}>
														<strong>{item.productId?.name}</strong>
													</td>
													<td style={{ padding: "0.75rem" }}>
														<code style={{ fontSize: "0.9rem" }}>
															{item.productId?.sku}
														</code>
													</td>
													<td style={{ padding: "0.75rem" }}>
														<Badge bg="primary" pill>
															{item.requestedQuantity}
														</Badge>
													</td>
													<td style={{ padding: "0.75rem" }}>
														<Badge
															bg={
																item.inventoryId?.location === "floor"
																	? "info"
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
								</Card.Body>
							</Card>

							{selectedRequest.notes && (
								<Card className="mb-3">
									<Card.Header
										style={{ backgroundColor: "#fff8e1", fontWeight: "600" }}
									>
										Notes
									</Card.Header>
									<Card.Body>
										<p className="mb-0">{selectedRequest.notes}</p>
									</Card.Body>
								</Card>
							)}

							{/* Timeline Section */}
							<Card className="mb-3">
								<Card.Header
									style={{ backgroundColor: "#e8f5e9", fontWeight: "600" }}
								>
									Timeline
								</Card.Header>
								<Card.Body>
									<div
										style={{
											borderLeft: "3px solid #dee2e6",
											paddingLeft: "1.5rem",
										}}
									>
										<div className="mb-3">
											<Badge bg="secondary" className="mb-1">
												CREATED
											</Badge>
											<div>
												{formatDate(selectedRequest.createdAt)} by{" "}
												<strong>{selectedRequest.createdBy?.username}</strong>
											</div>
										</div>
										{selectedRequest.requestedAt && (
											<div className="mb-3">
												<Badge bg="info" className="mb-1">
													REQUESTED
												</Badge>
												<div>
													{formatDate(selectedRequest.requestedAt)} by{" "}
													<strong>
														{selectedRequest.requestedBy?.username}
													</strong>
												</div>
											</div>
										)}
										{selectedRequest.sentAt && (
											<div className="mb-3">
												<Badge bg="warning" className="mb-1">
													SENT
												</Badge>
												<div>
													{formatDate(selectedRequest.sentAt)} by{" "}
													<strong>{selectedRequest.sentBy?.username}</strong>
												</div>
											</div>
										)}
										{selectedRequest.completedAt && (
											<div className="mb-3">
												<Badge bg="success" className="mb-1">
													COMPLETED
												</Badge>
												<div>
													{formatDate(selectedRequest.completedAt)} by{" "}
													<strong>
														{selectedRequest.completedBy?.username}
													</strong>
												</div>
											</div>
										)}
										{selectedRequest.closedAt && (
											<div className="mb-3">
												<Badge bg="danger" className="mb-1">
													CLOSED
												</Badge>
												<div>
													{formatDate(selectedRequest.closedAt)} by{" "}
													<strong>{selectedRequest.closedBy?.username}</strong>
													{selectedRequest.closeReason && (
														<div
															className="mt-1 p-2"
															style={{
																backgroundColor: "#f8d7da",
																borderRadius: "4px",
																fontSize: "0.9rem",
															}}
														>
															<em>Reason: {selectedRequest.closeReason}</em>
														</div>
													)}
												</div>
											</div>
										)}
									</div>
								</Card.Body>
							</Card>

							{/* Status Transition Buttons */}
							<Card>
								<Card.Header
									style={{ backgroundColor: "#fff3cd", fontWeight: "600" }}
								>
									Available Actions
								</Card.Header>
								<Card.Body>
									<div className="d-flex flex-wrap gap-2">
										{selectedRequest.status === "open" &&
											canTransitionTo(selectedRequest, "requested") && (
												<Button
													variant="info"
													onClick={() => openStatusModal("requested")}
													style={{ fontWeight: "500" }}
												>
													📝 Submit Request
												</Button>
											)}
										{selectedRequest.status === "requested" &&
											canTransitionTo(selectedRequest, "sent") && (
												<Button
													variant="warning"
													onClick={() => openStatusModal("sent")}
													style={{ fontWeight: "500" }}
												>
													📦 Mark as Sent
												</Button>
											)}
										{selectedRequest.status === "sent" &&
											canTransitionTo(selectedRequest, "complete") && (
												<Button
													variant="success"
													onClick={() => openStatusModal("complete")}
													style={{ fontWeight: "500" }}
												>
													✅ Confirm Receipt
												</Button>
											)}
										{canTransitionTo(selectedRequest, "closed") &&
											selectedRequest.status !== "complete" &&
											selectedRequest.status !== "closed" && (
												<Button
													variant="danger"
													onClick={() => openStatusModal("closed")}
													style={{ fontWeight: "500" }}
												>
													❌ Close Request
												</Button>
											)}
										{!canTransitionTo(selectedRequest, "requested") &&
											!canTransitionTo(selectedRequest, "sent") &&
											!canTransitionTo(selectedRequest, "complete") &&
											(!canTransitionTo(selectedRequest, "closed") ||
												selectedRequest.status === "complete" ||
												selectedRequest.status === "closed") && (
												<div className="text-muted">
													No actions available for this request
												</div>
											)}
									</div>
								</Card.Body>
							</Card>
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
