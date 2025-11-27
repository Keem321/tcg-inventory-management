import { useState } from "react";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { authAPI } from "../api/auth";

function Login({ onLoginSuccess }) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const response = await authAPI.login(username, password);
			if (response.success) {
				onLoginSuccess(response.user);
			} else {
				setError(response.message || "Login failed");
			}
		} catch (err) {
			setError(
				err.response?.data?.message ||
					"An error occurred during login. Please try again."
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Container
			className="d-flex align-items-center justify-content-center"
			style={{ minHeight: "100vh" }}
		>
			<Card style={{ width: "100%", maxWidth: "400px" }}>
				<Card.Body>
					<Card.Title className="text-center mb-4">
						<h2>TCG Inventory Login</h2>
					</Card.Title>

					{error && <Alert variant="danger">{error}</Alert>}

					<Form onSubmit={handleSubmit}>
						<Form.Group className="mb-3" controlId="username">
							<Form.Label>Username</Form.Label>
							<Form.Control
								type="text"
								placeholder="Enter username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
								disabled={loading}
							/>
						</Form.Group>

						<Form.Group className="mb-3" controlId="password">
							<Form.Label>Password</Form.Label>
							<Form.Control
								type="password"
								placeholder="Enter password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								disabled={loading}
							/>
						</Form.Group>

						<Button
							variant="primary"
							type="submit"
							className="w-100"
							disabled={loading}
						>
							{loading ? "Logging in..." : "Login"}
						</Button>
					</Form>

					<div className="mt-3 text-muted small">
						<p className="mb-1">Test credentials:</p>
						<p className="mb-0">
							Username: <strong>partner</strong>
							<br />
							Password: <strong>password123</strong>
						</p>
					</div>
				</Card.Body>
			</Card>
		</Container>
	);
}

export default Login;
