/**
 * Role-Based Access Control Middleware Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
	requireAuth,
	requireRole,
	requireStoreAccess,
} from "../../src/middleware/auth.js";
import { User } from "../../src/models/User.js";
import "../setup.js"; // Import test setup

describe("Auth Middleware - Role-Based Access Control", () => {
	let req, res, next;

	beforeEach(() => {
		req = {
			session: {},
			params: {},
			body: {},
		};
		res = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn().mockReturnThis(),
		};
		next = vi.fn();
	});

	describe("requireAuth - Authentication Check", () => {
		it("should allow authenticated users to proceed", async () => {
			const mockUser = {
				_id: "user123",
				username: "testuser",
				role: "employee",
			};

			req.session.userId = "user123";
			vi.spyOn(User, "findById").mockResolvedValue(mockUser);

			await requireAuth(req, res, next);

			expect(next).toHaveBeenCalled();
			expect(req.user).toEqual(mockUser);
		});

		it("should deny unauthenticated users", async () => {
			await requireAuth(req, res, next);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: "Authentication required",
			});
			expect(next).not.toHaveBeenCalled();
		});

		it("should deny if user not found in database", async () => {
			req.session.userId = "nonexistent";
			vi.spyOn(User, "findById").mockResolvedValue(null);

			await requireAuth(req, res, next);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: "User not found",
			});
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe("requireRole - Role-Based Access", () => {
		it("should allow users with matching role", () => {
			req.user = { role: "partner" };
			const middleware = requireRole(["partner"]);

			middleware(req, res, next);

			expect(next).toHaveBeenCalled();
			expect(res.status).not.toHaveBeenCalled();
		});

		it("should allow users with any of the allowed roles", () => {
			req.user = { role: "store-manager" };
			const middleware = requireRole(["partner", "store-manager"]);

			middleware(req, res, next);

			expect(next).toHaveBeenCalled();
		});

		it("should deny users without matching role", () => {
			req.user = { role: "employee" };
			const middleware = requireRole(["partner", "store-manager"]);

			middleware(req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: "Insufficient permissions",
			});
			expect(next).not.toHaveBeenCalled();
		});

		it("should deny if user has no role", () => {
			req.user = {};
			const middleware = requireRole(["partner"]);

			middleware(req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(next).not.toHaveBeenCalled();
		});

		it("should deny if no user on request", () => {
			const middleware = requireRole(["partner"]);

			middleware(req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe("requireStoreAccess - Store-Specific Access", () => {
		it("should allow partners to access any store", () => {
			req.user = { role: "partner" };
			req.params.id = "store123";

			requireStoreAccess(req, res, next);

			expect(next).toHaveBeenCalled();
			expect(res.status).not.toHaveBeenCalled();
		});

		it("should allow managers to access their assigned store", () => {
			req.user = {
				role: "store-manager",
				assignedStoreId: "store123",
			};
			req.params.id = "store123";

			requireStoreAccess(req, res, next);

			expect(next).toHaveBeenCalled();
		});

		it("should deny managers access to other stores", () => {
			req.user = {
				role: "store-manager",
				assignedStoreId: "store123",
			};
			req.params.id = "store456";

			requireStoreAccess(req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: "You can only access your assigned store",
			});
			expect(next).not.toHaveBeenCalled();
		});

		it("should deny employees from accessing stores", () => {
			req.user = {
				role: "employee",
				assignedStoreId: "store123",
			};
			req.params.id = "store123";

			requireStoreAccess(req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(next).not.toHaveBeenCalled();
		});

		it("should handle ObjectId comparison for managers", () => {
			// MongoDB ObjectIds need toString() for comparison
			req.user = {
				role: "store-manager",
				assignedStoreId: { toString: () => "store123" },
			};
			req.params.id = "store123";

			requireStoreAccess(req, res, next);

			expect(next).toHaveBeenCalled();
		});
	});
});
