/**
 * Tests for User Model
 */

import { describe, it, expect, beforeEach } from "vitest";
import { User } from "../../src/models/User.js";
import mongoose from "mongoose";
import "../setup.js"; // Import test setup
import { userFixtures } from "../fixtures/testData.js";
import { USER_ROLES } from "../../src/constants/enums.js";

describe("User Model", () => {
	beforeEach(async () => {
		// Clear database for test isolation
		await User.deleteMany({});
	});

	describe("Schema Validation", () => {
		it("should create a valid employee user", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData = userFixtures.employee(storeId);

			const user = new User(userData);
			const savedUser = await user.save();

			expect(savedUser._id).toBeDefined();
			expect(savedUser.username).toBe("employee1");
			expect(savedUser.email).toBe("employee@tcg.com");
			expect(savedUser.role).toBe(USER_ROLES.EMPLOYEE);
			expect(savedUser.assignedStoreId.toString()).toBe(storeId.toString());
			expect(savedUser.isActive).toBe(true);
			expect(savedUser.createdAt).toBeInstanceOf(Date);
		});

		it("should create a valid store-manager user", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData = userFixtures.storeManager(storeId);

			const user = new User(userData);
			const savedUser = await user.save();

			expect(savedUser.role).toBe(USER_ROLES.STORE_MANAGER);
			expect(savedUser.assignedStoreId).toBeDefined();
		});

		it("should create a valid partner user without assigned store", async () => {
			const userData = userFixtures.partner();

			const user = new User(userData);
			const savedUser = await user.save();

			expect(savedUser.role).toBe(USER_ROLES.PARTNER);
			expect(savedUser.assignedStoreId).toBeNull();
		});

		it("should fail if username is missing", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData = userFixtures.employee(storeId, {
				username: undefined,
			});

			const user = new User(userData);
			await expect(user.save()).rejects.toThrow();
		});

		it("should fail if email is invalid", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData = userFixtures.employee(storeId, {
				email: "invalid-email",
			});

			const user = new User(userData);
			await expect(user.save()).rejects.toThrow();
		});

		it("should fail if role is invalid", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData = userFixtures.employee(storeId, {
				role: "invalid-role",
			});

			const user = new User(userData);
			await expect(user.save()).rejects.toThrow();
		});

		it("should fail if employee/store-manager missing assignedStoreId", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData = userFixtures.employee(storeId, {
				assignedStoreId: null,
			});

			const user = new User(userData);
			await expect(user.save()).rejects.toThrow();
		});

		it("should fail if partner has assignedStoreId", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData = userFixtures.partner({
				assignedStoreId: storeId,
			});

			const user = new User(userData);
			await expect(user.save()).rejects.toThrow();
		});

		it("should enforce unique username", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData1 = userFixtures.employee(storeId, {
				username: "sameuser",
			});

			const userData2 = userFixtures.employee(storeId, {
				username: "sameuser",
				email: "different@tcg.com",
			});

			await new User(userData1).save();
			await expect(new User(userData2).save()).rejects.toThrow();
		});

		it("should enforce unique email", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData1 = userFixtures.employee(storeId, {
				email: "same@tcg.com",
			});

			const userData2 = userFixtures.employee(storeId, {
				username: "employee2",
				email: "same@tcg.com",
			});

			await new User(userData1).save();
			await expect(new User(userData2).save()).rejects.toThrow();
		});
	});

	describe("Virtual Properties", () => {
		it("should generate fullName virtual property", async () => {
			const userData = userFixtures.partner();

			const user = new User(userData);
			const savedUser = await user.save();

			expect(savedUser.fullName).toBe("Partner User");
		});
	});

	describe("User Queries", () => {
		beforeEach(async () => {
			// Create test data
			const storeId1 = new mongoose.Types.ObjectId();
			const storeId2 = new mongoose.Types.ObjectId();

			await User.create([
				userFixtures.employee(storeId1),
				userFixtures.employee(storeId2, {
					username: "employee2",
					email: "employee2@tcg.com",
					isActive: false,
				}),
				userFixtures.storeManager(storeId1),
				userFixtures.partner(),
			]);
		});

		it("should find users by role", async () => {
			const employees = await User.find({ role: USER_ROLES.EMPLOYEE });
			expect(employees).toHaveLength(2);
		});

		it("should find active users only", async () => {
			const activeUsers = await User.find({ isActive: true });
			expect(activeUsers).toHaveLength(3);
		});

		it("should find users by assigned store", async () => {
			const employee = await User.findOne({ username: "employee1" });
			const usersAtStore = await User.find({
				assignedStoreId: employee.assignedStoreId,
			});
			expect(usersAtStore).toHaveLength(2); // employee1 and manager1
		});

		it("should find user by email", async () => {
			const user = await User.findOne({ email: "employee@tcg.com" });
			expect(user.username).toBe("employee1");
		});
	});

	describe("Edge Cases - Email Validation", () => {
		it("should reject emails without @ symbol", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData = userFixtures.employee(storeId, {
				email: "notanemail",
			});

			const user = new User(userData);
			await expect(user.save()).rejects.toThrow();
		});

		it("should reject emails without domain", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData = userFixtures.employee(storeId, {
				email: "user@",
			});

			const user = new User(userData);
			await expect(user.save()).rejects.toThrow();
		});

		it("should reject emails with double @", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData = userFixtures.employee(storeId, {
				email: "user@@example.com",
			});

			const user = new User(userData);
			await expect(user.save()).rejects.toThrow();
		});

		it("should reject empty email", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData = userFixtures.employee(storeId, {
				email: "",
			});

			const user = new User(userData);
			await expect(user.save()).rejects.toThrow();
		});
	});

	describe("Edge Cases - Username Validation", () => {
		it("should trim whitespace from username", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData = userFixtures.employee(storeId, {
				username: "  testuser  ",
				email: "test@example.com",
			});

			const user = new User(userData);
			const savedUser = await user.save();
			expect(savedUser.username).toBe("testuser");
		});

		it("should handle minimum length username", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData = userFixtures.employee(storeId, {
				username: "ab",
				email: "test@example.com",
			});

			const user = new User(userData);
			const savedUser = await user.save();
			expect(savedUser.username).toBe("ab");
		});

		it("should handle maximum length username", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const longUsername = "a".repeat(50);
			const userData = userFixtures.employee(storeId, {
				username: longUsername,
				email: "test@example.com",
			});

			const user = new User(userData);
			const savedUser = await user.save();
			expect(savedUser.username).toBe(longUsername);
		});
	});

	describe("Edge Cases - Role and Store Assignment", () => {
		it("should reject null role", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData = userFixtures.employee(storeId, {
				role: null,
			});

			const user = new User(userData);
			await expect(user.save()).rejects.toThrow();
		});

		it("should allow store-manager with valid store assignment", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData = userFixtures.storeManager(storeId);

			const user = new User(userData);
			const savedUser = await user.save();
			expect(savedUser.role).toBe(USER_ROLES.STORE_MANAGER);
			expect(savedUser.assignedStoreId.toString()).toBe(storeId.toString());
		});

		it("should reject employee with invalid ObjectId for assignedStoreId", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData = userFixtures.employee(storeId, {
				assignedStoreId: "invalid-id",
			});

			const user = new User(userData);
			await expect(user.save()).rejects.toThrow();
		});
	});

	describe("Edge Cases - Name Fields", () => {
		it("should trim whitespace from firstName and lastName", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData = userFixtures.employee(storeId, {
				firstName: "  John  ",
				lastName: "  Doe  ",
			});

			const user = new User(userData);
			const savedUser = await user.save();
			expect(savedUser.firstName).toBe("John");
			expect(savedUser.lastName).toBe("Doe");
		});

		it("should handle single character names", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData = userFixtures.employee(storeId, {
				firstName: "A",
				lastName: "B",
			});

			const user = new User(userData);
			const savedUser = await user.save();
			expect(savedUser.firstName).toBe("A");
			expect(savedUser.lastName).toBe("B");
		});

		it("should generate correct fullName with special characters", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData = userFixtures.employee(storeId, {
				firstName: "José",
				lastName: "García",
			});

			const user = new User(userData);
			const savedUser = await user.save();
			expect(savedUser.fullName).toBe("José García");
		});
	});

	describe("Edge Cases - Timestamps and Defaults", () => {
		it("should set createdAt on user creation", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const beforeCreation = new Date();
			const userData = userFixtures.employee(storeId);

			const user = new User(userData);
			const savedUser = await user.save();
			const afterCreation = new Date();

			expect(savedUser.createdAt).toBeInstanceOf(Date);
			expect(savedUser.createdAt.getTime()).toBeGreaterThanOrEqual(
				beforeCreation.getTime()
			);
			expect(savedUser.createdAt.getTime()).toBeLessThanOrEqual(
				afterCreation.getTime()
			);
		});

		it("should default isActive to true", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData = userFixtures.employee(storeId);
			delete userData.isActive; // Remove explicit value

			const user = new User(userData);
			const savedUser = await user.save();
			expect(savedUser.isActive).toBe(true);
		});

		it("should allow explicitly setting isActive to false", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData = userFixtures.employee(storeId, { isActive: false });

			const user = new User(userData);
			const savedUser = await user.save();
			expect(savedUser.isActive).toBe(false);
		});

		it("should default lastLogin to null", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData = userFixtures.employee(storeId);

			const user = new User(userData);
			const savedUser = await user.save();
			expect(savedUser.lastLogin).toBeNull();
		});

		it("should accept valid lastLogin date", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const loginDate = new Date();
			const userData = userFixtures.employee(storeId, { lastLogin: loginDate });

			const user = new User(userData);
			const savedUser = await user.save();
			expect(savedUser.lastLogin).toBeInstanceOf(Date);
			expect(savedUser.lastLogin.getTime()).toBe(loginDate.getTime());
		});
	});

	describe("Edge Cases - Concurrent Updates", () => {
		it("should handle concurrent username uniqueness", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const user1 = new User(
				userFixtures.employee(storeId, {
					username: "sameuser",
					email: "user1@test.com",
				})
			);
			const user2 = new User(
				userFixtures.employee(storeId, {
					username: "sameuser",
					email: "user2@test.com",
				})
			);

			await user1.save();
			await expect(user2.save()).rejects.toThrow();
		});

		it("should handle concurrent email uniqueness", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const user1 = new User(
				userFixtures.employee(storeId, {
					username: "user1",
					email: "same@test.com",
				})
			);
			const user2 = new User(
				userFixtures.employee(storeId, {
					username: "user2",
					email: "same@test.com",
				})
			);

			await user1.save();
			await expect(user2.save()).rejects.toThrow();
		});
	});
});
