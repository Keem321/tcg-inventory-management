/**
 * Product Management Component Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductManagement from "../../components/ProductManagement";
import { productAPI } from "../../api/products";

// Mock the products API
vi.mock("../../api/products", () => ({
	productAPI: {
		getProducts: vi.fn(),
		getProduct: vi.fn(),
		createProduct: vi.fn(),
		updateProduct: vi.fn(),
		deleteProduct: vi.fn(),
	},
}));

describe("ProductManagement Component", () => {
	const mockProducts = [
		{
			_id: "product1",
			sku: "DECK-001",
			productType: "deck",
			name: "Commander Deck",
			description: "Pre-constructed Commander deck",
			brand: "Wizards of the Coast",
			unitSize: 100,
			basePrice: 39.99,
			isActive: true,
		},
		{
			_id: "product2",
			sku: "SLEEVES-001",
			productType: "sleeves",
			name: "Dragon Shield Sleeves",
			brand: "Dragon Shield",
			unitSize: 100,
			basePrice: 9.99,
			isActive: true,
		},
		{
			_id: "product3",
			sku: "MTG-LTR-001",
			productType: "singleCard",
			name: "The One Ring",
			brand: "Wizards of the Coast",
			cardDetails: {
				set: "Lord of the Rings",
				cardNumber: "246",
				rarity: "mythic",
				condition: "near-mint",
				finish: "non-foil",
			},
			unitSize: 0,
			basePrice: 89.99,
			isActive: true,
		},
	];

	const mockProductDetails = {
		product: mockProducts[0],
		inventory: {
			totalQuantity: 25,
			stores: [
				{
					storeId: "store1",
					storeName: "Downtown Store",
					floor: 10,
					back: 5,
					total: 15,
				},
				{
					storeId: "store2",
					storeName: "Westside Store",
					floor: 5,
					back: 5,
					total: 10,
				},
			],
		},
	};

	const mockOnBack = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		productAPI.getProducts.mockResolvedValue({ products: mockProducts });
	});

	describe("Rendering", () => {
		it("should render product management title", async () => {
			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("Product Management")).toBeInTheDocument();
			});
		});

		it("should render description text", async () => {
			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(
					screen.getByText(/Manage product catalog and view inventory/i)
				).toBeInTheDocument();
			});
		});

		it("should render back button", async () => {
			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /Back to Dashboard/i })
				).toBeInTheDocument();
			});
		});

		it("should call onBack when back button is clicked", async () => {
			const user = userEvent.setup();
			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("Product Management")).toBeInTheDocument();
			});

			const backButton = screen.getByRole("button", {
				name: /Back to Dashboard/i,
			});
			await user.click(backButton);

			expect(mockOnBack).toHaveBeenCalledTimes(1);
		});

		it("should show loading state initially", () => {
			render(<ProductManagement onBack={mockOnBack} />);

			expect(screen.getByText("Loading...")).toBeInTheDocument();
		});
	});

	describe("Filter Controls", () => {
		it("should render product type filter", async () => {
			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByLabelText("Product Type")).toBeInTheDocument();
			});
		});

		it("should render brand filter", async () => {
			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByLabelText("Brand")).toBeInTheDocument();
			});
		});

		it("should render search input", async () => {
			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(
					screen.getByPlaceholderText("Search products...")
				).toBeInTheDocument();
			});
		});

		it("should render show inactive checkbox", async () => {
			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByLabelText("Show Inactive")).toBeInTheDocument();
			});
		});

		it("should update search term on input", async () => {
			const user = userEvent.setup();
			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(
					screen.getByPlaceholderText("Search products...")
				).toBeInTheDocument();
			});

			const searchInput = screen.getByPlaceholderText("Search products...");
			await user.type(searchInput, "Ring");

			expect(searchInput).toHaveValue("Ring");
		});
	});

	describe("Product List Display", () => {
		it("should display all products in table", async () => {
			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("DECK-001")).toBeInTheDocument();
				expect(screen.getByText("Commander Deck")).toBeInTheDocument();
				expect(screen.getByText("Dragon Shield Sleeves")).toBeInTheDocument();
				expect(screen.getByText("The One Ring")).toBeInTheDocument();
			});
		});

		it("should display product SKUs", async () => {
			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("DECK-001")).toBeInTheDocument();
				expect(screen.getByText("SLEEVES-001")).toBeInTheDocument();
				expect(screen.getByText("MTG-LTR-001")).toBeInTheDocument();
			});
		});

		it("should display product prices", async () => {
			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("$39.99")).toBeInTheDocument();
				expect(screen.getByText("$9.99")).toBeInTheDocument();
				expect(screen.getByText("$89.99")).toBeInTheDocument();
			});
		});

		it("should display active status badges", async () => {
			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				const activeBadges = screen.getAllByText("Active");
				expect(activeBadges.length).toBeGreaterThan(0);
			});
		});

		it("should display card details for single cards", async () => {
			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText(/Lord of the Rings/i)).toBeInTheDocument();
				expect(screen.getByText(/#246/i)).toBeInTheDocument();
			});
		});

		it("should display formatted product types", async () => {
			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("Deck")).toBeInTheDocument();
				expect(screen.getByText("Sleeves")).toBeInTheDocument();
				expect(screen.getByText("Single Card")).toBeInTheDocument();
			});
		});

		it("should show message when no products found", async () => {
			productAPI.getProducts.mockResolvedValue({ products: [] });
			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("No products found")).toBeInTheDocument();
			});
		});
	});

	describe("Product Expansion", () => {
		it("should show expand/collapse buttons for each product", async () => {
			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				const expandButtons = screen.getAllByText("▶");
				expect(expandButtons.length).toBe(3);
			});
		});

		it("should expand product when expand button clicked", async () => {
			const user = userEvent.setup();
			productAPI.getProduct.mockResolvedValue(mockProductDetails);

			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("Commander Deck")).toBeInTheDocument();
			});

			const expandButtons = screen.getAllByText("▶");
			await user.click(expandButtons[0]);

			await waitFor(() => {
				expect(screen.getByText("▼")).toBeInTheDocument();
			});

			expect(productAPI.getProduct).toHaveBeenCalledWith("product1");
		});

		it("should display product details when expanded", async () => {
			const user = userEvent.setup();
			productAPI.getProduct.mockResolvedValue(mockProductDetails);

			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("Commander Deck")).toBeInTheDocument();
			});

			const expandButtons = screen.getAllByText("▶");
			await user.click(expandButtons[0]);

			await waitFor(() => {
				expect(screen.getByText("Product Details")).toBeInTheDocument();
				expect(screen.getByText("Inventory Across System")).toBeInTheDocument();
			});
		});

		it("should display inventory breakdown when expanded", async () => {
			const user = userEvent.setup();
			productAPI.getProduct.mockResolvedValue(mockProductDetails);

			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("Commander Deck")).toBeInTheDocument();
			});

			const expandButtons = screen.getAllByText("▶");
			await user.click(expandButtons[0]);

			await waitFor(() => {
				expect(screen.getByText("Total Quantity:")).toBeInTheDocument();
				expect(screen.getByText("25")).toBeInTheDocument();
				expect(screen.getByText("Downtown Store")).toBeInTheDocument();
				expect(screen.getByText("Westside Store")).toBeInTheDocument();
			});
		});

		it("should collapse product when clicked again", async () => {
			const user = userEvent.setup();
			productAPI.getProduct.mockResolvedValue(mockProductDetails);

			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("Commander Deck")).toBeInTheDocument();
			});

			const expandButtons = screen.getAllByText("▶");
			await user.click(expandButtons[0]);

			await waitFor(() => {
				expect(screen.getByText("▼")).toBeInTheDocument();
			});

			const collapseButton = screen.getByText("▼");
			await user.click(collapseButton);

			await waitFor(() => {
				expect(screen.queryByText("Product Details")).not.toBeInTheDocument();
			});
		});
	});

	describe("Product Deletion", () => {
		it("should render delete button for each product", async () => {
			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
				expect(deleteButtons.length).toBe(3);
			});
		});

		it("should show confirmation dialog when delete clicked", async () => {
			const user = userEvent.setup();
			const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("Commander Deck")).toBeInTheDocument();
			});

			const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
			await user.click(deleteButtons[0]);

			expect(confirmSpy).toHaveBeenCalledWith(
				"Are you sure you want to delete this product?"
			);

			confirmSpy.mockRestore();
		});

		it("should delete product when confirmed", async () => {
			const user = userEvent.setup();
			const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
			productAPI.deleteProduct.mockResolvedValue({ success: true });

			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("Commander Deck")).toBeInTheDocument();
			});

			const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
			await user.click(deleteButtons[0]);

			await waitFor(() => {
				expect(productAPI.deleteProduct).toHaveBeenCalledWith("product1");
				expect(productAPI.getProducts).toHaveBeenCalledTimes(2); // Initial + reload
			});

			confirmSpy.mockRestore();
		});

		it("should not delete product when cancelled", async () => {
			const user = userEvent.setup();
			const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("Commander Deck")).toBeInTheDocument();
			});

			const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
			await user.click(deleteButtons[0]);

			expect(productAPI.deleteProduct).not.toHaveBeenCalled();

			confirmSpy.mockRestore();
		});
	});

	describe("Error Handling", () => {
		it("should display error message on API failure", async () => {
			productAPI.getProducts.mockRejectedValue(
				new Error("Failed to fetch products")
			);

			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(
					screen.getByText("Failed to fetch products")
				).toBeInTheDocument();
			});
		});

		it("should display error from API response", async () => {
			productAPI.getProducts.mockRejectedValue({
				response: { data: { message: "Server error" } },
			});

			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("Server error")).toBeInTheDocument();
			});
		});

		it("should allow dismissing error alert", async () => {
			const user = userEvent.setup();
			productAPI.getProducts.mockRejectedValue(new Error("Test error"));

			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByText("Test error")).toBeInTheDocument();
			});

			const closeButton = screen.getByRole("button", { name: /close/i });
			await user.click(closeButton);

			expect(screen.queryByText("Test error")).not.toBeInTheDocument();
		});
	});

	describe("API Integration", () => {
		it("should call getProducts on mount", async () => {
			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(productAPI.getProducts).toHaveBeenCalledTimes(1);
			});
		});

		it("should pass filters to getProducts", async () => {
			const user = userEvent.setup();
			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(screen.getByLabelText("Product Type")).toBeInTheDocument();
			});

			const typeFilter = screen.getByLabelText("Product Type");
			await user.selectOptions(typeFilter, "deck");

			await waitFor(() => {
				expect(productAPI.getProducts).toHaveBeenCalledWith(
					expect.objectContaining({ productType: "deck" })
				);
			});
		});

		it("should handle search filter", async () => {
			const user = userEvent.setup();
			render(<ProductManagement onBack={mockOnBack} />);

			await waitFor(() => {
				expect(
					screen.getByPlaceholderText("Search products...")
				).toBeInTheDocument();
			});

			const searchInput = screen.getByPlaceholderText("Search products...");
			await user.type(searchInput, "Ring");

			await waitFor(() => {
				expect(productAPI.getProducts).toHaveBeenCalledWith(
					expect.objectContaining({ search: "Ring" })
				);
			});
		});
	});
});
