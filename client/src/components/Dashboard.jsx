import { Container, Card, Badge, Row, Col } from "react-bootstrap";
import { storeAPI } from "../api/stores";
import { useState, useEffect } from "react";
import Navigation from "./Navigation";
import StoreManagement from "./StoreManagement";
import InventoryManagement from "./InventoryManagement";
import ProductManagement from "./ProductManagement";

function Dashboard({ user, onLogout }) {
	const [store, setStore] = useState(null);
	const [loadingStore, setLoadingStore] = useState(false);
	const [currentView, setCurrentView] = useState("dashboard");

	useEffect(() => {
		const fetchStore = async () => {
			if (user.assignedStoreId) {
				setLoadingStore(true);
				try {
					const response = await storeAPI.getStore(user.assignedStoreId);
					setStore(response.store);
				} catch (error) {
					console.error("Error fetching store:", error);
				} finally {
					setLoadingStore(false);
				}
			}
		};

		fetchStore();
	}, [user.assignedStoreId]);

	const getRoleBadge = (role) => {
		const roleConfig = {
			partner: { variant: "success", text: "Partner" },
			"store-manager": { variant: "primary", text: "Store Manager" },
			employee: { variant: "secondary", text: "Employee" },
		};

		const config = roleConfig[role] || { variant: "secondary", text: role };
		return <Badge bg={config.variant}>{config.text}</Badge>;
	};

	const getRoleDescription = (role) => {
		const storeName = store?.name || "your assigned store";
		switch (role) {
			case "partner":
				return "You have full system access across all stores.";
			case "store-manager":
				return `You can manage ${storeName} and create inter-store transfer requests.`;
			case "employee":
				return `You can view and manage inventory at ${storeName}.`;
			default:
				return "";
		}
	};

	// Render different views based on currentView state
	if (currentView === "stores") {
		return (
			<>
				<Navigation
					user={user}
					currentView={currentView}
					onNavigate={setCurrentView}
					onLogout={onLogout}
				/>
				<StoreManagement
					user={user}
					onUnauthorized={() => setCurrentView("dashboard")}
				/>
			</>
		);
	} else if (currentView === "inventory") {
		return (
			<>
				<Navigation
					user={user}
					currentView={currentView}
					onNavigate={setCurrentView}
					onLogout={onLogout}
				/>
				<InventoryManagement
					user={user}
					onUnauthorized={() => setCurrentView("dashboard")}
				/>
			</>
		);
	} else if (currentView === "products") {
		return (
			<>
				<Navigation
					user={user}
					currentView={currentView}
					onNavigate={setCurrentView}
					onLogout={onLogout}
				/>
				<ProductManagement user={user} />
			</>
		);
	}

	// Otherwise render dashboard
	return (
		<>
			<Navigation
				user={user}
				currentView={currentView}
				onNavigate={setCurrentView}
				onLogout={onLogout}
			/>
			<Container className="py-5">
				<Row className="mb-4">
					<Col>
						<h1>Dashboard</h1>
					</Col>
				</Row>

				<Card className="mb-4">
					<Card.Body>
						<Card.Title>
							Welcome, {user.fullName}! {getRoleBadge(user.role)}
						</Card.Title>
						<Card.Text>{getRoleDescription(user.role)}</Card.Text>

						<hr />

						<Row>
							<Col md={6}>
								<p className="mb-1">
									<strong>Username:</strong> {user.username}
								</p>
								<p className="mb-1">
									<strong>Email:</strong> {user.email}
								</p>
							</Col>
							<Col md={6}>
								<p className="mb-1">
									<strong>Role:</strong> {user.role}
								</p>
								{loadingStore ? (
									<p className="mb-1 text-muted">Loading store...</p>
								) : store ? (
									<>
										<p className="mb-1">
											<strong>Assigned Store:</strong> {store.name}
										</p>
										<p className="mb-1 text-muted small">{store.fullAddress}</p>
									</>
								) : user.assignedStoreId ? (
									<p className="mb-1 text-muted">Store info unavailable</p>
								) : (
									<p className="mb-1">
										<strong>Access:</strong> All Stores
									</p>
								)}
							</Col>
						</Row>
					</Card.Body>
				</Card>

				<Card>
					<Card.Body>
						<Card.Title>Your Capabilities</Card.Title>
						{user.role === "partner" && (
							<div>
								<h5 className="text-success">Partner Access</h5>
								<ul>
									<li>View and manage all stores</li>
									<li>Approve transfer requests between stores</li>
									<li>Add new products to the system</li>
									<li>Manage floor display configurations</li>
									<li>Create and manage user accounts</li>
									<li>View system-wide reports and analytics</li>
								</ul>
							</div>
						)}
						{user.role === "store-manager" && (
							<div>
								<h5 className="text-primary">Store Manager Access</h5>
								<ul>
									<li>Manage inventory at your assigned store</li>
									<li>Move inventory between floor and back room</li>
									<li>Create transfer requests to other stores</li>
									<li>Approve employee order requests</li>
									<li>View and resolve capacity alerts</li>
									<li>Add existing products to inventory</li>
								</ul>
							</div>
						)}
						{user.role === "employee" && (
							<div>
								<h5 className="text-secondary">Employee Access</h5>
								<ul>
									<li>View inventory at your assigned store</li>
									<li>Create order requests for new products</li>
									<li>View capacity alerts</li>
									<li>Check product availability</li>
								</ul>
							</div>
						)}
					</Card.Body>
				</Card>
			</Container>
		</>
	);
}

export default Dashboard;
