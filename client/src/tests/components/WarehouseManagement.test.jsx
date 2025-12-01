/**
 * Warehouse Management Component Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WarehouseManagement from "../../components/WarehouseManagement";
import { storeAPI } from "../../api/stores";

// Mock the stores API
vi.mock("../../api/stores", () => ({
	storeAPI: {
		getStores: vi.fn(),
		getStore: vi.fn(),
		createStore: vi.fn(),
		updateStore: vi.fn(),
		deleteStore: vi.fn(),
	},
}));

describe("WarehouseManagement Component", () => {
	const mockStores = [
		{
			_id: "store1",
			name: "Downtown TCG Store",
			location: {
				address: "123 Main St",
				city: "Springfield",
				state: "IL",
				zipCode: "62701",
			},
			fullAddress: "123 Main St, Springfield, IL 62701",
			maxCapacity: 1000,
			currentCapacity: 500,
			isActive: true,
		},
		{
			_id: "store2",
			name: "Westside TCG Store",
			location: {
				address: "456 Oak Ave",
				city: "Springfield",
				state: "IL",
				zipCode: "62702",
			},
			fullAddress: "456 Oak Ave, Springfield, IL 62702",
			maxCapacity: 1500,
			currentCapacity: 750,
			isActive: true,
		},
		{
			_id: "store3",
			name: "Northside TCG Store",
			location: {
				address: "789 Pine Rd",
				city: "Springfield",
				state: "IL",
				zipCode: "62703",
			},
			fullAddress: "789 Pine Rd, Springfield, IL 62703",
			maxCapacity: 2000,
			currentCapacity: 1000,
			isActive: true,
		},
	];

	const partnerUser = {
		_id: "user1",
		username: "partner1",
		role: "partner",
		fullName: "Partner User",
	};

	const managerUser = {
		_id: "user2",
		username: "manager1",
		role: "store-manager",
		fullName: "Manager User",
		assignedStoreId: "store1",
	};

	const employeeUser = {
		_id: "user3",
		username: "employee1",
		role: "employee",
		fullName: "Employee User",
		assignedStoreId: "store1",
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Access Control", () => {
		it("should redirect employees away from warehouse management", () => {
			const mockOnUnauthorized = vi.fn();

			render(
				<WarehouseManagement
					user={employeeUser}
					onUnauthorized={mockOnUnauthorized}
				/>
			);

			expect(mockOnUnauthorized).toHaveBeenCalled();
		});

		it("should allow partners to access warehouse management", () => {
			storeAPI.getStores.mockResolvedValue({
				success: true,
				stores: mockStores,
			});

			render(<WarehouseManagement user={partnerUser} />);

			expect(screen.getByText("Warehouse Management")).toBeInTheDocument();
		});

		it("should allow managers to access warehouse management", () => {
			storeAPI.getStores.mockResolvedValue({
				success: true,
				stores: mockStores,
			});

			render(<WarehouseManagement user={managerUser} />);

			expect(screen.getByText("Warehouse Management")).toBeInTheDocument();
		});
	});

	describe("Tab Navigation - Partner View", () => {
		beforeEach(() => {
			storeAPI.getStores.mockResolvedValue({
				success: true,
				stores: mockStores,
			});
		});

		it("should render tabs for all stores for partners", async () => {
			render(<WarehouseManagement user={partnerUser} />);

			await waitFor(() => {
				expect(screen.getByText("Downtown TCG Store")).toBeInTheDocument();
				expect(screen.getByText("Westside TCG Store")).toBeInTheDocument();
				expect(screen.getByText("Northside TCG Store")).toBeInTheDocument();
			});
		});

		it("should display first store by default", async () => {
			render(<WarehouseManagement user={partnerUser} />);

			await waitFor(() => {
				expect(
					screen.getByText("123 Main St, Springfield, IL 62701")
				).toBeInTheDocument();
			});
		});

		it("should switch to different store when tab clicked", async () => {
			const user = userEvent.setup();
			render(<WarehouseManagement user={partnerUser} />);

			await waitFor(() => {
				expect(screen.getByText("Downtown TCG Store")).toBeInTheDocument();
			});

			// Click on second tab
			await user.click(screen.getByText("Westside TCG Store"));

			await waitFor(() => {
				expect(
					screen.getByText("456 Oak Ave, Springfield, IL 62702")
				).toBeInTheDocument();
			});
		});

		it("should show Add Warehouse button for partners", async () => {
			render(<WarehouseManagement user={partnerUser} />);

			await waitFor(() => {
				expect(screen.getByText("Add Warehouse")).toBeInTheDocument();
			});
		});
	});

	describe("Tab Navigation - Manager View", () => {
		beforeEach(() => {
			storeAPI.getStores.mockResolvedValue({
				success: true,
				stores: mockStores,
			});
		});

		it("should only show assigned store tab for managers", async () => {
			render(<WarehouseManagement user={managerUser} />);

			await waitFor(() => {
				expect(screen.getByText("Downtown TCG Store")).toBeInTheDocument();
			});

			// Should NOT show other stores as tabs
			expect(screen.queryByText("Westside TCG Store")).not.toBeInTheDocument();
			expect(screen.queryByText("Northside TCG Store")).not.toBeInTheDocument();
		});

		it("should not show Add Warehouse button for managers", async () => {
			render(<WarehouseManagement user={managerUser} />);

			await waitFor(() => {
				expect(screen.queryByText("Add Warehouse")).not.toBeInTheDocument();
			});
		});
	});

	describe("Warehouse Details Display", () => {
		beforeEach(() => {
			storeAPI.getStores.mockResolvedValue({
				success: true,
				stores: mockStores,
			});
		});

		it("should display warehouse name", async () => {
			render(<WarehouseManagement user={partnerUser} />);

			await waitFor(() => {
				expect(
					screen.getByRole("heading", { name: "Downtown TCG Store" })
				).toBeInTheDocument();
			});
		});

		it("should display warehouse address", async () => {
			render(<WarehouseManagement user={partnerUser} />);

			await waitFor(() => {
				expect(
					screen.getByText("123 Main St, Springfield, IL 62701")
				).toBeInTheDocument();
			});
		});

		it("should display capacity information", async () => {
			render(<WarehouseManagement user={partnerUser} />);

			await waitFor(() => {
				expect(screen.getByText(/Current Capacity:/)).toBeInTheDocument();
				expect(screen.getByText(/500/)).toBeInTheDocument();
				expect(screen.getByText(/Max Capacity:/)).toBeInTheDocument();
				expect(screen.getByText(/1000/)).toBeInTheDocument();
			});
		});

		it("should display capacity percentage", async () => {
			render(<WarehouseManagement user={partnerUser} />);

			await waitFor(() => {
				expect(screen.getByText(/50%/)).toBeInTheDocument();
			});
		});

		it("should show capacity warning when >80%", async () => {
			const highCapacityStores = [
				{
					...mockStores[0],
					currentCapacity: 850,
					maxCapacity: 1000,
				},
			];

			storeAPI.getStores.mockResolvedValue({
				success: true,
				stores: highCapacityStores,
			});

			render(<WarehouseManagement user={partnerUser} />);

			await waitFor(() => {
				const warningElement = screen.getByText(/85%/);
				expect(warningElement).toHaveClass("text-warning");
			});
		});

		it("should show capacity danger when >90%", async () => {
			const criticalCapacityStores = [
				{
					...mockStores[0],
					currentCapacity: 950,
					maxCapacity: 1000,
				},
			];

			storeAPI.getStores.mockResolvedValue({
				success: true,
				stores: criticalCapacityStores,
			});

			render(<WarehouseManagement user={partnerUser} />);

			await waitFor(() => {
				const dangerElement = screen.getByText(/95%/);
				expect(dangerElement).toHaveClass("text-danger");
			});
		});
	});

	describe("Edit Warehouse - Partners", () => {
		beforeEach(() => {
			storeAPI.getStores.mockResolvedValue({
				success: true,
				stores: mockStores,
			});
		});

		it("should show Edit button for partners", async () => {
			render(<WarehouseManagement user={partnerUser} />);

			await waitFor(() => {
				expect(screen.getByText("Edit Warehouse")).toBeInTheDocument();
			});
		});

		it("should open edit form when Edit button clicked", async () => {
			const user = userEvent.setup();
			render(<WarehouseManagement user={partnerUser} />);

			await waitFor(() => {
				expect(screen.getByText("Edit Warehouse")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Edit Warehouse"));

			await waitFor(() => {
				expect(screen.getByRole("dialog")).toBeInTheDocument();
				expect(screen.getByLabelText("Warehouse Name")).toBeInTheDocument();
			});
		});

		it("should pre-fill form with current warehouse data", async () => {
			const user = userEvent.setup();
			render(<WarehouseManagement user={partnerUser} />);

			await waitFor(() => {
				expect(screen.getByText("Edit Warehouse")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Edit Warehouse"));

			await waitFor(() => {
				expect(screen.getByLabelText("Warehouse Name")).toHaveValue(
					"Downtown TCG Store"
				);
				expect(screen.getByLabelText("Address")).toHaveValue("123 Main St");
				expect(screen.getByLabelText("Max Capacity")).toHaveValue(1000);
			});
		});

		it("should submit updated warehouse data", async () => {
			const user = userEvent.setup();
			storeAPI.updateStore.mockResolvedValue({
				success: true,
				store: { ...mockStores[0], maxCapacity: 1200 },
			});

			render(<WarehouseManagement user={partnerUser} />);

			await waitFor(() => {
				expect(screen.getByText("Edit Warehouse")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Edit Warehouse"));

			await waitFor(() => {
				expect(screen.getByLabelText("Max Capacity")).toBeInTheDocument();
			});

			const capacityInput = screen.getByLabelText("Max Capacity");
			await user.clear(capacityInput);
			await user.type(capacityInput, "1200");

			await user.click(screen.getByRole("button", { name: "Save Changes" }));

			await waitFor(() => {
				expect(storeAPI.updateStore).toHaveBeenCalledWith("store1", {
					name: "Downtown TCG Store",
					location: {
						address: "123 Main St",
						city: "Springfield",
						state: "IL",
						zipCode: "62701",
					},
					maxCapacity: 1200,
				});
			});
		});
	});

	describe("Edit Warehouse - Managers", () => {
		beforeEach(() => {
			storeAPI.getStores.mockResolvedValue({
				success: true,
				stores: mockStores,
			});
		});

		it("should show Edit button for managers on their store", async () => {
			render(<WarehouseManagement user={managerUser} />);

			await waitFor(() => {
				expect(screen.getByText("Edit Warehouse")).toBeInTheDocument();
			});
		});

		it("should allow managers to edit their store", async () => {
			const user = userEvent.setup();
			storeAPI.updateStore.mockResolvedValue({
				success: true,
				store: { ...mockStores[0], maxCapacity: 1100 },
			});

			render(<WarehouseManagement user={managerUser} />);

			await waitFor(() => {
				expect(screen.getByText("Edit Warehouse")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Edit Warehouse"));

			const capacityInput = await screen.findByLabelText("Max Capacity");
			await user.clear(capacityInput);
			await user.type(capacityInput, "1100");

			await user.click(screen.getByRole("button", { name: "Save Changes" }));

			await waitFor(() => {
				expect(storeAPI.updateStore).toHaveBeenCalled();
			});
		});
	});

	describe("Delete Warehouse - Partners Only", () => {
		beforeEach(() => {
			storeAPI.getStores.mockResolvedValue({
				success: true,
				stores: mockStores,
			});
		});

		it("should show Delete button for partners", async () => {
			render(<WarehouseManagement user={partnerUser} />);

			await waitFor(() => {
				expect(screen.getByText("Delete Warehouse")).toBeInTheDocument();
			});
		});

		it("should not show Delete button for managers", async () => {
			render(<WarehouseManagement user={managerUser} />);

			await waitFor(() => {
				expect(screen.queryByText("Delete Warehouse")).not.toBeInTheDocument();
			});
		});

		it("should show confirmation dialog when Delete clicked", async () => {
			const user = userEvent.setup();
			render(<WarehouseManagement user={partnerUser} />);

			await waitFor(() => {
				expect(screen.getByText("Delete Warehouse")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Delete Warehouse"));

			await waitFor(() => {
				expect(screen.getByText(/Are you sure/)).toBeInTheDocument();
				expect(
					screen.getByRole("button", { name: "Confirm Delete" })
				).toBeInTheDocument();
				expect(
					screen.getByRole("button", { name: "Cancel" })
				).toBeInTheDocument();
			});
		});

		it("should cancel deletion when Cancel clicked", async () => {
			const user = userEvent.setup();
			render(<WarehouseManagement user={partnerUser} />);

			await waitFor(() => {
				expect(screen.getByText("Delete Warehouse")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Delete Warehouse"));
			await user.click(screen.getByRole("button", { name: "Cancel" }));

			await waitFor(() => {
				expect(screen.queryByText(/Are you sure/)).not.toBeInTheDocument();
			});

			expect(storeAPI.deleteStore).not.toHaveBeenCalled();
		});

		it("should delete warehouse when confirmed", async () => {
			const user = userEvent.setup();
			storeAPI.deleteStore.mockResolvedValue({
				success: true,
				message: "Store deleted successfully",
			});

			render(<WarehouseManagement user={partnerUser} />);

			await waitFor(() => {
				expect(screen.getByText("Delete Warehouse")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Delete Warehouse"));
			await user.click(screen.getByRole("button", { name: "Confirm Delete" }));

			await waitFor(() => {
				expect(storeAPI.deleteStore).toHaveBeenCalledWith("store1");
			});
		});

		it("should refresh store list after deletion", async () => {
			const user = userEvent.setup();
			storeAPI.deleteStore.mockResolvedValue({ success: true });
			storeAPI.getStores.mockResolvedValueOnce({
				success: true,
				stores: mockStores,
			});

			render(<WarehouseManagement user={partnerUser} />);

			await waitFor(() => {
				expect(screen.getByText("Delete Warehouse")).toBeInTheDocument();
			});

			// Mock updated stores list without deleted store
			storeAPI.getStores.mockResolvedValueOnce({
				success: true,
				stores: mockStores.slice(1),
			});

			await user.click(screen.getByText("Delete Warehouse"));
			await user.click(screen.getByRole("button", { name: "Confirm Delete" }));

			await waitFor(() => {
				expect(storeAPI.getStores).toHaveBeenCalledTimes(2);
			});
		});
	});

	describe("Add Warehouse - Partners Only", () => {
		beforeEach(() => {
			storeAPI.getStores.mockResolvedValue({
				success: true,
				stores: mockStores,
			});
		});

		it("should open create form when Add Warehouse clicked", async () => {
			const user = userEvent.setup();
			render(<WarehouseManagement user={partnerUser} />);

			await waitFor(() => {
				expect(screen.getByText("Add Warehouse")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Add Warehouse"));

			await waitFor(() => {
				expect(screen.getByRole("dialog")).toBeInTheDocument();
				expect(screen.getByLabelText("Warehouse Name")).toHaveValue("");
			});
		});

		it("should submit new warehouse data", async () => {
			const user = userEvent.setup();
			const newStore = {
				_id: "store4",
				name: "Eastside TCG Store",
				location: {
					address: "321 Elm St",
					city: "Springfield",
					state: "IL",
					zipCode: "62704",
				},
				maxCapacity: 1800,
				currentCapacity: 0,
			};

			storeAPI.createStore.mockResolvedValue({
				success: true,
				store: newStore,
			});

			render(<WarehouseManagement user={partnerUser} />);

			await waitFor(() => {
				expect(screen.getByText("Add Warehouse")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Add Warehouse"));

			await user.type(
				screen.getByLabelText("Warehouse Name"),
				"Eastside TCG Store"
			);
			await user.type(screen.getByLabelText("Address"), "321 Elm St");
			await user.type(screen.getByLabelText("City"), "Springfield");
			await user.type(screen.getByLabelText("State"), "IL");
			await user.type(screen.getByLabelText("Zip Code"), "62704");
			await user.type(screen.getByLabelText("Max Capacity"), "1800");

			await user.click(
				screen.getByRole("button", { name: "Create Warehouse" })
			);

			await waitFor(() => {
				expect(storeAPI.createStore).toHaveBeenCalledWith({
					name: "Eastside TCG Store",
					location: {
						address: "321 Elm St",
						city: "Springfield",
						state: "IL",
						zipCode: "62704",
					},
					maxCapacity: 1800,
				});
			});
		});
	});

	describe("Error Handling", () => {
		it("should display error message when stores fail to load", async () => {
			storeAPI.getStores.mockRejectedValue(new Error("Network error"));

			render(<WarehouseManagement user={partnerUser} />);

			await waitFor(() => {
				expect(screen.getByText(/error loading/i)).toBeInTheDocument();
			});
		});

		it("should display error when delete fails", async () => {
			const user = userEvent.setup();
			storeAPI.getStores.mockResolvedValue({
				success: true,
				stores: mockStores,
			});
			storeAPI.deleteStore.mockRejectedValue(
				new Error("Cannot delete store with assigned users")
			);

			render(<WarehouseManagement user={partnerUser} />);

			await waitFor(() => {
				expect(screen.getByText("Delete Warehouse")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Delete Warehouse"));
			await user.click(screen.getByRole("button", { name: "Confirm Delete" }));

			await waitFor(() => {
				expect(screen.getByText(/Cannot delete/i)).toBeInTheDocument();
			});
		});
	});

	describe("Loading States", () => {
		it("should show loading indicator while fetching stores", () => {
			storeAPI.getStores.mockImplementation(
				() => new Promise(() => {}) // Never resolves
			);

			render(<WarehouseManagement user={partnerUser} />);

			expect(screen.getByText(/Loading/i)).toBeInTheDocument();
		});

		it("should show loading state during form submission", async () => {
			const user = userEvent.setup();
			storeAPI.getStores.mockResolvedValue({
				success: true,
				stores: mockStores,
			});
			storeAPI.updateStore.mockImplementation(
				() => new Promise((resolve) => setTimeout(resolve, 100))
			);

			render(<WarehouseManagement user={partnerUser} />);

			await waitFor(() => {
				expect(screen.getByText("Edit Warehouse")).toBeInTheDocument();
			});

			await user.click(screen.getByText("Edit Warehouse"));
			await user.click(screen.getByRole("button", { name: "Save Changes" }));

			expect(screen.getByRole("button", { name: /Saving/i })).toBeDisabled();
		});
	});
});
