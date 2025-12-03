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
import { edgeCases } from "../fixtures/testData.js";
import { USER_ROLES } from "../../src/constants/enums.js";

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
				role: USER_ROLES.EMPLOYEE,
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
			req.user = { role: USER_ROLES.PARTNER };
			const middleware = requireRole([USER_ROLES.PARTNER]);

			middleware(req, res, next);

			expect(next).toHaveBeenCalled();
			expect(res.status).not.toHaveBeenCalled();
		});

		it("should allow users with any of the allowed roles", () => {
			req.user = { role: USER_ROLES.STORE_MANAGER };
			const middleware = requireRole([
				USER_ROLES.PARTNER,
				USER_ROLES.STORE_MANAGER,
			]);

			middleware(req, res, next);

			expect(next).toHaveBeenCalled();
		});

		it("should deny users without matching role", () => {
			req.user = { role: USER_ROLES.EMPLOYEE };
			const middleware = requireRole([
				USER_ROLES.PARTNER,
				USER_ROLES.STORE_MANAGER,
			]);

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
			const middleware = requireRole([USER_ROLES.PARTNER]);

			middleware(req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(next).not.toHaveBeenCalled();
		});

		it("should deny if no user on request", () => {
			const middleware = requireRole([USER_ROLES.PARTNER]);

			middleware(req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe("requireStoreAccess - Store-Specific Access", () => {
		it("should allow partners to access any store", () => {
			req.user = { role: USER_ROLES.PARTNER };
			req.params.id = "store123";

			requireStoreAccess(req, res, next);

			expect(next).toHaveBeenCalled();
			expect(res.status).not.toHaveBeenCalled();
		});

		it("should allow managers to access their assigned store", () => {
			req.user = {
				role: USER_ROLES.STORE_MANAGER,
				assignedStoreId: "store123",
			};
			req.params.id = "store123";

			requireStoreAccess(req, res, next);

			expect(next).toHaveBeenCalled();
		});

		it("should deny managers access to other stores", () => {
			req.user = {
				role: USER_ROLES.STORE_MANAGER,
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

		it("should deny employees access to other stores", () => {
			req.user = {
				role: USER_ROLES.EMPLOYEE,
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

		it("should handle ObjectId comparison for managers", () => {
			// MongoDB ObjectIds need toString() for comparison
			req.user = {
				role: USER_ROLES.STORE_MANAGER,
				assignedStoreId: { toString: () => "store123" },
			};
			req.params.id = "store123";

			requireStoreAccess(req, res, next);

			expect(next).toHaveBeenCalled();
		});
	});

	describe("Edge Cases - Authentication", () => {
		it("should handle missing session object", async () => {
			req.session = undefined;

			await requireAuth(req, res, next);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(next).not.toHaveBeenCalled();
		});

		it("should handle empty session userId", async () => {
			req.session.userId = "";

			await requireAuth(req, res, next);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(next).not.toHaveBeenCalled();
		});

		it("should handle null session userId", async () => {
			req.session.userId = null;

			await requireAuth(req, res, next);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(next).not.toHaveBeenCalled();
		});

		it("should handle malformed user ID", async () => {
			req.session.userId = edgeCases.invalidIds.malformed;
			vi.spyOn(User, "findById").mockResolvedValue(null);

			await requireAuth(req, res, next);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe("Edge Cases - Role Validation", () => {
		it("should handle empty roles array", () => {
			req.user = { role: USER_ROLES.PARTNER };
			const middleware = requireRole([]);

			middleware(req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(next).not.toHaveBeenCalled();
		});

		it("should handle null role in user object", () => {
			req.user = { role: null };
			const middleware = requireRole([USER_ROLES.PARTNER]);

			middleware(req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(next).not.toHaveBeenCalled();
		});

		it("should handle undefined role in user object", () => {
			req.user = { role: undefined };
			const middleware = requireRole([USER_ROLES.PARTNER]);

			middleware(req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(next).not.toHaveBeenCalled();
		});

		it("should be case-sensitive for roles", () => {
			req.user = { role: "PARTNER" }; // uppercase
			const middleware = requireRole([USER_ROLES.PARTNER]);

			middleware(req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe("Edge Cases - Store Access", () => {
		it("should handle missing params object", () => {
			req.user = { role: USER_ROLES.PARTNER };
			req.params = undefined;

			requireStoreAccess(req, res, next);

			// Partner should still have access even without params
			expect(next).toHaveBeenCalled();
		});

		it("should handle empty store ID in params", () => {
			req.user = {
				role: USER_ROLES.STORE_MANAGER,
				assignedStoreId: "store123",
			};
			req.params.id = "";

			requireStoreAccess(req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(next).not.toHaveBeenCalled();
		});

		it("should handle null assignedStoreId for manager", () => {
			req.user = {
				role: USER_ROLES.STORE_MANAGER,
				assignedStoreId: null,
			};
			req.params.id = "store123";

			requireStoreAccess(req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(next).not.toHaveBeenCalled();
		});

		it("should handle malformed store IDs", () => {
			req.user = {
				role: USER_ROLES.STORE_MANAGER,
				assignedStoreId: edgeCases.invalidIds.malformed,
			};
			req.params.id = edgeCases.invalidIds.malformed;

			requireStoreAccess(req, res, next);

			// Should allow access if IDs match, even if malformed
			expect(next).toHaveBeenCalled();
		});
	});
});
