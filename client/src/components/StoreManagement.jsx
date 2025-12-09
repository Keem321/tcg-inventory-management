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
	ProgressBar,
	Badge,
} from "react-bootstrap";
import { storeAPI } from "../api/stores";
import CreateStoreModal from "./modals/CreateStoreModal";
import UpdateStoreModal from "./modals/UpdateStoreModal";
import DeleteStoreModal from "./modals/DeleteStoreModal";

const StoreManagement = ({ user, onUnauthorized }) => {
	const [stores, setStores] = useState([]);
	const [activeTab, setActiveTab] = useState(null);
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

				// Filter stores based on role
				const accessibleStores = filterStoresByRole(response.stores);

				// Set active tab to first store if not already set or if current tab is not accessible
				if (accessibleStores.length > 0) {
					if (
						!activeTab ||
						!accessibleStores.find((s) => s._id === activeTab)
					) {
						setActiveTab(accessibleStores[0]._id);
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
			setActiveTab(response.store._id);
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

			<p className="text-muted">
				"todo: change minimum requirements for products and brands here."
			</p>

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
