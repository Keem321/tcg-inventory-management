/**
 * UpdateStoreModal Component
 * Modal for editing an existing store
 */

import { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";

function UpdateStoreModal({ show, onHide, store, onStoreUpdated }) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const [formData, setFormData] = useState({
		name: "",
		address: "",
		city: "",
		state: "",
		zipCode: "",
		maxCapacity: "",
	});

	const [fieldErrors, setFieldErrors] = useState({});

	// Initialize form data when store changes
	useEffect(() => {
		if (store) {
			setFormData({
				name: store.name || "",
				address: store.location?.address || "",
				city: store.location?.city || "",
				state: store.location?.state || "",
				zipCode: store.location?.zipCode || "",
				maxCapacity: store.maxCapacity || "",
			});
		}
	}, [store]);

	const validateField = (name, value) => {
		switch (name) {
			case "name":
				return value.trim() ? "" : "Name is required";
			case "address":
				return value.trim() ? "" : "Address is required";
			case "city":
				return value.trim() ? "" : "City is required";
			case "state":
				if (!value.trim()) return "State is required";
				if (value.length !== 2) return "State must be 2 characters";
				return "";
			case "zipCode":
				if (!value.trim()) return "Zip code is required";
				if (!/^\d{5}(-\d{4})?$/.test(value))
					return "Invalid zip code format (e.g., 12345 or 12345-6789)";
				return "";
			case "maxCapacity":
				if (!value) return "Max capacity is required";
				if (isNaN(value) || Number(value) <= 0)
					return "Max capacity must be a positive number";
				// Validate that new capacity isn't less than current usage
				if (store && Number(value) < store.currentCapacity) {
					return `Max capacity cannot be less than current capacity (${store.currentCapacity})`;
				}
				return "";
			default:
				return "";
		}
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));

		// Clear field error when user starts typing
		if (fieldErrors[name]) {
			setFieldErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[name];
				return newErrors;
			});
		}
	};

	const handleBlur = (e) => {
		const { name, value } = e.target;
		const error = validateField(name, value);
		if (error) {
			setFieldErrors((prev) => ({
				...prev,
				[name]: error,
			}));
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		// Validate all fields
		const newErrors = {};
		Object.keys(formData).forEach((key) => {
			const error = validateField(key, formData[key]);
			if (error) {
				newErrors[key] = error;
			}
		});

		if (Object.keys(newErrors).length > 0) {
			setFieldErrors(newErrors);
			setLoading(false);
			return;
		}

		try {
			// Prepare data for submission
			const submitData = {
				name: formData.name.trim(),
				location: {
					address: formData.address.trim(),
					city: formData.city.trim(),
					state: formData.state.trim().toUpperCase(),
					zipCode: formData.zipCode.trim(),
				},
				maxCapacity: Number(formData.maxCapacity),
			};

			await onStoreUpdated(submitData);
			handleClose();
		} catch (err) {
			setError(err.response?.data?.message || err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setFieldErrors({});
		setError(null);
		onHide();
	};

	return (
		<Modal show={show} onHide={handleClose} size="lg">
			<Modal.Header closeButton>
				<Modal.Title>Edit Store</Modal.Title>
			</Modal.Header>

			<Modal.Body>
				{error && (
					<Alert variant="danger" dismissible onClose={() => setError(null)}>
						{error}
					</Alert>
				)}

				{store && store.currentCapacity > 0 && (
					<Alert variant="info" className="mb-3">
						<strong>Current Usage:</strong> {store.currentCapacity} /{" "}
						{store.maxCapacity} units (
						{Math.round((store.currentCapacity / store.maxCapacity) * 100)}%)
					</Alert>
				)}

				<Form onSubmit={handleSubmit}>
					<Form.Group className="mb-3">
						<Form.Label>
							Store Name <span className="text-danger">*</span>
						</Form.Label>
						<Form.Control
							type="text"
							name="name"
							value={formData.name}
							onChange={handleChange}
							onBlur={handleBlur}
							disabled={loading}
							isInvalid={!!fieldErrors.name}
							placeholder="Enter store name"
							required
						/>
						<Form.Control.Feedback type="invalid">
							{fieldErrors.name}
						</Form.Control.Feedback>
					</Form.Group>

					<Form.Group className="mb-3">
						<Form.Label>
							Street Address <span className="text-danger">*</span>
						</Form.Label>
						<Form.Control
							type="text"
							name="address"
							value={formData.address}
							onChange={handleChange}
							onBlur={handleBlur}
							disabled={loading}
							isInvalid={!!fieldErrors.address}
							placeholder="Enter street address"
							required
						/>
						<Form.Control.Feedback type="invalid">
							{fieldErrors.address}
						</Form.Control.Feedback>
					</Form.Group>

					<Row>
						<Col md={6}>
							<Form.Group className="mb-3">
								<Form.Label>
									City <span className="text-danger">*</span>
								</Form.Label>
								<Form.Control
									type="text"
									name="city"
									value={formData.city}
									onChange={handleChange}
									onBlur={handleBlur}
									disabled={loading}
									isInvalid={!!fieldErrors.city}
									placeholder="Enter city"
									required
								/>
								<Form.Control.Feedback type="invalid">
									{fieldErrors.city}
								</Form.Control.Feedback>
							</Form.Group>
						</Col>

						<Col md={3}>
							<Form.Group className="mb-3">
								<Form.Label>
									State <span className="text-danger">*</span>
								</Form.Label>
								<Form.Control
									type="text"
									name="state"
									value={formData.state}
									onChange={handleChange}
									onBlur={handleBlur}
									disabled={loading}
									isInvalid={!!fieldErrors.state}
									placeholder="NY"
									maxLength={2}
									required
								/>
								<Form.Control.Feedback type="invalid">
									{fieldErrors.state}
								</Form.Control.Feedback>
							</Form.Group>
						</Col>

						<Col md={3}>
							<Form.Group className="mb-3">
								<Form.Label>
									Zip Code <span className="text-danger">*</span>
								</Form.Label>
								<Form.Control
									type="text"
									name="zipCode"
									value={formData.zipCode}
									onChange={handleChange}
									onBlur={handleBlur}
									disabled={loading}
									isInvalid={!!fieldErrors.zipCode}
									placeholder="12345"
									required
								/>
								<Form.Control.Feedback type="invalid">
									{fieldErrors.zipCode}
								</Form.Control.Feedback>
							</Form.Group>
						</Col>
					</Row>

					<Form.Group className="mb-3">
						<Form.Label>
							Max Capacity <span className="text-danger">*</span>
						</Form.Label>
						<Form.Control
							type="number"
							name="maxCapacity"
							value={formData.maxCapacity}
							onChange={handleChange}
							onBlur={handleBlur}
							disabled={loading}
							isInvalid={!!fieldErrors.maxCapacity}
							placeholder="Enter maximum capacity"
							min={store?.currentCapacity || 1}
							required
						/>
						<Form.Control.Feedback type="invalid">
							{fieldErrors.maxCapacity}
						</Form.Control.Feedback>
						<Form.Text className="text-muted">
							{store && store.currentCapacity > 0
								? `Must be at least ${store.currentCapacity} (current usage)`
								: "Maximum storage capacity in units"}
						</Form.Text>
					</Form.Group>
				</Form>
			</Modal.Body>

			<Modal.Footer>
				<Button variant="secondary" onClick={handleClose} disabled={loading}>
					Cancel
				</Button>
				<Button
					variant="primary"
					onClick={handleSubmit}
					disabled={loading}
					type="submit"
				>
					{loading ? "Saving..." : "Save Changes"}
				</Button>
			</Modal.Footer>
		</Modal>
	);
}

export default UpdateStoreModal;
