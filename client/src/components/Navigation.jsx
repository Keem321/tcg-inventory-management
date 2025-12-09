/**
 * Navigation Component
 * Role-based navigation header for the application
 */

import { Navbar, Nav, Container, Badge, Button } from "react-bootstrap";
import { authAPI } from "../api/auth";

function Navigation({ user, currentView, onNavigate, onLogout }) {
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
			"store-manager": { variant: "primary", text: "Manager" },
			employee: { variant: "secondary", text: "Employee" },
		};

		const config = roleConfig[role] || { variant: "secondary", text: role };
		return <Badge bg={config.variant}>{config.text}</Badge>;
	};

	const isPartner = user.role === "partner";
	const isManager = user.role === "store-manager";

	return (
		<Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
			<Container>
				<Navbar.Brand
					href="#"
					onClick={(e) => {
						e.preventDefault();
						onNavigate("dashboard");
					}}
					style={{ cursor: "pointer" }}
				>
					TCG Inventory
				</Navbar.Brand>
				<Navbar.Toggle aria-controls="basic-navbar-nav" />
				<Navbar.Collapse id="basic-navbar-nav">
					<Nav className="me-auto">
						<Nav.Link
							active={currentView === "dashboard"}
							onClick={() => onNavigate("dashboard")}
						>
							Dashboard
						</Nav.Link>

						{/* Manage Inventory - Everyone */}
						<Nav.Link
							active={currentView === "inventory"}
							onClick={() => onNavigate("inventory")}
						>
							Manage Inventory
						</Nav.Link>

						{/* Manage Stores - Partner Only */}
						{isPartner && (
							<Nav.Link
								active={currentView === "stores"}
								onClick={() => onNavigate("stores")}
							>
								Manage Stores
							</Nav.Link>
						)}

						{/* Manage Products - Partner Only */}
						{isPartner && (
							<Nav.Link
								active={currentView === "products"}
								onClick={() => onNavigate("products")}
							>
								Manage Products
							</Nav.Link>
						)}

						{/* Transfer Requests - Managers and Partners */}
						{(isManager || isPartner) && (
							<Nav.Link
								active={currentView === "transfers"}
								onClick={() => onNavigate("transfers")}
							>
								Transfer Requests
							</Nav.Link>
						)}
					</Nav>{" "}
					<Nav>
						<Navbar.Text className="me-3">
							{user.fullName} {getRoleBadge(user.role)}
						</Navbar.Text>
						<Button variant="outline-light" size="sm" onClick={handleLogout}>
							Logout
						</Button>
					</Nav>
				</Navbar.Collapse>
			</Container>
		</Navbar>
	);
}

export default Navigation;
