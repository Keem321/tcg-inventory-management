import { Container, Card, Badge, Button, Row, Col } from "react-bootstrap";
import { authAPI } from "../api/auth";
import { storeAPI } from "../api/stores";
import { useState, useEffect } from "react";
import StoreManagement from "./StoreManagement";

function Dashboard({ user, onLogout }) {
	const [store, setStore] = useState(null);
	const [loadingStore, setLoadingStore] = useState(false);
	const [currentView, setCurrentView] = useState("dashboard"); // 'dashboard' or 'stores'

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

	const handleLogout = async () => {
		try {
			await authAPI.logout();
			onLogout();
		} catch (err) {
			console.error("Logout error:", err);
		}
	};

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

	// If viewing store management, render that instead
	if (currentView === "stores") {
		return (
			<StoreManagement
				user={user}
				onUnauthorized={() => setCurrentView("dashboard")}
				onBack={() => setCurrentView("dashboard")}
			/>
		);
	}

	// Otherwise render dashboard
	return (
		<Container className="py-5">
			<Row className="mb-4">
				<Col>
					<h1>TCG Inventory Management</h1>
				</Col>
				<Col xs="auto">
					<Button variant="outline-danger" onClick={handleLogout}>
						Logout
					</Button>
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
					<Card.Title>Role-Based Features</Card.Title>
					{(user.role === "partner" || user.role === "store-manager") && (
						<div className="mb-3">
							<Button
								variant="primary"
								onClick={() => setCurrentView("stores")}
							>
								Manage Stores
							</Button>
						</div>
					)}{" "}
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
	);
}

export default Dashboard;
