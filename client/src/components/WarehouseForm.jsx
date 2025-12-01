/**
 * WarehouseForm Component
 * Form for creating and editing warehouse/store information
 */

import { useState } from "react";
import { Form, Button } from "react-bootstrap";

const getInitialFormData = (mode, warehouse) => {
	if (mode === "edit" && warehouse) {
		return {
			name: warehouse.name || "",
			address: warehouse.location?.address || "",
			city: warehouse.location?.city || "",
			state: warehouse.location?.state || "",
			zipCode: warehouse.location?.zipCode || "",
			maxCapacity: warehouse.maxCapacity || "",
		};
	}
	return {
		name: "",
		address: "",
		city: "",
		state: "",
		zipCode: "",
		maxCapacity: "",
	};
};

const WarehouseForm = ({
	mode = "create",
	warehouse = null,
	onSubmit,
	onCancel,
	loading = false,
}) => {
	const [formData, setFormData] = useState(() =>
		getInitialFormData(mode, warehouse)
	);
	const [errors, setErrors] = useState({});

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
				if (!/^\d{5}(-\d{4})?$/.test(value)) return "Invalid zip code format";
				return "";
			case "maxCapacity":
				if (!value) return "Max capacity is required";
				if (isNaN(value) || Number(value) <= 0)
					return "Max capacity must be a positive number";
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

		// Clear error for this field when user starts typing
		if (errors[name]) {
			setErrors((prev) => {
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
			setErrors((prev) => ({
				...prev,
				[name]: error,
			}));
		}
	};

	const handleSubmit = (e) => {
		e.preventDefault();

		// Validate all fields
		const newErrors = {};
		Object.keys(formData).forEach((key) => {
			const error = validateField(key, formData[key]);
			if (error) {
				newErrors[key] = error;
			}
		});

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

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

		onSubmit(submitData);
	};

	const isFormValid = () => {
		return (
			Object.keys(errors).length === 0 &&
			formData.name.trim() &&
			formData.address.trim() &&
			formData.city.trim() &&
			formData.state.trim() &&
			formData.zipCode.trim() &&
			formData.maxCapacity
		);
	};

	return (
		<Form onSubmit={handleSubmit}>
			<Form.Group className="mb-3" controlId="name">
				<Form.Label>Warehouse Name</Form.Label>
				<Form.Control
					type="text"
					name="name"
					value={formData.name}
					onChange={handleChange}
					onBlur={handleBlur}
					disabled={loading}
					isInvalid={!!errors.name}
					placeholder="Enter warehouse name"
					required
				/>
				<Form.Control.Feedback type="invalid">
					{errors.name}
				</Form.Control.Feedback>
			</Form.Group>

			<Form.Group className="mb-3" controlId="address">
				<Form.Label>Street Address</Form.Label>
				<Form.Control
					type="text"
					name="address"
					value={formData.address}
					onChange={handleChange}
					onBlur={handleBlur}
					disabled={loading}
					isInvalid={!!errors.address}
					placeholder="Enter street address"
					required
				/>
				<Form.Control.Feedback type="invalid">
					{errors.address}
				</Form.Control.Feedback>
			</Form.Group>

			<Form.Group className="mb-3" controlId="city">
				<Form.Label>City</Form.Label>
				<Form.Control
					type="text"
					name="city"
					value={formData.city}
					onChange={handleChange}
					onBlur={handleBlur}
					disabled={loading}
					isInvalid={!!errors.city}
					placeholder="Enter city"
					required
				/>
				<Form.Control.Feedback type="invalid">
					{errors.city}
				</Form.Control.Feedback>
			</Form.Group>

			<Form.Group className="mb-3" controlId="state">
				<Form.Label>State</Form.Label>
				<Form.Control
					type="text"
					name="state"
					value={formData.state}
					onChange={handleChange}
					onBlur={handleBlur}
					disabled={loading}
					isInvalid={!!errors.state}
					placeholder="Enter state (2 letters)"
					maxLength={2}
					required
				/>
				<Form.Control.Feedback type="invalid">
					{errors.state}
				</Form.Control.Feedback>
			</Form.Group>

			<Form.Group className="mb-3" controlId="zipCode">
				<Form.Label>Zip Code</Form.Label>
				<Form.Control
					type="text"
					name="zipCode"
					value={formData.zipCode}
					onChange={handleChange}
					onBlur={handleBlur}
					disabled={loading}
					isInvalid={!!errors.zipCode}
					placeholder="Enter zip code"
					required
				/>
				<Form.Control.Feedback type="invalid">
					{errors.zipCode}
				</Form.Control.Feedback>
			</Form.Group>

			<Form.Group className="mb-3" controlId="maxCapacity">
				<Form.Label>Max Capacity</Form.Label>
				<Form.Control
					type="number"
					name="maxCapacity"
					value={formData.maxCapacity}
					onChange={handleChange}
					onBlur={handleBlur}
					disabled={loading}
					isInvalid={!!errors.maxCapacity}
					placeholder="Enter maximum capacity"
					min="1"
					required
				/>
				<Form.Control.Feedback type="invalid">
					{errors.maxCapacity}
				</Form.Control.Feedback>
			</Form.Group>

			<div className="d-flex justify-content-end gap-2">
				<Button variant="secondary" onClick={onCancel} disabled={loading}>
					Cancel
				</Button>
				<Button
					variant="primary"
					type="submit"
					disabled={loading || !isFormValid()}
				>
					{loading
						? "Saving..."
						: mode === "create"
						? "Create Warehouse"
						: "Save Changes"}
				</Button>
			</div>
		</Form>
	);
};

export default WarehouseForm;
