/**
 * Authentication Routes Tests
 * Tests for login, logout, and session management endpoints
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import authRoutes from "../../src/routes/auth.js";
import { User } from "../../src/models/User.js";
import "../setup.js";
import { userFixtures, edgeCases } from "../fixtures/testData.js";
import { USER_ROLES } from "../../src/constants/enums.js";

describe("Auth Routes - Authentication", () => {
	let app;
	let activeUser;
	let inactiveUser;
	const TEST_PASSWORD = "password123";
	let passwordHash;

	beforeEach(async () => {
		// Clear database
		await User.deleteMany({});

		// Create password hash once for all users
		passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

		// Create test users using fixtures
		activeUser = await User.create(
			userFixtures.partner({
				passwordHash,
			})
		);

		inactiveUser = await User.create(
			userFixtures.inactive({
				passwordHash,
			})
		);

		// Setup Express app with session
		app = express();
		app.use(express.json());
		app.use(
			session({
				secret: "test-secret",
				resave: false,
				saveUninitialized: false,
				cookie: { secure: false },
			})
		);

		app.use("/api/auth", authRoutes);
	});

	describe("POST /api/auth/login", () => {
		describe("Validation", () => {
			it("should require username", async () => {
				const response = await request(app)
					.post("/api/auth/login")
					.send({ password: TEST_PASSWORD })
					.expect(400);

				expect(response.body.success).toBe(false);
				expect(response.body.message).toMatch(/username and password/i);
			});

			it("should require password", async () => {
				const response = await request(app)
					.post("/api/auth/login")
					.send({ username: userFixtures.partner().username })
					.expect(400);

				expect(response.body.success).toBe(false);
				expect(response.body.message).toMatch(/username and password/i);
			});

			it("should require both username and password", async () => {
				const response = await request(app)
					.post("/api/auth/login")
					.send({})
					.expect(400);

				expect(response.body.success).toBe(false);
				expect(response.body.message).toMatch(/username and password/i);
			});
		});

		describe("Authentication", () => {
			it("should reject invalid username", async () => {
				const response = await request(app)
					.post("/api/auth/login")
					.send({
						username: "nonexistent",
						password: TEST_PASSWORD,
					})
					.expect(401);

				expect(response.body.success).toBe(false);
				expect(response.body.message).toMatch(/invalid username or password/i);
			});

			it("should reject invalid password", async () => {
				const response = await request(app)
					.post("/api/auth/login")
					.send({
						username: activeUser.username,
						password: "wrongpassword",
					})
					.expect(401);

				expect(response.body.success).toBe(false);
				expect(response.body.message).toMatch(/invalid username or password/i);
			});

			it("should reject inactive user login", async () => {
				const response = await request(app)
					.post("/api/auth/login")
					.send({
						username: inactiveUser.username,
						password: TEST_PASSWORD,
					})
					.expect(403);

				expect(response.body.success).toBe(false);
				expect(response.body.message).toMatch(/account is inactive/i);
			});

			it("should successfully login with valid credentials", async () => {
				const response = await request(app)
					.post("/api/auth/login")
					.send({
						username: activeUser.username,
						password: TEST_PASSWORD,
					})
					.expect(200);

				expect(response.body.success).toBe(true);
				expect(response.body.message).toBe("Login successful");
			});
		});

		describe("Session Creation", () => {
			it("should create session on successful login", async () => {
				const agent = request.agent(app);

				const loginResponse = await agent
					.post("/api/auth/login")
					.send({
						username: activeUser.username,
						password: TEST_PASSWORD,
					})
					.expect(200);

				expect(loginResponse.header["set-cookie"]).toBeDefined();
			});

			it("should return user data on successful login", async () => {
				const response = await request(app)
					.post("/api/auth/login")
					.send({
						username: activeUser.username,
						password: TEST_PASSWORD,
					})
					.expect(200);

				expect(response.body.user).toBeDefined();
				expect(response.body.user.username).toBe(activeUser.username);
				expect(response.body.user.email).toBe(activeUser.email);
				expect(response.body.user.role).toBe(USER_ROLES.PARTNER);
				expect(response.body.user.firstName).toBe(activeUser.firstName);
				expect(response.body.user.lastName).toBe(activeUser.lastName);
				expect(response.body.user.fullName).toBe(
					`${activeUser.firstName} ${activeUser.lastName}`
				);
			});

			it("should not return password hash in response", async () => {
				const response = await request(app)
					.post("/api/auth/login")
					.send({
						username: activeUser.username,
						password: TEST_PASSWORD,
					})
					.expect(200);

				expect(response.body.user.passwordHash).toBeUndefined();
				expect(response.body.user.password).toBeUndefined();
			});

			it("should update lastLogin timestamp", async () => {
				const beforeLogin = new Date();

				await request(app)
					.post("/api/auth/login")
					.send({
						username: activeUser.username,
						password: TEST_PASSWORD,
					})
					.expect(200);

				const updatedUser = await User.findById(activeUser._id);
				expect(updatedUser.lastLogin).toBeDefined();
				expect(
					new Date(updatedUser.lastLogin).getTime()
				).toBeGreaterThanOrEqual(beforeLogin.getTime());
			});
		});

		describe("User Roles", () => {
			it("should handle partner login", async () => {
				const response = await request(app)
					.post("/api/auth/login")
					.send({
						username: activeUser.username,
						password: TEST_PASSWORD,
					})
					.expect(200);

				expect(response.body.user.role).toBe(USER_ROLES.PARTNER);
				expect(response.body.user.assignedStoreId).toBeNull();
			});

			it("should handle store-manager login", async () => {
				const storeId = "507f1f77bcf86cd799439011";

				const manager = await User.create(
					userFixtures.storeManager(storeId, {
						passwordHash,
					})
				);

				const response = await request(app)
					.post("/api/auth/login")
					.send({
						username: manager.username,
						password: TEST_PASSWORD,
					})
					.expect(200);

				expect(response.body.user.role).toBe(USER_ROLES.STORE_MANAGER);
				expect(response.body.user.assignedStoreId).toBe(storeId);
			});

			it("should handle employee login", async () => {
				const storeId = "507f1f77bcf86cd799439011";

				const employee = await User.create(
					userFixtures.employee(storeId, {
						passwordHash,
					})
				);

				const response = await request(app)
					.post("/api/auth/login")
					.send({
						username: employee.username,
						password: TEST_PASSWORD,
					})
					.expect(200);

				expect(response.body.user.role).toBe(USER_ROLES.EMPLOYEE);
				expect(response.body.user.assignedStoreId).toBe(storeId);
			});
		});
	});

	describe("POST /api/auth/logout", () => {
		it("should successfully logout", async () => {
			const agent = request.agent(app);

			// Login first
			await agent.post("/api/auth/login").send({
				username: activeUser.username,
				password: TEST_PASSWORD,
			}); // Logout
			const response = await agent.post("/api/auth/logout").expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toBe("Logout successful");
		});

		it("should clear session cookie on logout", async () => {
			const agent = request.agent(app);

			// Login first
			await agent.post("/api/auth/login").send({
				username: activeUser.username,
				password: TEST_PASSWORD,
			});

			// Logout
			await agent.post("/api/auth/logout").expect(200);

			// Verify session is destroyed
			const sessionCheck = await agent.get("/api/auth/session").expect(401);

			expect(sessionCheck.body.success).toBe(false);
		});

		it("should allow logout even without active session", async () => {
			const response = await request(app).post("/api/auth/logout").expect(200);

			expect(response.body.success).toBe(true);
		});
	});

	describe("GET /api/auth/session", () => {
		describe("Authentication", () => {
			it("should reject unauthenticated requests", async () => {
				const response = await request(app)
					.get("/api/auth/session")
					.expect(401);

				expect(response.body.success).toBe(false);
				expect(response.body.message).toMatch(/not authenticated/i);
			});

			it("should return user data for authenticated requests", async () => {
				const agent = request.agent(app);

				// Login first
				await agent.post("/api/auth/login").send({
					username: activeUser.username,
					password: TEST_PASSWORD,
				});

				// Check session
				const response = await agent.get("/api/auth/session").expect(200);

				expect(response.body.success).toBe(true);
				expect(response.body.user).toBeDefined();
				expect(response.body.user.username).toBe(activeUser.username);
				expect(response.body.user.role).toBe(USER_ROLES.PARTNER);
			});
		});

		describe("Session Validation", () => {
			it("should invalidate session if user becomes inactive", async () => {
				const agent = request.agent(app);

				// Login first
				await agent.post("/api/auth/login").send({
					username: activeUser.username,
					password: TEST_PASSWORD,
				});

				// Deactivate user
				await User.findByIdAndUpdate(activeUser._id, { isActive: false });

				// Session check should fail
				const response = await agent.get("/api/auth/session").expect(401);

				expect(response.body.success).toBe(false);
				expect(response.body.message).toMatch(/session invalid/i);
			});

			it("should invalidate session if user is deleted", async () => {
				const agent = request.agent(app);

				// Login first
				await agent.post("/api/auth/login").send({
					username: activeUser.username,
					password: TEST_PASSWORD,
				});

				// Delete user
				await User.findByIdAndDelete(activeUser._id);

				// Session check should fail
				const response = await agent.get("/api/auth/session").expect(401);

				expect(response.body.success).toBe(false);
				expect(response.body.message).toMatch(/session invalid/i);
			});

			it("should not return password hash in session response", async () => {
				const agent = request.agent(app);

				// Login first
				await agent.post("/api/auth/login").send({
					username: activeUser.username,
					password: TEST_PASSWORD,
				});

				// Check session
				const response = await agent.get("/api/auth/session").expect(200);

				expect(response.body.user.passwordHash).toBeUndefined();
				expect(response.body.user.password).toBeUndefined();
			});
		});

		describe("User Data", () => {
			it("should return complete user profile", async () => {
				const agent = request.agent(app);

				// Login first
				await agent.post("/api/auth/login").send({
					username: activeUser.username,
					password: TEST_PASSWORD,
				});

				// Check session
				const response = await agent.get("/api/auth/session").expect(200);

				expect(response.body.user).toMatchObject({
					username: activeUser.username,
					email: activeUser.email,
					role: USER_ROLES.PARTNER,
					firstName: activeUser.firstName,
					lastName: activeUser.lastName,
					fullName: `${activeUser.firstName} ${activeUser.lastName}`,
				});
			});

			it("should include assignedStoreId for store staff", async () => {
				const storeId = "507f1f77bcf86cd799439011";

				await User.create(
					userFixtures.storeManager(storeId, {
						passwordHash,
					})
				);

				const agent = request.agent(app);

				// Login as manager
				await agent.post("/api/auth/login").send({
					username: userFixtures.storeManager(storeId).username,
					password: TEST_PASSWORD,
				});

				// Check session
				const response = await agent.get("/api/auth/session").expect(200);

				expect(response.body.user.assignedStoreId).toBe(storeId);
			});
		});
	});

	describe("Error Handling", () => {
		it("should handle database errors during login", async () => {
			// Mock User.findOne to throw error
			const findOneSpy = vi
				.spyOn(User, "findOne")
				.mockRejectedValue(new Error("Database error"));

			const response = await request(app)
				.post("/api/auth/login")
				.send({
					username: activeUser.username,
					password: TEST_PASSWORD,
				})
				.expect(500);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toMatch(/error occurred during login/i);

			findOneSpy.mockRestore();
		});

		it("should handle database errors during session check", async () => {
			const agent = request.agent(app);

			// Login first
			await agent.post("/api/auth/login").send({
				username: activeUser.username,
				password: TEST_PASSWORD,
			});

			// Mock User.findById to throw error
			const findByIdSpy = vi
				.spyOn(User, "findById")
				.mockRejectedValue(new Error("Database error"));

			const response = await agent.get("/api/auth/session").expect(500);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toMatch(/error checking session/i);

			findByIdSpy.mockRestore();
		});
	});

	describe("Edge Cases - Invalid Credentials", () => {
		it("should reject login with empty username", async () => {
			const response = await request(app).post("/api/auth/login").send({
				username: "",
				password: TEST_PASSWORD,
			});

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it("should reject login with empty password", async () => {
			const response = await request(app).post("/api/auth/login").send({
				username: activeUser.username,
				password: "",
			});

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});
		it("should reject login with whitespace-only username", async () => {
			const response = await request(app).post("/api/auth/login").send({
				username: edgeCases.whitespace.both,
				password: TEST_PASSWORD,
			});

			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		it("should handle SQL injection attempt in username", async () => {
			const response = await request(app).post("/api/auth/login").send({
				username: edgeCases.specialChars.sql,
				password: TEST_PASSWORD,
			});

			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		it("should handle XSS attempt in username", async () => {
			const response = await request(app).post("/api/auth/login").send({
				username: edgeCases.specialChars.script,
				password: TEST_PASSWORD,
			});

			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});
	});

	describe("Edge Cases - Session Edge Cases", () => {
		it("should handle multiple concurrent sessions", async () => {
			const agent1 = request.agent(app);
			const agent2 = request.agent(app);

			// Login with both agents
			await agent1.post("/api/auth/login").send({
				username: activeUser.username,
				password: TEST_PASSWORD,
			});

			await agent2.post("/api/auth/login").send({
				username: activeUser.username,
				password: TEST_PASSWORD,
			});

			// Both should have valid sessions
			const session1 = await agent1.get("/api/auth/session");
			const session2 = await agent2.get("/api/auth/session");
			expect(session1.status).toBe(200);
			expect(session2.status).toBe(200);
		});

		it("should handle logout from one session without affecting others", async () => {
			const agent1 = request.agent(app);
			const agent2 = request.agent(app);

			// Login with both agents
			await agent1.post("/api/auth/login").send({
				username: activeUser.username,
				password: TEST_PASSWORD,
			});

			await agent2.post("/api/auth/login").send({
				username: activeUser.username,
				password: TEST_PASSWORD,
			});

			// Logout from agent1
			await agent1.post("/api/auth/logout"); // agent1 session should be invalid
			const session1 = await agent1.get("/api/auth/session");
			expect(session1.status).toBe(401);

			// agent2 session should still be valid
			const session2 = await agent2.get("/api/auth/session");
			expect(session2.status).toBe(200);
		});
	});
});
