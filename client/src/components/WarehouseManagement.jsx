/**
 * WarehouseManagement Component
 * Main page for managing warehouses with role-based access
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
import WarehouseForm from "./WarehouseForm";

const WarehouseManagement = ({ user, onUnauthorized, onBack }) => {
	const [stores, setStores] = useState([]);
	const [activeTab, setActiveTab] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [formMode, setFormMode] = useState("create");
	const [selectedWarehouse, setSelectedWarehouse] = useState(null);
	const [formLoading, setFormLoading] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [warehouseToDelete, setWarehouseToDelete] = useState(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

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

				// Filter stores based on role
				const accessibleStores = filterStoresByRole(response.stores);

				// Update active tab if needed
				if (
					accessibleStores.length > 0 &&
					!accessibleStores.find((s) => s._id === activeTab)
				) {
					setActiveTab(accessibleStores[0]._id);
				}
			}
		} catch (err) {
			console.error("Error fetching stores:", err);
			setError(err.response?.data?.message || "Error loading warehouses");
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

	const handleAddWarehouse = () => {
		setFormMode("create");
		setSelectedWarehouse(null);
		setShowForm(true);
	};

	const handleEditWarehouse = (warehouse) => {
		setFormMode("edit");
		setSelectedWarehouse(warehouse);
		setShowForm(true);
	};

	const handleDeleteClick = (warehouse) => {
		setWarehouseToDelete(warehouse);
		setShowDeleteModal(true);
	};

	const handleDeleteConfirm = async () => {
		if (!warehouseToDelete) return;

		try {
			setDeleteLoading(true);
			const response = await storeAPI.deleteStore(warehouseToDelete._id);

			if (response.success) {
				setShowDeleteModal(false);
				setWarehouseToDelete(null);
				await fetchStores(); // Refresh list
			}
		} catch (err) {
			console.error("Error deleting warehouse:", err);
			setError(
				err.response?.data?.message ||
					err.message ||
					"Failed to delete warehouse"
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
					setActiveTab(response.store._id); // Switch to newly created warehouse
				}
			} else {
				const response = await storeAPI.updateStore(
					selectedWarehouse._id,
					formData
				);
				if (response.success) {
					setShowForm(false);
					await fetchStores();
				}
			}
		} catch (err) {
			console.error("Error saving warehouse:", err);
			setError(err.response?.data?.message || "Failed to save warehouse");
		} finally {
			setFormLoading(false);
		}
	};

	const handleFormCancel = () => {
		setShowForm(false);
		setSelectedWarehouse(null);
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
			{onBack && (
				<Button variant="link" onClick={onBack} className="mb-3 p-0">
					← Back to Dashboard
				</Button>
			)}

			<div className="d-flex justify-content-between align-items-center mb-4">
				<h2>Warehouse Management</h2>
				{user.role === "partner" && !showForm && (
					<Button variant="primary" onClick={handleAddWarehouse}>
						Add New Warehouse
					</Button>
				)}
			</div>

			{error && (
				<Alert variant="danger" dismissible onClose={() => setError("")}>
					{error}
				</Alert>
			)}

			{/* Form Modal */}
			<Modal show={showForm} onHide={handleFormCancel} size="lg">
				<Modal.Header closeButton>
					<Modal.Title>
						{formMode === "create" ? "Create New Warehouse" : "Edit Warehouse"}
					</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<WarehouseForm
						mode={formMode}
						warehouse={selectedWarehouse}
						onSubmit={handleFormSubmit}
						onCancel={handleFormCancel}
						loading={formLoading}
					/>
				</Modal.Body>
			</Modal>

			{accessibleStores.length === 0 ? (
				<Alert variant="info">No warehouses available.</Alert>
			) : (
				<Tabs
					activeKey={activeTab}
					onSelect={(k) => setActiveTab(k)}
					className="mb-3"
				>
					{accessibleStores.map((store) => (
						<Tab eventKey={store._id} title={store.name} key={store._id}>
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
													user.assignedStoreId === store._id)) && (
												<Button
													variant="outline-primary"
													size="sm"
													onClick={() => handleEditWarehouse(store)}
												>
													Edit Warehouse
												</Button>
											)}
											{user.role === "partner" && (
												<Button
													variant="outline-danger"
													size="sm"
													onClick={() => handleDeleteClick(store)}
												>
													Delete Warehouse
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
												<strong>Warning:</strong> Warehouse is at{" "}
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
					Are you sure you want to delete{" "}
					<strong>{warehouseToDelete?.name}</strong>? This action cannot be
					undone.
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

export default WarehouseManagement;
