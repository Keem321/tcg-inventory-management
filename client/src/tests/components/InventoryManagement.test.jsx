/**
 * Inventory Management Component Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InventoryManagement from "../../components/InventoryManagement";
import { inventoryAPI } from "../../api/inventory";
import { storeAPI } from "../../api/stores";

// Mock the APIs
vi.mock("../../api/inventory", () => ({
	inventoryAPI: {
		getAllInventory: vi.fn(),
		getStoreInventory: vi.fn(),
	},
}));

vi.mock("../../api/stores", () => ({
	storeAPI: {
		getStores: vi.fn(),
	},
}));

describe("InventoryManagement Component", () => {
	const mockStores = [
		{
			_id: "store1",
			name: "Downtown Store",
			address: "123 Main St",
		},
		{
			_id: "store2",
			name: "Westside Store",
			address: "456 West Ave",
		},
	];

	const mockInventory = [
		{
			_id: "inv1",
			product: {
				_id: "product1",
				sku: "DECK-001",
				name: "Commander Deck",
				productType: "deck",
			},
			store: {
				_id: "store1",
				name: "Downtown Store",
			},
			floorQuantity: 10,
			backQuantity: 5,
			location: "floor",
			isActive: true,
		},
		{
			_id: "inv2",
			product: {
				_id: "product2",
				sku: "SLEEVES-001",
				name: "Dragon Shield Sleeves",
				productType: "sleeves",
			},
			store: {
				_id: "store1",
				name: "Downtown Store",
			},
			floorQuantity: 20,
			backQuantity: 10,
			location: "back",
			isActive: true,
		},
	];

	const mockUser = {
		role: "partner",
		storeId: null,
	};

	const mockOnBack = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		storeAPI.getStores.mockResolvedValue({ stores: mockStores });
		inventoryAPI.getAllInventory.mockResolvedValue({
			inventory: mockInventory,
		});
		inventoryAPI.getStoreInventory.mockResolvedValue({
			inventory: mockInventory,
		});
	});

	describe("Rendering", () => {
		it("should render inventory management title", async () => {
			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("Inventory Management")).toBeInTheDocument();
			});
		});

		it("should render description text", async () => {
			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(
					screen.getByText(/View and manage inventory across stores/i)
				).toBeInTheDocument();
			});
		});

		it("should render back button", async () => {
			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /Back to Dashboard/i })
				).toBeInTheDocument();
			});
		});

		it("should call onBack when back button is clicked", async () => {
			const user = userEvent.setup();
			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("Inventory Management")).toBeInTheDocument();
			});

			const backButton = screen.getByRole("button", {
				name: /Back to Dashboard/i,
			});
			await user.click(backButton);

			expect(mockOnBack).toHaveBeenCalledTimes(1);
		});

		it("should show loading state initially", () => {
			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			expect(screen.getByText("Loading...")).toBeInTheDocument();
		});
	});

	describe("Role-Based Store Selection", () => {
		it("should show store selector for partner users", async () => {
			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByLabelText("Store")).toBeInTheDocument();
			});
		});

		it("should populate store selector with all stores for partners", async () => {
			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				const storeSelect = screen.getByLabelText("Store");
				expect(storeSelect).toBeInTheDocument();
			});

			// Check for "All Stores" option
			expect(screen.getByText("All Stores")).toBeInTheDocument();
			expect(screen.getByText("Downtown Store")).toBeInTheDocument();
			expect(screen.getByText("Westside Store")).toBeInTheDocument();
		});

		it("should not show store selector for non-partner users", async () => {
			const employeeUser = {
				role: "employee",
				storeId: "store1",
			};

			render(<InventoryManagement user={employeeUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.queryByLabelText("Store")).not.toBeInTheDocument();
			});
		});

		it("should display assigned store for non-partner users", async () => {
			const employeeUser = {
				role: "employee",
				storeId: "store1",
			};

			render(<InventoryManagement user={employeeUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("Inventory Management")).toBeInTheDocument();
			});
		});

		it("should call getAllInventory when partner selects All Stores", async () => {
			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(inventoryAPI.getAllInventory).toHaveBeenCalled();
			});
		});

		it("should call getStoreInventory when partner selects a store", async () => {
			const user = userEvent.setup();
			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByLabelText("Store")).toBeInTheDocument();
			});

			const storeSelect = screen.getByLabelText("Store");
			await user.selectOptions(storeSelect, "store1");

			await waitFor(() => {
				expect(inventoryAPI.getStoreInventory).toHaveBeenCalledWith(
					"store1",
					{}
				);
			});
		});

		it("should call getStoreInventory for non-partner users", async () => {
			const employeeUser = {
				role: "employee",
				storeId: "store1",
			};

			render(<InventoryManagement user={employeeUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(inventoryAPI.getStoreInventory).toHaveBeenCalledWith(
					"store1",
					expect.any(Object)
				);
			});
		});
	});

	describe("Filter Controls", () => {
		it("should render location filter", async () => {
			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByLabelText("Location")).toBeInTheDocument();
			});
		});

		it("should have all location options", async () => {
			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("All Locations")).toBeInTheDocument();
				expect(screen.getByText("Floor")).toBeInTheDocument();
				expect(screen.getByText("Back")).toBeInTheDocument();
			});
		});

		it("should render search input", async () => {
			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
			});
		});

		it("should update search term on input", async () => {
			const user = userEvent.setup();
			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
			});

			const searchInput = screen.getByPlaceholderText("Search...");
			await user.type(searchInput, "Deck");

			expect(searchInput).toHaveValue("Deck");
		});

		it("should filter inventory by location", async () => {
			const user = userEvent.setup();
			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("Commander Deck")).toBeInTheDocument();
				expect(screen.getByText("Dragon Shield Sleeves")).toBeInTheDocument();
			});

			const locationFilter = screen.getByLabelText("Location");
			await user.selectOptions(locationFilter, "floor");

			await waitFor(() => {
				expect(inventoryAPI.getAllInventory).toHaveBeenCalledWith(
					expect.objectContaining({ location: "floor" })
				);
			});
		});
	});

	describe("Inventory Display", () => {
		it("should display inventory items in table", async () => {
			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("DECK-001")).toBeInTheDocument();
				expect(screen.getByText("Commander Deck")).toBeInTheDocument();
				expect(screen.getByText("SLEEVES-001")).toBeInTheDocument();
				expect(screen.getByText("Dragon Shield Sleeves")).toBeInTheDocument();
			});
		});

		it("should display product SKUs", async () => {
			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("DECK-001")).toBeInTheDocument();
				expect(screen.getByText("SLEEVES-001")).toBeInTheDocument();
			});
		});

		it("should display store names", async () => {
			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				const storeNames = screen.getAllByText("Downtown Store");
				expect(storeNames.length).toBeGreaterThan(0);
			});
		});

		it("should display floor and back quantities", async () => {
			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("10")).toBeInTheDocument();
				expect(screen.getByText("5")).toBeInTheDocument();
				expect(screen.getByText("20")).toBeInTheDocument();
			});
		});

		it("should display total quantity", async () => {
			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("15")).toBeInTheDocument(); // 10 + 5
				expect(screen.getByText("30")).toBeInTheDocument(); // 20 + 10
			});
		});

		it("should display location badges", async () => {
			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("Floor")).toBeInTheDocument();
				expect(screen.getByText("Back")).toBeInTheDocument();
			});
		});

		it("should show message when no inventory found", async () => {
			inventoryAPI.getAllInventory.mockResolvedValue({ inventory: [] });

			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("No inventory found")).toBeInTheDocument();
			});
		});

		it("should display active status", async () => {
			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				const activeBadges = screen.getAllByText("Active");
				expect(activeBadges.length).toBeGreaterThan(0);
			});
		});
	});

	describe("Search Functionality", () => {
		it("should filter inventory by search term", async () => {
			const user = userEvent.setup();
			const filteredInventory = [mockInventory[0]];
			inventoryAPI.getAllInventory.mockResolvedValue({
				inventory: filteredInventory,
			});

			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
			});

			const searchInput = screen.getByPlaceholderText("Search...");
			await user.type(searchInput, "Commander");

			await waitFor(() => {
				expect(screen.getByText("Commander Deck")).toBeInTheDocument();
				expect(
					screen.queryByText("Dragon Shield Sleeves")
				).not.toBeInTheDocument();
			});
		});

		it("should search across product name and SKU", async () => {
			const user = userEvent.setup();
			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
			});

			const searchInput = screen.getByPlaceholderText("Search...");
			await user.type(searchInput, "DECK-001");

			expect(searchInput).toHaveValue("DECK-001");
		});
	});

	describe("Error Handling", () => {
		it("should display error message on API failure", async () => {
			inventoryAPI.getAllInventory.mockRejectedValue(
				new Error("Failed to fetch inventory")
			);

			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(
					screen.getByText("Failed to fetch inventory")
				).toBeInTheDocument();
			});
		});

		it("should display error from API response", async () => {
			inventoryAPI.getAllInventory.mockRejectedValue({
				response: { data: { message: "Server error" } },
			});

			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("Server error")).toBeInTheDocument();
			});
		});

		it("should allow dismissing error alert", async () => {
			const user = userEvent.setup();
			inventoryAPI.getAllInventory.mockRejectedValue(new Error("Test error"));

			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("Test error")).toBeInTheDocument();
			});

			const closeButton = screen.getByRole("button", { name: /close/i });
			await user.click(closeButton);

			expect(screen.queryByText("Test error")).not.toBeInTheDocument();
		});

		it("should handle store fetch error for partners", async () => {
			storeAPI.getStores.mockRejectedValue(new Error("Store fetch failed"));

			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("Store fetch failed")).toBeInTheDocument();
			});
		});
	});

	describe("API Integration", () => {
		it("should call getAllInventory on mount for partners", async () => {
			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(inventoryAPI.getAllInventory).toHaveBeenCalledTimes(1);
			});
		});

		it("should call getStoreInventory on mount for employees", async () => {
			const employeeUser = {
				role: "employee",
				storeId: "store1",
			};

			render(<InventoryManagement user={employeeUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(inventoryAPI.getStoreInventory).toHaveBeenCalledWith(
					"store1",
					expect.any(Object)
				);
			});
		});

		it("should call getStores for partner users", async () => {
			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(storeAPI.getStores).toHaveBeenCalled();
			});
		});

		it("should not call getStores for non-partner users", async () => {
			const employeeUser = {
				role: "employee",
				storeId: "store1",
			};

			render(<InventoryManagement user={employeeUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(inventoryAPI.getStoreInventory).toHaveBeenCalled();
			});

			expect(storeAPI.getStores).not.toHaveBeenCalled();
		});

		it("should pass location filter to API", async () => {
			const user = userEvent.setup();
			render(<InventoryManagement user={mockUser} onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByLabelText("Location")).toBeInTheDocument();
			});

			const locationFilter = screen.getByLabelText("Location");
			await user.selectOptions(locationFilter, "back");

			await waitFor(() => {
				expect(inventoryAPI.getAllInventory).toHaveBeenCalledWith(
					expect.objectContaining({ location: "back" })
				);
			});
		});
	});
});
