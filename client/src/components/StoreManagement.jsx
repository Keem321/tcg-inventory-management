/**
 * StoreManagement Component
 * Main page for managing stores with role-based access
 */

import { useState, useEffect } from "react";
import {
	Container,
	Row,
	Col,
	Card,
	Button,
	Alert,
	ProgressBar,
	Badge,
} from "react-bootstrap";
import { storeAPI } from "../api/stores";
import CreateStoreModal from "./modals/CreateStoreModal";
import UpdateStoreModal from "./modals/UpdateStoreModal";
import DeleteStoreModal from "./modals/DeleteStoreModal";

const StoreManagement = ({ user, onUnauthorized }) => {
	const [stores, setStores] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	// Modal states
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showUpdateModal, setShowUpdateModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [selectedStore, setSelectedStore] = useState(null);

	const filterStoresByRole = (allStores) => {
		if (user.role === "partner") {
			return allStores; // Partners see all stores
		} else if (user.role === "store-manager" && user.assignedStoreId) {
			return allStores.filter((store) => store._id === user.assignedStoreId);
		}
		return [];
	};

	const fetchStores = async () => {
		try {
			setLoading(true);
			setError("");
			const response = await storeAPI.getStores();

			if (response.success) {
				setStores(response.stores);
			}
		} catch (err) {
			console.error("Error fetching stores:", err);
			setError(err.response?.data?.message || "Error loading stores");
		} finally {
			setLoading(false);
		}
	};

	// Check authorization and load stores
	useEffect(() => {
		if (!user || user.role === "employee") {
			if (onUnauthorized) {
				onUnauthorized();
			}
			return;
		}

		fetchStores();
	}, [user, onUnauthorized]);

	const handleAddStore = () => {
		setShowCreateModal(true);
	};

	const handleEditStore = (store) => {
		setSelectedStore(store);
		setShowUpdateModal(true);
	};

	const handleDeleteClick = (store) => {
		setSelectedStore(store);
		setShowDeleteModal(true);
	};

	const handleDeleteStore = async (storeId) => {
		const response = await storeAPI.deleteStore(storeId);
		if (response.success) {
			setShowDeleteModal(false);
			setSelectedStore(null);
			await fetchStores();
		}
	};

	const handleCreateStore = async (formData) => {
		const response = await storeAPI.createStore(formData);
		if (response.success) {
			setShowCreateModal(false);
			await fetchStores();
		}
	};

	const handleUpdateStore = async (formData) => {
		const response = await storeAPI.updateStore(selectedStore._id, formData);
		if (response.success) {
			setShowUpdateModal(false);
			setSelectedStore(null);
			await fetchStores();
		}
	};

	const calculateCapacityPercentage = (current, max) => {
		return Math.round((current / max) * 100);
	};

	const getCapacityVariant = (percentage) => {
		if (percentage >= 90) return "danger";
		if (percentage >= 75) return "warning";
		return "success";
	};

	const accessibleStores = filterStoresByRole(stores);

	if (loading) {
		return (
			<Container className="py-4">
				<div className="text-center">
					<div className="spinner-border" role="status">
						<span className="visually-hidden">Loading...</span>
					</div>
				</div>
			</Container>
		);
	}

	return (
		<Container className="py-4">
			<div className="d-flex justify-content-between align-items-center mb-4">
				<h2>Store Management</h2>
				{user.role === "partner" && (
					<Button variant="primary" onClick={handleAddStore}>
						Add New Store
					</Button>
				)}
			</div>

			{error && (
				<Alert variant="danger" dismissible onClose={() => setError("")}>
					{error}
				</Alert>
			)}

			{/* Create Store Modal */}
			<CreateStoreModal
				show={showCreateModal}
				onHide={() => setShowCreateModal(false)}
				onStoreCreated={handleCreateStore}
			/>

			{/* Update Store Modal */}
			<UpdateStoreModal
				show={showUpdateModal}
				onHide={() => setShowUpdateModal(false)}
				store={selectedStore}
				onStoreUpdated={handleUpdateStore}
			/>

			{accessibleStores.length === 0 ? (
				<Alert variant="info">No stores available.</Alert>
			) : (
				<Row className="g-4">
					{accessibleStores.map((store) => {
						const capacityPercentage = calculateCapacityPercentage(
							store.currentCapacity,
							store.maxCapacity
						);
						const capacityVariant = getCapacityVariant(capacityPercentage);

						// Color scheme based on capacity
						const borderColors = {
							success: "#198754",
							warning: "#ffc107",
							danger: "#dc3545",
						};
						const bgColors = {
							success: "#d1e7dd",
							warning: "#fff8e1",
							danger: "#f8d7da",
						};
						const borderColor = borderColors[capacityVariant];
						const bgColor = bgColors[capacityVariant];

						return (
							<Col md={6} lg={4} key={store._id}>
								<Card
									className="h-100 shadow-sm"
									style={{
										borderLeft: `6px solid ${borderColor}`,
										transition: "transform 0.2s, box-shadow 0.2s",
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.transform = "translateY(-4px)";
										e.currentTarget.style.boxShadow =
											"0 .5rem 1rem rgba(0,0,0,.15)";
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.transform = "translateY(0)";
										e.currentTarget.style.boxShadow =
											"0 .125rem .25rem rgba(0,0,0,.075)";
									}}
								>
									{/* Store Header with Icon */}
									<div
										style={{
											background: `linear-gradient(135deg, ${bgColor} 0%, #ffffff 100%)`,
											padding: "1.25rem 1.25rem 1rem 1.25rem",
											borderBottom: `2px solid ${borderColor}`,
										}}
									>
										<div className="d-flex align-items-start gap-3">
											<div
												style={{
													fontSize: "2.5rem",
													lineHeight: "1",
												}}
											>
												🏪
											</div>
											<div className="flex-grow-1">
												<h5 className="mb-1" style={{ fontWeight: "700" }}>
													{store.name}
												</h5>
												<div
													className="d-flex align-items-center gap-1 text-muted"
													style={{ fontSize: "0.85rem" }}
												>
													<span>📍</span>
													<span>{store.fullAddress}</span>
												</div>
											</div>
										</div>
									</div>

									<Card.Body>
										{/* Capacity Status Banner */}
										<div
											className="mb-3 p-2 rounded"
											style={{
												backgroundColor: bgColor,
												border: `1px solid ${borderColor}`,
											}}
										>
											<div className="d-flex justify-content-between align-items-center mb-2">
												<span
													style={{
														fontWeight: "600",
														fontSize: "0.9rem",
														color: borderColor,
													}}
												>
													Store Capacity
												</span>
												<Badge
													bg={capacityVariant}
													style={{
														fontSize: "0.9rem",
														padding: "0.4rem 0.8rem",
														fontWeight: "700",
													}}
												>
													{capacityPercentage}%
												</Badge>
											</div>
											<ProgressBar
												now={capacityPercentage}
												variant={capacityVariant}
												style={{ height: "12px" }}
											/>
										</div>

										{/* High Capacity Warning */}
										{capacityPercentage >= 90 && (
											<Alert
												variant="danger"
												className="py-2 px-3 mb-3"
												style={{ fontSize: "0.85rem" }}
											>
												<strong>⚠️ Critical:</strong> Store is at{" "}
												{capacityPercentage}% capacity!
											</Alert>
										)}

										{/* Capacity Stats Grid */}
										<div className="mb-3">
											<Row className="g-2">
												<Col xs={6}>
													<div
														className="p-2 rounded text-center"
														style={{ backgroundColor: "#f8f9fa" }}
													>
														<div
															style={{
																fontSize: "1.5rem",
																fontWeight: "700",
																color: "#0d6efd",
															}}
														>
															{store.maxCapacity}
														</div>
														<div
															className="text-muted"
															style={{ fontSize: "0.75rem" }}
														>
															Max Capacity
														</div>
													</div>
												</Col>
												<Col xs={6}>
													<div
														className="p-2 rounded text-center"
														style={{ backgroundColor: "#f8f9fa" }}
													>
														<div
															style={{
																fontSize: "1.5rem",
																fontWeight: "700",
																color: borderColor,
															}}
														>
															{store.currentCapacity}
														</div>
														<div
															className="text-muted"
															style={{ fontSize: "0.75rem" }}
														>
															Current Stock
														</div>
													</div>
												</Col>
												<Col xs={12}>
													<div
														className="p-2 rounded text-center"
														style={{ backgroundColor: "#e7f6fd" }}
													>
														<div
															style={{
																fontSize: "1.5rem",
																fontWeight: "700",
																color: "#0dcaf0",
															}}
														>
															{store.maxCapacity - store.currentCapacity}
														</div>
														<div
															className="text-muted"
															style={{ fontSize: "0.75rem" }}
														>
															Available Space
														</div>
													</div>
												</Col>
											</Row>
										</div>

										{/* Action Buttons */}
										<div className="d-flex gap-2">
											{(user.role === "partner" ||
												(user.role === "store-manager" &&
													user.assignedStoreId === store._id)) && (
												<Button
													variant="outline-primary"
													size="sm"
													onClick={() => handleEditStore(store)}
													style={{ fontWeight: "600", flex: "3" }}
												>
													Edit
												</Button>
											)}
											{user.role === "partner" && (
												<Button
													variant="outline-danger"
													size="sm"
													onClick={() => handleDeleteClick(store)}
													style={{ fontWeight: "600", flex: "1" }}
												>
													Delete
												</Button>
											)}
										</div>
									</Card.Body>
								</Card>
							</Col>
						);
					})}
				</Row>
			)}

			{/* Delete Store Modal */}
			<DeleteStoreModal
				show={showDeleteModal}
				onHide={() => setShowDeleteModal(false)}
				store={selectedStore}
				onStoreDeleted={handleDeleteStore}
			/>
		</Container>
	);
};

export default StoreManagement;
