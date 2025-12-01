import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "../../components/Login";
import { authAPI } from "../../api/auth";

// Mock the auth API
vi.mock("../../api/auth", () => ({
	authAPI: {
		login: vi.fn(),
	},
}));

describe("Login Component", () => {
	const mockOnLoginSuccess = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Rendering", () => {
		it("should render login form", () => {
			render(<Login onLoginSuccess={mockOnLoginSuccess} />);

			expect(screen.getByText("TCG Inventory Login")).toBeInTheDocument();
			expect(screen.getByLabelText("Username")).toBeInTheDocument();
			expect(screen.getByLabelText("Password")).toBeInTheDocument();
			expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
		});

		it("should render test credentials hint", () => {
			render(<Login onLoginSuccess={mockOnLoginSuccess} />);

			expect(screen.getByText("Test credentials:")).toBeInTheDocument();
			expect(screen.getByText(/partner/i)).toBeInTheDocument();
			expect(screen.getByText(/password123/i)).toBeInTheDocument();
		});

		it("should have empty input fields initially", () => {
			render(<Login onLoginSuccess={mockOnLoginSuccess} />);

			const usernameInput = screen.getByLabelText("Username");
			const passwordInput = screen.getByLabelText("Password");

			expect(usernameInput).toHaveValue("");
			expect(passwordInput).toHaveValue("");
		});

		it("should not show error message initially", () => {
			render(<Login onLoginSuccess={mockOnLoginSuccess} />);

			const alertElement = screen.queryByRole("alert");
			expect(alertElement).not.toBeInTheDocument();
		});
	});

	describe("Form Input", () => {
		it("should update username field on user input", async () => {
			const user = userEvent.setup();
			render(<Login onLoginSuccess={mockOnLoginSuccess} />);

			const usernameInput = screen.getByLabelText("Username");
			await user.type(usernameInput, "testuser");

			expect(usernameInput).toHaveValue("testuser");
		});

		it("should update password field on user input", async () => {
			const user = userEvent.setup();
			render(<Login onLoginSuccess={mockOnLoginSuccess} />);

			const passwordInput = screen.getByLabelText("Password");
			await user.type(passwordInput, "testpass123");

			expect(passwordInput).toHaveValue("testpass123");
		});

		it("should mask password input", () => {
			render(<Login onLoginSuccess={mockOnLoginSuccess} />);

			const passwordInput = screen.getByLabelText("Password");
			expect(passwordInput).toHaveAttribute("type", "password");
		});

		it("should require username input", () => {
			render(<Login onLoginSuccess={mockOnLoginSuccess} />);

			const usernameInput = screen.getByLabelText("Username");
			expect(usernameInput).toBeRequired();
		});

		it("should require password input", () => {
			render(<Login onLoginSuccess={mockOnLoginSuccess} />);

			const passwordInput = screen.getByLabelText("Password");
			expect(passwordInput).toBeRequired();
		});
	});

	describe("Form Submission - Success", () => {
		it("should call authAPI.login with correct credentials", async () => {
			const user = userEvent.setup();
			authAPI.login.mockResolvedValue({
				success: true,
				user: { id: 1, username: "testuser", role: "employee" },
			});

			render(<Login onLoginSuccess={mockOnLoginSuccess} />);

			await user.type(screen.getByLabelText("Username"), "testuser");
			await user.type(screen.getByLabelText("Password"), "password123");
			await user.click(screen.getByRole("button", { name: "Login" }));

			expect(authAPI.login).toHaveBeenCalledWith("testuser", "password123");
		});

		it("should call onLoginSuccess with user data on successful login", async () => {
			const user = userEvent.setup();
			const mockUserData = {
				id: 1,
				username: "testuser",
				role: "employee",
			};
			authAPI.login.mockResolvedValue({
				success: true,
				user: mockUserData,
			});

			render(<Login onLoginSuccess={mockOnLoginSuccess} />);

			await user.type(screen.getByLabelText("Username"), "testuser");
			await user.type(screen.getByLabelText("Password"), "password123");
			await user.click(screen.getByRole("button", { name: "Login" }));

			await waitFor(() => {
				expect(mockOnLoginSuccess).toHaveBeenCalledWith(mockUserData);
			});
		});

		it("should show loading state during login", async () => {
			const user = userEvent.setup();
			authAPI.login.mockImplementation(
				() => new Promise((resolve) => setTimeout(resolve, 100))
			);

			render(<Login onLoginSuccess={mockOnLoginSuccess} />);

			await user.type(screen.getByLabelText("Username"), "testuser");
			await user.type(screen.getByLabelText("Password"), "password123");
			await user.click(screen.getByRole("button", { name: "Login" }));

			expect(screen.getByRole("button", { name: "Logging in..." })).toBeInTheDocument();
			expect(screen.getByRole("button", { name: "Logging in..." })).toBeDisabled();
		});

		it("should disable inputs during login", async () => {
			const user = userEvent.setup();
			authAPI.login.mockImplementation(
				() => new Promise((resolve) => setTimeout(resolve, 100))
			);

			render(<Login onLoginSuccess={mockOnLoginSuccess} />);

			await user.type(screen.getByLabelText("Username"), "testuser");
			await user.type(screen.getByLabelText("Password"), "password123");
			await user.click(screen.getByRole("button", { name: "Login" }));

			expect(screen.getByLabelText("Username")).toBeDisabled();
			expect(screen.getByLabelText("Password")).toBeDisabled();
		});
	});

	describe("Form Submission - Failure", () => {
		it("should display error message on failed login", async () => {
			const user = userEvent.setup();
			authAPI.login.mockResolvedValue({
				success: false,
				message: "Invalid credentials",
			});

			render(<Login onLoginSuccess={mockOnLoginSuccess} />);

			await user.type(screen.getByLabelText("Username"), "wronguser");
			await user.type(screen.getByLabelText("Password"), "wrongpass");
			await user.click(screen.getByRole("button", { name: "Login" }));

			await waitFor(() => {
				expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
			});

			expect(mockOnLoginSuccess).not.toHaveBeenCalled();
		});

		it("should display generic error message on network error", async () => {
			const user = userEvent.setup();
			authAPI.login.mockRejectedValue(new Error("Network error"));

			render(<Login onLoginSuccess={mockOnLoginSuccess} />);

			await user.type(screen.getByLabelText("Username"), "testuser");
			await user.type(screen.getByLabelText("Password"), "password123");
			await user.click(screen.getByRole("button", { name: "Login" }));

			await waitFor(() => {
				expect(
					screen.getByText(
						"An error occurred during login. Please try again."
					)
				).toBeInTheDocument();
			});
		});

		it("should display API error message if available", async () => {
			const user = userEvent.setup();
			const errorResponse = {
				response: {
					data: {
						message: "Account locked",
					},
				},
			};
			authAPI.login.mockRejectedValue(errorResponse);

			render(<Login onLoginSuccess={mockOnLoginSuccess} />);

			await user.type(screen.getByLabelText("Username"), "lockeduser");
			await user.type(screen.getByLabelText("Password"), "password123");
			await user.click(screen.getByRole("button", { name: "Login" }));

			await waitFor(() => {
				expect(screen.getByText("Account locked")).toBeInTheDocument();
			});
		});

		it("should clear error message on new submission", async () => {
			const user = userEvent.setup();
			authAPI.login.mockResolvedValueOnce({
				success: false,
				message: "Invalid credentials",
			});

			render(<Login onLoginSuccess={mockOnLoginSuccess} />);

			// First submission - fail
			await user.type(screen.getByLabelText("Username"), "wronguser");
			await user.type(screen.getByLabelText("Password"), "wrongpass");
			await user.click(screen.getByRole("button", { name: "Login" }));

			await waitFor(() => {
				expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
			});

			// Clear inputs
			const usernameInput = screen.getByLabelText("Username");
			const passwordInput = screen.getByLabelText("Password");
			await user.clear(usernameInput);
			await user.clear(passwordInput);

			// Second submission - should clear error
			authAPI.login.mockResolvedValueOnce({
				success: true,
				user: { id: 1, username: "testuser" },
			});

			await user.type(usernameInput, "testuser");
			await user.type(passwordInput, "password123");
			await user.click(screen.getByRole("button", { name: "Login" }));

			await waitFor(() => {
				expect(screen.queryByText("Invalid credentials")).not.toBeInTheDocument();
			});
		});

		it("should re-enable form after failed login", async () => {
			const user = userEvent.setup();
			authAPI.login.mockResolvedValue({
				success: false,
				message: "Invalid credentials",
			});

			render(<Login onLoginSuccess={mockOnLoginSuccess} />);

			await user.type(screen.getByLabelText("Username"), "wronguser");
			await user.type(screen.getByLabelText("Password"), "wrongpass");
			await user.click(screen.getByRole("button", { name: "Login" }));

			await waitFor(() => {
				expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
			});

			// Check that inputs are re-enabled
			expect(screen.getByLabelText("Username")).not.toBeDisabled();
			expect(screen.getByLabelText("Password")).not.toBeDisabled();
			expect(screen.getByRole("button", { name: "Login" })).not.toBeDisabled();
		});
	});

	describe("Form Validation", () => {
		it("should not call authAPI.login with empty fields (browser required attribute)", async () => {
			const user = userEvent.setup();

			render(<Login onLoginSuccess={mockOnLoginSuccess} />);

			// Click submit without filling fields - browser validation should prevent submission
			await user.click(screen.getByRole("button", { name: "Login" }));

			// The browser's required attribute should prevent the API call
			expect(authAPI.login).not.toHaveBeenCalled();
		});

		it("should handle form submission via Enter key", async () => {
			const user = userEvent.setup();
			authAPI.login.mockResolvedValue({
				success: true,
				user: { id: 1, username: "testuser" },
			});

			render(<Login onLoginSuccess={mockOnLoginSuccess} />);

			await user.type(screen.getByLabelText("Username"), "testuser");
			await user.type(screen.getByLabelText("Password"), "password123{Enter}");

			await waitFor(() => {
				expect(authAPI.login).toHaveBeenCalledWith("testuser", "password123");
			});
		});
	});

	describe("Accessibility", () => {
		it("should have proper labels for inputs", () => {
			render(<Login onLoginSuccess={mockOnLoginSuccess} />);

			const usernameInput = screen.getByLabelText("Username");
			const passwordInput = screen.getByLabelText("Password");

			expect(usernameInput).toHaveAttribute("id", "username");
			expect(passwordInput).toHaveAttribute("id", "password");
		});

		it("should use proper Bootstrap alert role for errors", async () => {
			const user = userEvent.setup();
			authAPI.login.mockResolvedValue({
				success: false,
				message: "Invalid credentials",
			});

			render(<Login onLoginSuccess={mockOnLoginSuccess} />);

			await user.type(screen.getByLabelText("Username"), "wronguser");
			await user.type(screen.getByLabelText("Password"), "wrongpass");
			await user.click(screen.getByRole("button", { name: "Login" }));

			await waitFor(() => {
				const alert = screen.getByRole("alert");
				expect(alert).toHaveClass("alert-danger");
			});
		});
	});
});
