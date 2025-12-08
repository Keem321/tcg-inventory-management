/**
 * StoreManagement Component
 * Main page for managing stores with role-based access
 */

import { useState, useEffect } from "react";
import {
	Container,
	Tabs,
	Tab,
	Card,
	Button,
	Alert,
	Modal,
	ProgressBar,
	Badge,
} from "react-bootstrap";
import { storeAPI } from "../api/stores";
import StoreForm from "./StoreForm";

const StoreManagement = ({ user, onUnauthorized }) => {
	const [stores, setStores] = useState([]);
	const [activeTab, setActiveTab] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [formMode, setFormMode] = useState("create");
	const [selectedStore, setSelectedStore] = useState(null);
	const [formLoading, setFormLoading] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [storeToDelete, setStoreToDelete] = useState(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	const filterStoresByRole = (allStores) => {
		if (user.role === "partner") {
			return allStores; // Partners see all stores
		} else if (user.role === "store-manager" && user.assignedStoreId) {
			return allStores.filter((store) => store.id === user.assignedStoreId);
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

				// Filter stores based on role
				const accessibleStores = filterStoresByRole(response.stores);

				// Set active tab to first store if not already set or if current tab is not accessible
				if (accessibleStores.length > 0) {
					if (!activeTab || !accessibleStores.find((s) => s.id === activeTab)) {
						setActiveTab(accessibleStores[0].id);
					}
				}
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user, onUnauthorized]);

	const handleAddStore = () => {
		setFormMode("create");
		setSelectedStore(null);
		setShowForm(true);
	};

	const handleEditStore = (store) => {
		setFormMode("edit");
		setSelectedStore(store);
		setShowForm(true);
	};

	const handleDeleteClick = (store) => {
		setStoreToDelete(store);
		setShowDeleteModal(true);
	};

	const handleDeleteConfirm = async () => {
		if (!storeToDelete) return;

		try {
			setDeleteLoading(true);
			const response = await storeAPI.deleteStore(storeToDelete.id);

			if (response.success) {
				setShowDeleteModal(false);
				setStoreToDelete(null);
				await fetchStores(); // Refresh list
			}
		} catch (err) {
			console.error("Error deleting store:", err);
			setError(
				err.response?.data?.message || err.message || "Failed to delete store"
			);
			setShowDeleteModal(false);
		} finally {
			setDeleteLoading(false);
		}
	};

	const handleFormSubmit = async (formData) => {
		try {
			setFormLoading(true);
			setError("");

			if (formMode === "create") {
				const response = await storeAPI.createStore(formData);
				if (response.success) {
					setShowForm(false);
					await fetchStores();
					setActiveTab(response.store.id); // Switch to newly created store
				}
			} else {
				const response = await storeAPI.updateStore(selectedStore.id, formData);
				if (response.success) {
					setShowForm(false);
					await fetchStores();
				}
			}
		} catch (err) {
			console.error("Error saving store:", err);
			setError(err.response?.data?.message || "Failed to save store");
		} finally {
			setFormLoading(false);
		}
	};

	const handleFormCancel = () => {
		setShowForm(false);
		setSelectedStore(null);
		setError("");
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
				{user.role === "partner" && !showForm && (
					<Button variant="primary" onClick={handleAddStore}>
						Add New Store
					</Button>
				)}
			</div>

			<p className="text-muted">
				"todo: change minimum requirements for products and brands here."
			</p>

			{error && (
				<Alert variant="danger" dismissible onClose={() => setError("")}>
					{error}
				</Alert>
			)}

			{/* Form Modal */}
			<Modal show={showForm} onHide={handleFormCancel} size="lg">
				<Modal.Header closeButton>
					<Modal.Title>
						{formMode === "create" ? "Create New Store" : "Edit Store"}
					</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<StoreForm
						mode={formMode}
						store={selectedStore}
						onSubmit={handleFormSubmit}
						onCancel={handleFormCancel}
						loading={formLoading}
					/>
				</Modal.Body>
			</Modal>

			{accessibleStores.length === 0 ? (
				<Alert variant="info">No stores available.</Alert>
			) : (
				<Tabs
					activeKey={activeTab}
					onSelect={(k) => {
						console.log("Tab clicked:", k);
						console.log("Current activeTab:", activeTab);
						setActiveTab(k);
					}}
					className="mb-3"
				>
					{accessibleStores.map((store) => (
						<Tab eventKey={store.id} title={store.name} key={store.id}>
							<Card>
								<Card.Body>
									<div className="d-flex justify-content-between align-items-start mb-3">
										<div>
											<h4>{store.name}</h4>
											<p className="text-muted mb-1">{store.fullAddress}</p>
										</div>
										<div className="d-flex gap-2">
											{(user.role === "partner" ||
												(user.role === "store-manager" &&
													user.assignedStoreId === store.id)) && (
												<Button
													variant="outline-primary"
													size="sm"
													onClick={() => handleEditStore(store)}
												>
													Edit Store
												</Button>
											)}
											{user.role === "partner" && (
												<Button
													variant="outline-danger"
													size="sm"
													onClick={() => handleDeleteClick(store)}
												>
													Delete Store
												</Button>
											)}
										</div>
									</div>

									<div className="mb-3">
										<div className="d-flex justify-content-between mb-2">
											<span>
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
											<Alert variant="danger" className="mt-2 mb-0">
												<strong>Warning:</strong> Store is at{" "}
												{calculateCapacityPercentage(
													store.currentCapacity,
													store.maxCapacity
												)}
												% capacity!
											</Alert>
										)}
									</div>

									<div>
										<p className="mb-1">
											<strong>Max Capacity:</strong> {store.maxCapacity} units
										</p>
										<p className="mb-1">
											<strong>Current Capacity:</strong> {store.currentCapacity}{" "}
											units
										</p>
										<p className="mb-1">
											<strong>Available Space:</strong>{" "}
											{store.maxCapacity - store.currentCapacity} units
										</p>
									</div>
								</Card.Body>
							</Card>
						</Tab>
					))}
				</Tabs>
			)}

			{/* Delete Confirmation Modal */}
			<Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
				<Modal.Header closeButton>
					<Modal.Title>Confirm Deletion</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					Are you sure you want to delete <strong>{storeToDelete?.name}</strong>
					? This action cannot be undone.
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant="secondary"
						onClick={() => setShowDeleteModal(false)}
						disabled={deleteLoading}
					>
						Cancel
					</Button>
					<Button
						variant="danger"
						onClick={handleDeleteConfirm}
						disabled={deleteLoading}
					>
						{deleteLoading ? "Deleting..." : "Confirm Delete"}
					</Button>
				</Modal.Footer>
			</Modal>
		</Container>
	);
};

export default StoreManagement;
