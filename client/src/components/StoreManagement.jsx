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
					{accessibleStores.map((store) => (
						<Col md={6} lg={4} key={store._id}>
							<Card className="h-100">
								<Card.Body>
									<div className="d-flex justify-content-between align-items-start mb-3">
										<div>
											<h5>{store.name}</h5>
											<p className="text-muted mb-0 small">
												{store.fullAddress}
											</p>
										</div>
									</div>

									<div className="mb-3">
										<div className="d-flex justify-content-between mb-2">
											<span className="small">
												<strong>Capacity:</strong> {store.currentCapacity} /{" "}
												{store.maxCapacity}
											</span>
											<Badge
												bg={getCapacityVariant(
													calculateCapacityPercentage(
														store.currentCapacity,
														store.maxCapacity
													)
												)}
											>
												{calculateCapacityPercentage(
													store.currentCapacity,
													store.maxCapacity
												)}
												%
											</Badge>
										</div>
										<ProgressBar
											now={calculateCapacityPercentage(
												store.currentCapacity,
												store.maxCapacity
											)}
											variant={getCapacityVariant(
												calculateCapacityPercentage(
													store.currentCapacity,
													store.maxCapacity
												)
											)}
										/>
										{calculateCapacityPercentage(
											store.currentCapacity,
											store.maxCapacity
										) >= 90 && (
											<Alert variant="danger" className="mt-2 mb-0 small">
												<strong>Warning:</strong> Store is at{" "}
												{calculateCapacityPercentage(
													store.currentCapacity,
													store.maxCapacity
												)}
												% capacity!
											</Alert>
										)}
									</div>

									<div className="mb-3">
										<p className="mb-1 small">
											<strong>Max Capacity:</strong> {store.maxCapacity} units
										</p>
										<p className="mb-1 small">
											<strong>Current Capacity:</strong> {store.currentCapacity}{" "}
											units
										</p>
										<p className="mb-0 small">
											<strong>Available Space:</strong>{" "}
											{store.maxCapacity - store.currentCapacity} units
										</p>
									</div>

									<div className="d-flex gap-2">
										{(user.role === "partner" ||
											(user.role === "store-manager" &&
												user.assignedStoreId === store._id)) && (
											<Button
												variant="outline-primary"
												size="sm"
												className="flex-grow-1"
												onClick={() => handleEditStore(store)}
											>
												Edit
											</Button>
										)}
										{user.role === "partner" && (
											<Button
												variant="outline-danger"
												size="sm"
												className="flex-grow-1"
												onClick={() => handleDeleteClick(store)}
											>
												Delete
											</Button>
										)}
									</div>
								</Card.Body>
							</Card>
						</Col>
					))}
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
