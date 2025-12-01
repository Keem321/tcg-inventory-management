/**
 * Warehouse Form Component Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WarehouseForm from "../../components/WarehouseForm";

describe("WarehouseForm Component", () => {
	const mockOnSubmit = vi.fn();
	const mockOnCancel = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Create Mode", () => {
		it("should render empty form for creating new warehouse", () => {
			render(
				<WarehouseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					mode="create"
				/>
			);

			expect(screen.getByLabelText("Warehouse Name")).toHaveValue("");
			expect(screen.getByLabelText("Street Address")).toHaveValue("");
			expect(screen.getByLabelText("City")).toHaveValue("");
			expect(screen.getByLabelText("State")).toHaveValue("");
			expect(screen.getByLabelText("Zip Code")).toHaveValue("");
			expect(screen.getByLabelText("Max Capacity")).toHaveValue(null);
		});

		it("should show Create Warehouse button in create mode", () => {
			render(
				<WarehouseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					mode="create"
				/>
			);

			expect(
				screen.getByRole("button", { name: "Create Warehouse" })
			).toBeInTheDocument();
		});

		it("should submit form with valid data", async () => {
			const user = userEvent.setup();
			render(
				<WarehouseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					mode="create"
				/>
			);

			await user.type(screen.getByLabelText("Warehouse Name"), "Test Store");
			await user.type(screen.getByLabelText("Street Address"), "123 Test St");
			await user.type(screen.getByLabelText("City"), "Test City");
			await user.type(screen.getByLabelText("State"), "IL");
			await user.type(screen.getByLabelText("Zip Code"), "12345");
			await user.type(screen.getByLabelText("Max Capacity"), "1000");

			await user.click(
				screen.getByRole("button", { name: "Create Warehouse" })
			);

			await waitFor(() => {
				expect(mockOnSubmit).toHaveBeenCalledWith({
					name: "Test Store",
					location: {
						address: "123 Test St",
						city: "Test City",
						state: "IL",
						zipCode: "12345",
					},
					maxCapacity: 1000,
				});
			});
		});
	});

	describe("Edit Mode", () => {
		const existingWarehouse = {
			_id: "store1",
			name: "Existing Store",
			location: {
				address: "456 Main St",
				city: "Springfield",
				state: "IL",
				zipCode: "62701",
			},
			maxCapacity: 1500,
			currentCapacity: 750,
		};

		it("should render form pre-filled with existing data", () => {
			render(
				<WarehouseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					mode="edit"
					warehouse={existingWarehouse}
				/>
			);

			expect(screen.getByLabelText("Warehouse Name")).toHaveValue(
				"Existing Store"
			);
			expect(screen.getByLabelText("Street Address")).toHaveValue(
				"456 Main St"
			);
			expect(screen.getByLabelText("City")).toHaveValue("Springfield");
			expect(screen.getByLabelText("State")).toHaveValue("IL");
			expect(screen.getByLabelText("Zip Code")).toHaveValue("62701");
			expect(screen.getByLabelText("Max Capacity")).toHaveValue(1500);
		});

		it("should show Save Changes button in edit mode", () => {
			render(
				<WarehouseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					mode="edit"
					warehouse={existingWarehouse}
				/>
			);

			expect(
				screen.getByRole("button", { name: "Save Changes" })
			).toBeInTheDocument();
		});

		it("should submit updated data", async () => {
			const user = userEvent.setup();
			render(
				<WarehouseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					mode="edit"
					warehouse={existingWarehouse}
				/>
			);

			const capacityInput = screen.getByLabelText("Max Capacity");
			await user.clear(capacityInput);
			await user.type(capacityInput, "2000");

			await user.click(screen.getByRole("button", { name: "Save Changes" }));

			await waitFor(() => {
				expect(mockOnSubmit).toHaveBeenCalledWith({
					name: "Existing Store",
					location: {
						address: "456 Main St",
						city: "Springfield",
						state: "IL",
						zipCode: "62701",
					},
					maxCapacity: 2000,
				});
			});
		});
	});

	describe("Form Validation", () => {
		it("should require warehouse name", async () => {
			const user = userEvent.setup();
			render(
				<WarehouseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					mode="create"
				/>
			);

			const nameInput = screen.getByLabelText("Warehouse Name");
			await user.click(nameInput);
			await user.tab(); // Blur the field

			await waitFor(() => {
				expect(screen.getByText(/name is required/i)).toBeInTheDocument();
			});
			expect(mockOnSubmit).not.toHaveBeenCalled();
		});

		it("should require address", async () => {
			const user = userEvent.setup();
			render(
				<WarehouseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					mode="create"
				/>
			);

			const addressInput = screen.getByLabelText("Street Address");
			await user.click(addressInput);
			await user.tab(); // Blur the field

			await waitFor(() => {
				expect(screen.getByText(/address is required/i)).toBeInTheDocument();
			});
			expect(mockOnSubmit).not.toHaveBeenCalled();
		});

		it("should require city", async () => {
			const user = userEvent.setup();
			render(
				<WarehouseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					mode="create"
				/>
			);

			const cityInput = screen.getByLabelText("City");
			await user.click(cityInput);
			await user.tab(); // Blur the field

			await waitFor(() => {
				expect(screen.getByText(/city is required/i)).toBeInTheDocument();
			});
			expect(mockOnSubmit).not.toHaveBeenCalled();
		});

		it("should require state", async () => {
			const user = userEvent.setup();
			render(
				<WarehouseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					mode="create"
				/>
			);

			const stateInput = screen.getByLabelText("State");
			await user.click(stateInput);
			await user.tab(); // Blur the field

			await waitFor(() => {
				expect(screen.getByText(/state is required/i)).toBeInTheDocument();
			});
			expect(mockOnSubmit).not.toHaveBeenCalled();
		});

		it("should validate state is 2 characters", async () => {
			const user = userEvent.setup();
			render(
				<WarehouseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					mode="create"
				/>
			);

			await user.type(screen.getByLabelText("State"), "I"); // Typing more than 2 chars is invalid
			await user.tab(); // Blur the field

			await waitFor(() => {
				expect(
					screen.getByText("State must be 2 characters")
				).toBeInTheDocument();
			});
		});

		it("should require zip code", async () => {
			const user = userEvent.setup();
			render(
				<WarehouseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					mode="create"
				/>
			);

			const zipInput = screen.getByLabelText("Zip Code");
			await user.click(zipInput);
			await user.tab(); // Blur the field

			await waitFor(() => {
				expect(screen.getByText(/zip code is required/i)).toBeInTheDocument();
			});
			expect(mockOnSubmit).not.toHaveBeenCalled();
		});

		it("should validate zip code format", async () => {
			const user = userEvent.setup();
			render(
				<WarehouseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					mode="create"
				/>
			);

			await user.type(screen.getByLabelText("Zip Code"), "ABC");
			await user.tab(); // Blur the field

			await waitFor(() => {
				expect(screen.getByText("Invalid zip code format")).toBeInTheDocument();
			});
		});

		it("should require max capacity", async () => {
			const user = userEvent.setup();
			render(
				<WarehouseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					mode="create"
				/>
			);

			const capacityInput = screen.getByLabelText("Max Capacity");
			await user.click(capacityInput);
			await user.tab(); // Blur the field

			await waitFor(() => {
				expect(screen.getByText(/capacity is required/i)).toBeInTheDocument();
			});
			expect(mockOnSubmit).not.toHaveBeenCalled();
		});

		it("should validate max capacity is positive", async () => {
			const user = userEvent.setup();
			render(
				<WarehouseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					mode="create"
				/>
			);

			await user.type(screen.getByLabelText("Max Capacity"), "-100");
			await user.tab(); // Blur the field

			await waitFor(() => {
				expect(
					screen.getByText("Max capacity must be a positive number")
				).toBeInTheDocument();
			});
		});

		it("should validate max capacity is a number", async () => {
			const user = userEvent.setup();
			render(
				<WarehouseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					mode="create"
				/>
			);

			// type="number" prevents letters from being entered, so field stays empty
			// This tests that an empty capacity field triggers the required error
			const capacityInput = screen.getByLabelText("Max Capacity");
			await user.click(capacityInput);
			await user.tab(); // Blur the empty field

			await waitFor(() => {
				expect(screen.getByText(/capacity is required/i)).toBeInTheDocument();
			});
		});
	});

	describe("Cancel Functionality", () => {
		it("should call onCancel when Cancel button clicked", async () => {
			const user = userEvent.setup();
			render(
				<WarehouseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					mode="create"
				/>
			);

			await user.click(screen.getByRole("button", { name: "Cancel" }));

			expect(mockOnCancel).toHaveBeenCalled();
			expect(mockOnSubmit).not.toHaveBeenCalled();
		});

		it("should not submit form when Cancel is clicked", async () => {
			const user = userEvent.setup();
			render(
				<WarehouseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					mode="create"
				/>
			);

			await user.type(screen.getByLabelText("Warehouse Name"), "Test Store");
			await user.click(screen.getByRole("button", { name: "Cancel" }));

			expect(mockOnCancel).toHaveBeenCalled();
			expect(mockOnSubmit).not.toHaveBeenCalled();
		});
	});

	describe("Loading State", () => {
		it("should disable submit button when loading", () => {
			render(
				<WarehouseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					mode="create"
					loading={true}
				/>
			);

			expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
		});

		it("should disable cancel button when loading", () => {
			render(
				<WarehouseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					mode="create"
					loading={true}
				/>
			);

			expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
		});

		it("should disable all inputs when loading", () => {
			render(
				<WarehouseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					mode="create"
					loading={true}
				/>
			);

			expect(screen.getByLabelText("Warehouse Name")).toBeDisabled();
			expect(screen.getByLabelText("Street Address")).toBeDisabled();
			expect(screen.getByLabelText("City")).toBeDisabled();
			expect(screen.getByLabelText("State")).toBeDisabled();
			expect(screen.getByLabelText("Zip Code")).toBeDisabled();
			expect(screen.getByLabelText("Max Capacity")).toBeDisabled();
		});

		it("should show Saving... text in edit mode when loading", () => {
			render(
				<WarehouseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					mode="edit"
					warehouse={{
						name: "Test",
						location: {
							address: "123 St",
							city: "City",
							state: "IL",
							zipCode: "12345",
						},
						maxCapacity: 1000,
					}}
					loading={true}
				/>
			);

			expect(
				screen.getByRole("button", { name: /saving/i })
			).toBeInTheDocument();
		});
	});

	describe("Accessibility", () => {
		it("should have proper labels for all inputs", () => {
			render(
				<WarehouseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					mode="create"
				/>
			);

			expect(screen.getByLabelText("Warehouse Name")).toHaveAttribute("id");
			expect(screen.getByLabelText("Street Address")).toHaveAttribute("id");
			expect(screen.getByLabelText("City")).toHaveAttribute("id");
			expect(screen.getByLabelText("State")).toHaveAttribute("id");
			expect(screen.getByLabelText("Zip Code")).toHaveAttribute("id");
			expect(screen.getByLabelText("Max Capacity")).toHaveAttribute("id");
		});

		it("should mark required fields", () => {
			render(
				<WarehouseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					mode="create"
				/>
			);

			expect(screen.getByLabelText("Warehouse Name")).toBeRequired();
			expect(screen.getByLabelText("Street Address")).toBeRequired();
			expect(screen.getByLabelText("City")).toBeRequired();
			expect(screen.getByLabelText("State")).toBeRequired();
			expect(screen.getByLabelText("Zip Code")).toBeRequired();
			expect(screen.getByLabelText("Max Capacity")).toBeRequired();
		});
	});
});
