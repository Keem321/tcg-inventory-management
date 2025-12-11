import { useState, useEffect } from "react";
import { Spinner, Container } from "react-bootstrap";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import { authAPI } from "./api/auth";

function App() {
	// first param is current state, second param is function to update state
	const [user, setUser] = useState(null); // null means not logged in
	const [loading, setLoading] = useState(true); // default to loading while checking session

	// run on initial load
	useEffect(() => {
		checkSession();
	}, []); // empty dependency array means run once on mount

	/**
	 * Check if a session exists
	 * - If so, set user
	 * - If not, remain null (not logged in)
	 */
	const checkSession = async () => {
		try {
			const response = await authAPI.checkSession();
			if (response.success) {
				setUser(response.user);
			}
		} catch {
			// Not logged in - silently handle
		} finally {
			setLoading(false);
		}
	};

	/* Event Handlers */

	const handleLoginSuccess = (userData) => {
		setUser(userData);
	};

	const handleLogout = () => {
		setUser(null);
	};

	/**
	 * Conditional Rendering
	 * - If loading, show spinner
	 */
	if (loading) {
		return (
			<Container
				className="d-flex align-items-center justify-content-center"
				style={{ minHeight: "100vh" }}
			>
				<Spinner animation="border" role="status">
					<span className="visually-hidden">Loading...</span>
				</Spinner>
			</Container>
		);
	}

	/**
	 * Main render
	 * - If user exists (already logged in), skip login and go to dashboard
	 * - If no user, show login
	 */
	return (
		<div className="App">
			{user ? (
				<Dashboard user={user} onLogout={handleLogout} />
			) : (
				<Login onLoginSuccess={handleLoginSuccess} />
			)}
		</div>
	);
}

export default App;
