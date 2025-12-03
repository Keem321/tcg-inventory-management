/**
 * Dashboard Component Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dashboard from "../../components/Dashboard";
import { authAPI } from "../../api/auth";
import { storeAPI } from "../../api/stores";

// Mock the APIs
vi.mock("../../api/auth", () => ({
	authAPI: {
		logout: vi.fn(),
	},
}));

vi.mock("../../api/stores", () => ({
	storeAPI: {
		getStore: vi.fn(),
	},
}));

// Mock child components
vi.mock("../../components/StoreManagement", () => ({
	default: ({ onBack }) => (
		<div>
			<h2>Store Management Mock</h2>
			<button onClick={onBack}>Back</button>
		</div>
	),
}));

vi.mock("../../components/InventoryManagement", () => ({
	default: ({ onBack }) => (
		<div>
			<h2>Inventory Management Mock</h2>
			<button onClick={onBack}>Back</button>
		</div>
	),
}));

vi.mock("../../components/ProductManagement", () => ({
	default: ({ onBack }) => (
		<div>
			<h2>Product Management Mock</h2>
			<button onClick={onBack}>Back</button>
		</div>
	),
}));

describe("Dashboard Component", () => {
	const mockStore = {
		_id: "store1",
		name: "Downtown Store",
		address: "123 Main St",
		phoneNumber: "(555) 123-4567",
		capacity: 1000,
		currentOccupancy: 650,
	};

	const mockPartnerUser = {
		_id: "user1",
		username: "partner1",
		role: "partner",
		assignedStoreId: null,
	};

	const mockManagerUser = {
		_id: "user2",
		username: "manager1",
		role: "store-manager",
		assignedStoreId: "store1",
	};

	const mockEmployeeUser = {
		_id: "user3",
		username: "employee1",
		role: "employee",
		assignedStoreId: "store1",
	};

	const mockOnLogout = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		storeAPI.getStore.mockResolvedValue({ store: mockStore });
		authAPI.logout.mockResolvedValue({ success: true });
	});

	describe("Rendering", () => {
		it("should render dashboard title", async () => {
			render(<Dashboard user={mockPartnerUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				expect(screen.getByText("TCG Inventory Dashboard")).toBeInTheDocument();
			});
		});

		it("should display welcome message with username", async () => {
			render(<Dashboard user={mockPartnerUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				expect(screen.getByText(/Welcome, partner1!/i)).toBeInTheDocument();
			});
		});

		it("should display role badge", async () => {
			render(<Dashboard user={mockPartnerUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				expect(screen.getByText("Partner")).toBeInTheDocument();
			});
		});

		it("should render logout button", async () => {
			render(<Dashboard user={mockPartnerUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /logout/i })
				).toBeInTheDocument();
			});
		});
	});

	describe("Role Badges", () => {
		it("should display Partner badge for partner users", async () => {
			render(<Dashboard user={mockPartnerUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				const badge = screen.getByText("Partner");
				expect(badge).toBeInTheDocument();
			});
		});

		it("should display Store Manager badge for manager users", async () => {
			render(<Dashboard user={mockManagerUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				const badge = screen.getByText("Store Manager");
				expect(badge).toBeInTheDocument();
			});
		});

		it("should display Employee badge for employee users", async () => {
			render(<Dashboard user={mockEmployeeUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				const badge = screen.getByText("Employee");
				expect(badge).toBeInTheDocument();
			});
		});
	});

	describe("Store Information", () => {
		it("should fetch and display store info for users with assigned store", async () => {
			render(<Dashboard user={mockManagerUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				expect(storeAPI.getStore).toHaveBeenCalledWith("store1");
				expect(screen.getByText("Downtown Store")).toBeInTheDocument();
			});
		});

		it("should display store address", async () => {
			render(<Dashboard user={mockManagerUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				expect(screen.getByText(/123 Main St/i)).toBeInTheDocument();
			});
		});

		it("should display store phone number", async () => {
			render(<Dashboard user={mockManagerUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				expect(screen.getByText(/\(555\) 123-4567/i)).toBeInTheDocument();
			});
		});

		it("should not fetch store for users without assigned store", async () => {
			render(<Dashboard user={mockPartnerUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				expect(screen.getByText("TCG Inventory Dashboard")).toBeInTheDocument();
			});

			expect(storeAPI.getStore).not.toHaveBeenCalled();
		});

		it("should handle store fetch errors gracefully", async () => {
			const consoleError = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			storeAPI.getStore.mockRejectedValue(new Error("Store not found"));

			render(<Dashboard user={mockManagerUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				expect(consoleError).toHaveBeenCalled();
			});

			consoleError.mockRestore();
		});
	});

	describe("Navigation Buttons", () => {
		it("should show Manage Stores button for partners", async () => {
			render(<Dashboard user={mockPartnerUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /Manage Stores/i })
				).toBeInTheDocument();
			});
		});

		it("should show View Inventory button for all users", async () => {
			render(<Dashboard user={mockPartnerUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /View Inventory/i })
				).toBeInTheDocument();
			});
		});

		it("should show Manage Products button for partners only", async () => {
			render(<Dashboard user={mockPartnerUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /Manage Products/i })
				).toBeInTheDocument();
			});
		});

		it("should not show Manage Stores for non-partners", async () => {
			render(<Dashboard user={mockEmployeeUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				expect(screen.getByText("TCG Inventory Dashboard")).toBeInTheDocument();
			});

			expect(
				screen.queryByRole("button", { name: /Manage Stores/i })
			).not.toBeInTheDocument();
		});

		it("should not show Manage Products for non-partners", async () => {
			render(<Dashboard user={mockEmployeeUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				expect(screen.getByText("TCG Inventory Dashboard")).toBeInTheDocument();
			});

			expect(
				screen.queryByRole("button", { name: /Manage Products/i })
			).not.toBeInTheDocument();
		});
	});

	describe("View Navigation", () => {
		it("should navigate to Store Management when button clicked", async () => {
			const user = userEvent.setup();
			render(<Dashboard user={mockPartnerUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /Manage Stores/i })
				).toBeInTheDocument();
			});

			const storesButton = screen.getByRole("button", {
				name: /Manage Stores/i,
			});
			await user.click(storesButton);

			await waitFor(() => {
				expect(screen.getByText("Store Management Mock")).toBeInTheDocument();
			});
		});

		it("should navigate to Inventory Management when button clicked", async () => {
			const user = userEvent.setup();
			render(<Dashboard user={mockPartnerUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /View Inventory/i })
				).toBeInTheDocument();
			});

			const inventoryButton = screen.getByRole("button", {
				name: /View Inventory/i,
			});
			await user.click(inventoryButton);

			await waitFor(() => {
				expect(
					screen.getByText("Inventory Management Mock")
				).toBeInTheDocument();
			});
		});

		it("should navigate to Product Management when button clicked", async () => {
			const user = userEvent.setup();
			render(<Dashboard user={mockPartnerUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /Manage Products/i })
				).toBeInTheDocument();
			});

			const productsButton = screen.getByRole("button", {
				name: /Manage Products/i,
			});
			await user.click(productsButton);

			await waitFor(() => {
				expect(screen.getByText("Product Management Mock")).toBeInTheDocument();
			});
		});

		it("should return to dashboard when back button clicked", async () => {
			const user = userEvent.setup();
			render(<Dashboard user={mockPartnerUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /Manage Stores/i })
				).toBeInTheDocument();
			});

			const storesButton = screen.getByRole("button", {
				name: /Manage Stores/i,
			});
			await user.click(storesButton);

			await waitFor(() => {
				expect(screen.getByText("Store Management Mock")).toBeInTheDocument();
			});

			const backButton = screen.getByRole("button", { name: /Back/i });
			await user.click(backButton);

			await waitFor(() => {
				expect(screen.getByText("TCG Inventory Dashboard")).toBeInTheDocument();
			});
		});
	});

	describe("Logout Functionality", () => {
		it("should call logout API when logout button clicked", async () => {
			const user = userEvent.setup();
			render(<Dashboard user={mockPartnerUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /logout/i })
				).toBeInTheDocument();
			});

			const logoutButton = screen.getByRole("button", { name: /logout/i });
			await user.click(logoutButton);

			await waitFor(() => {
				expect(authAPI.logout).toHaveBeenCalledTimes(1);
			});
		});

		it("should call onLogout callback after successful logout", async () => {
			const user = userEvent.setup();
			render(<Dashboard user={mockPartnerUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /logout/i })
				).toBeInTheDocument();
			});

			const logoutButton = screen.getByRole("button", { name: /logout/i });
			await user.click(logoutButton);

			await waitFor(() => {
				expect(mockOnLogout).toHaveBeenCalledTimes(1);
			});
		});

		it("should handle logout errors gracefully", async () => {
			const consoleError = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			authAPI.logout.mockRejectedValue(new Error("Logout failed"));
			const user = userEvent.setup();

			render(<Dashboard user={mockPartnerUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /logout/i })
				).toBeInTheDocument();
			});

			const logoutButton = screen.getByRole("button", { name: /logout/i });
			await user.click(logoutButton);

			await waitFor(() => {
				expect(consoleError).toHaveBeenCalled();
			});

			consoleError.mockRestore();
		});
	});

	describe("Feature Descriptions", () => {
		it("should display store management description for partners", async () => {
			render(<Dashboard user={mockPartnerUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				expect(
					screen.getByText(/Create and manage store locations/i)
				).toBeInTheDocument();
			});
		});

		it("should display inventory description for all users", async () => {
			render(<Dashboard user={mockPartnerUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				expect(
					screen.getByText(/View and manage inventory across stores/i)
				).toBeInTheDocument();
			});
		});

		it("should display product catalog description for partners", async () => {
			render(<Dashboard user={mockPartnerUser} onLogout={mockOnLogout} />);

			await waitFor(() => {
				expect(screen.getByText(/Manage product catalog/i)).toBeInTheDocument();
			});
		});
	});
});
