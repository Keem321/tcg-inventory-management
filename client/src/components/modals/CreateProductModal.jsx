/**
 * CreateProductModal Component
 * Modal for adding new product to the inventory
 */

import { useState } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";
import {
	PRODUCT_TYPES,
	CARD_RARITIES,
	CARD_CONDITIONS,
	CARD_FINISHES,
	PRODUCT_TYPE_LABELS,
	CARD_RARITY_LABELS,
	CARD_CONDITION_LABELS,
	CARD_FINISH_LABELS,
} from "../../constants/enums";

function CreateProductModal({ show, onHide, onProductCreated }) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const [formData, setFormData] = useState({
		sku: "",
		productType: PRODUCT_TYPES.BOOSTER_PACK,
		name: "",
		description: "",
		brand: "",
		unitSize: 1,
		bulkQuantity: null,
		basePrice: 0,
		isActive: true,
		// Card details (only for single cards)
		cardDetails: {
			set: "",
			cardNumber: "",
			rarity: CARD_RARITIES.COMMON,
			condition: CARD_CONDITIONS.NEAR_MINT,
			finish: CARD_FINISHES.NON_FOIL,
		},
	});

	const isSingleCard = formData.productType === PRODUCT_TYPES.SINGLE_CARD;

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));
	};

	const handleCardDetailsChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			cardDetails: {
				...prev.cardDetails,
				[name]: value,
			},
		}));
	};

	const handleProductTypeChange = (e) => {
		const newType = e.target.value;
		const isSingleCard = newType === PRODUCT_TYPES.SINGLE_CARD;

		setFormData((prev) => ({
			...prev,
			productType: newType,
			unitSize: isSingleCard ? 0 : prev.unitSize || 1,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			// Build payload
			const payload = {
				sku: formData.sku.trim(),
				productType: formData.productType,
				name: formData.name.trim(),
				brand: formData.brand.trim(),
				unitSize: parseFloat(formData.unitSize),
				basePrice: parseFloat(formData.basePrice),
				isActive: formData.isActive,
			};

			// Optional fields
			if (formData.description?.trim()) {
				payload.description = formData.description.trim();
			}

			if (formData.bulkQuantity) {
				payload.bulkQuantity = parseInt(formData.bulkQuantity);
			}

			// Add card details for single cards
			if (isSingleCard) {
				payload.cardDetails = {
					set: formData.cardDetails.set.trim(),
					cardNumber: formData.cardDetails.cardNumber.trim(),
					rarity: formData.cardDetails.rarity,
					condition: formData.cardDetails.condition,
					finish: formData.cardDetails.finish,
				};
			}

			await onProductCreated(payload);
			handleClose();
		} catch (err) {
			setError(err.response?.data?.message || err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setFormData({
			sku: "",
			productType: PRODUCT_TYPES.BOOSTER_PACK,
			name: "",
			description: "",
			brand: "",
			unitSize: 1,
			bulkQuantity: null,
			basePrice: 0,
			isActive: true,
			cardDetails: {
				set: "",
				cardNumber: "",
				rarity: CARD_RARITIES.COMMON,
				condition: CARD_CONDITIONS.NEAR_MINT,
				finish: CARD_FINISHES.NON_FOIL,
			},
		});
		setError(null);
		onHide();
	};

	return (
		<Modal show={show} onHide={handleClose} size="lg">
			<Modal.Header closeButton>
				<Modal.Title>Create New Product</Modal.Title>
			</Modal.Header>

			<Modal.Body>
				{error && (
					<Alert variant="danger" dismissible onClose={() => setError(null)}>
						{error}
					</Alert>
				)}

				<Form onSubmit={handleSubmit}>
					<Row>
						<Col md={6}>
							<Form.Group className="mb-3">
								<Form.Label>
									SKU <span className="text-danger">*</span>
								</Form.Label>
								<Form.Control
									type="text"
									name="sku"
									value={formData.sku}
									onChange={handleChange}
									required
									placeholder="e.g., MTG-MID-123"
								/>
							</Form.Group>
						</Col>

						<Col md={6}>
							<Form.Group className="mb-3">
								<Form.Label>
									Product Type <span className="text-danger">*</span>
								</Form.Label>
								<Form.Select
									name="productType"
									value={formData.productType}
									onChange={handleProductTypeChange}
									required
								>
									{Object.values(PRODUCT_TYPES).map((value) => (
										<option key={value} value={value}>
											{PRODUCT_TYPE_LABELS[value]}
										</option>
									))}
								</Form.Select>
							</Form.Group>
						</Col>
					</Row>

					<Row>
						<Col md={8}>
							<Form.Group className="mb-3">
								<Form.Label>
									Name <span className="text-danger">*</span>
								</Form.Label>
								<Form.Control
									type="text"
									name="name"
									value={formData.name}
									onChange={handleChange}
									required
									placeholder="Product name"
								/>
							</Form.Group>
						</Col>

						<Col md={4}>
							<Form.Group className="mb-3">
								<Form.Label>
									Brand <span className="text-danger">*</span>
								</Form.Label>
								<Form.Control
									type="text"
									name="brand"
									value={formData.brand}
									onChange={handleChange}
									required
									placeholder="e.g., Wizards of the Coast"
								/>
							</Form.Group>
						</Col>
					</Row>

					<Form.Group className="mb-3">
						<Form.Label>Description</Form.Label>
						<Form.Control
							as="textarea"
							name="description"
							value={formData.description}
							onChange={handleChange}
							rows={2}
							placeholder="Product description (optional)"
						/>
					</Form.Group>

					<Row>
						<Col md={4}>
							<Form.Group className="mb-3">
								<Form.Label>
									Unit Size <span className="text-danger">*</span>
								</Form.Label>
								<Form.Control
									type="number"
									name="unitSize"
									value={formData.unitSize}
									onChange={handleChange}
									required
									min="0"
									step="0.01"
									disabled={isSingleCard}
								/>
								<Form.Text className="text-muted">
									{isSingleCard
										? "Single cards must have 0 unit size"
										: "Physical space units"}
								</Form.Text>
							</Form.Group>
						</Col>

						<Col md={4}>
							<Form.Group className="mb-3">
								<Form.Label>Bulk Quantity</Form.Label>
								<Form.Control
									type="number"
									name="bulkQuantity"
									value={formData.bulkQuantity || ""}
									onChange={handleChange}
									min="1"
									placeholder="Optional"
								/>
								<Form.Text className="text-muted">
									Min quantity for orders
								</Form.Text>
							</Form.Group>
						</Col>

						<Col md={4}>
							<Form.Group className="mb-3">
								<Form.Label>
									Base Price ($) <span className="text-danger">*</span>
								</Form.Label>
								<Form.Control
									type="number"
									name="basePrice"
									value={formData.basePrice}
									onChange={handleChange}
									required
									min="0"
									step="0.01"
									placeholder="0.00"
								/>
							</Form.Group>
						</Col>
					</Row>

					{/* Card Details Section - Only for Single Cards */}
					{isSingleCard && (
						<>
							<hr />
							<h5 className="mb-3">Card Details</h5>

							<Row>
								<Col md={6}>
									<Form.Group className="mb-3">
										<Form.Label>
											Set <span className="text-danger">*</span>
										</Form.Label>
										<Form.Control
											type="text"
											name="set"
											value={formData.cardDetails.set}
											onChange={handleCardDetailsChange}
											required={isSingleCard}
											placeholder="e.g., Innistrad: Midnight Hunt"
										/>
									</Form.Group>
								</Col>

								<Col md={6}>
									<Form.Group className="mb-3">
										<Form.Label>
											Card Number <span className="text-danger">*</span>
										</Form.Label>
										<Form.Control
											type="text"
											name="cardNumber"
											value={formData.cardDetails.cardNumber}
											onChange={handleCardDetailsChange}
											required={isSingleCard}
											placeholder="e.g., 245"
										/>
									</Form.Group>
								</Col>
							</Row>

							<Row>
								<Col md={4}>
									<Form.Group className="mb-3">
										<Form.Label>
											Rarity <span className="text-danger">*</span>
										</Form.Label>
										<Form.Select
											name="rarity"
											value={formData.cardDetails.rarity}
											onChange={handleCardDetailsChange}
											required={isSingleCard}
										>
											{Object.values(CARD_RARITIES).map((value) => (
												<option key={value} value={value}>
													{CARD_RARITY_LABELS[value]}
												</option>
											))}
										</Form.Select>
									</Form.Group>
								</Col>{" "}
								<Col md={4}>
									<Form.Group className="mb-3">
										<Form.Label>
											Condition <span className="text-danger">*</span>
										</Form.Label>
										<Form.Select
											name="condition"
											value={formData.cardDetails.condition}
											onChange={handleCardDetailsChange}
											required={isSingleCard}
										>
											{Object.values(CARD_CONDITIONS).map((value) => (
												<option key={value} value={value}>
													{CARD_CONDITION_LABELS[value]}
												</option>
											))}
										</Form.Select>
									</Form.Group>
								</Col>{" "}
								<Col md={4}>
									<Form.Group className="mb-3">
										<Form.Label>
											Finish <span className="text-danger">*</span>
										</Form.Label>
										<Form.Select
											name="finish"
											value={formData.cardDetails.finish}
											onChange={handleCardDetailsChange}
											required={isSingleCard}
										>
											{Object.values(CARD_FINISHES).map((value) => (
												<option key={value} value={value}>
													{CARD_FINISH_LABELS[value]}
												</option>
											))}
										</Form.Select>
									</Form.Group>
								</Col>
							</Row>
						</>
					)}

					<Form.Group className="mb-3">
						<Form.Check
							type="checkbox"
							name="isActive"
							label="Active Product"
							checked={formData.isActive}
							onChange={handleChange}
						/>
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
					{loading ? "Creating..." : "Create Product"}
				</Button>
			</Modal.Footer>
		</Modal>
	);
}

export default CreateProductModal;
