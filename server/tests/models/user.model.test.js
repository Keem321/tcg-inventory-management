/**
 * Tests for User Model
 */

import { describe, it, expect, beforeEach } from "vitest";
import { User } from "../../src/models/user.model.js";
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
			const user = new User(userFixtures.employee(storeId));
			const savedUser = await user.save();

			expect(savedUser._id).toBeDefined();
		});

		it("should create a valid store-manager user", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const user = new User(userFixtures.storeManager(storeId));
			const savedUser = await user.save();

			expect(savedUser._id).toBeDefined();
		});

		it("should create a valid partner user without assigned store", async () => {
			const user = new User(userFixtures.partner());
			const savedUser = await user.save();

			expect(savedUser._id).toBeDefined();
		});

		it("should set employee role correctly", async () => {
			const user = new User(
				userFixtures.employee(new mongoose.Types.ObjectId())
			);
			const savedUser = await user.save();

			expect(savedUser.role).toBe(USER_ROLES.EMPLOYEE);
		});

		it("should set store-manager role correctly", async () => {
			const user = new User(
				userFixtures.storeManager(new mongoose.Types.ObjectId())
			);
			const savedUser = await user.save();

			expect(savedUser.role).toBe(USER_ROLES.STORE_MANAGER);
		});

		it("should set partner role correctly", async () => {
			const user = new User(userFixtures.partner());
			const savedUser = await user.save();

			expect(savedUser.role).toBe(USER_ROLES.PARTNER);
		});

		it("should set assignedStoreId for employee", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const user = new User(userFixtures.employee(storeId));
			const savedUser = await user.save();

			expect(savedUser.assignedStoreId.toString()).toBe(storeId.toString());
		});

		it("should set assignedStoreId to null for partner", async () => {
			const user = new User(userFixtures.partner());
			const savedUser = await user.save();

			expect(savedUser.assignedStoreId).toBeNull();
		});

		it("should set isActive to true by default", async () => {
			const user = new User(
				userFixtures.employee(new mongoose.Types.ObjectId())
			);
			const savedUser = await user.save();

			expect(savedUser.isActive).toBe(true);
		});

		it("should set createdAt timestamp", async () => {
			const user = new User(
				userFixtures.employee(new mongoose.Types.ObjectId())
			);
			const savedUser = await user.save();

			expect(savedUser.createdAt).toBeInstanceOf(Date);
		});

		it("should fail if username is missing", async () => {
			const userData = userFixtures.employee(new mongoose.Types.ObjectId());
			delete userData.username;

			await expect(new User(userData).save()).rejects.toThrow();
		});

		it("should fail if email is invalid", async () => {
			const user = new User(
				userFixtures.employee(new mongoose.Types.ObjectId(), {
					email: "invalid-email",
				})
			);
			await expect(user.save()).rejects.toThrow();
		});

		it("should fail if role is invalid", async () => {
			const user = new User(
				userFixtures.employee(new mongoose.Types.ObjectId(), {
					role: "invalid-role",
				})
			);
			await expect(user.save()).rejects.toThrow();
		});

		it("should fail if employee missing assignedStoreId", async () => {
			const userData = userFixtures.employee(new mongoose.Types.ObjectId());
			delete userData.assignedStoreId;

			await expect(new User(userData).save()).rejects.toThrow();
		});

		it("should fail if partner has assignedStoreId", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const user = new User(userFixtures.partner({ assignedStoreId: storeId }));
			await expect(user.save()).rejects.toThrow();
		});

		it("should enforce unique username", async () => {
			await new User(
				userFixtures.employee(new mongoose.Types.ObjectId(), {
					username: "sameuser",
				})
			).save();
			await expect(
				new User(
					userFixtures.employee(new mongoose.Types.ObjectId(), {
						username: "sameuser",
						email: "different@tcg.com",
					})
				).save()
			).rejects.toThrow();
		});

		it("should enforce unique email", async () => {
			await new User(
				userFixtures.employee(new mongoose.Types.ObjectId(), {
					email: "same@tcg.com",
				})
			).save();
			await expect(
				new User(
					userFixtures.employee(new mongoose.Types.ObjectId(), {
						username: "different",
						email: "same@tcg.com",
					})
				).save()
			).rejects.toThrow();
		});
	});

	describe("Virtual Properties", () => {
		it("should generate fullName virtual property", async () => {
			const user = new User(
				userFixtures.partner({
					firstName: "John",
					lastName: "Doe",
				})
			);
			const savedUser = await user.save();

			expect(savedUser.fullName).toBe("John Doe");
		});
	});

	describe("User Queries", () => {
		beforeEach(async () => {
			const storeId1 = new mongoose.Types.ObjectId();
			const storeId2 = new mongoose.Types.ObjectId();

			await User.create([
				userFixtures.employee(storeId1, {
					username: "employee1",
					email: "employee1@tcg.com",
				}),
				userFixtures.employee(storeId2, {
					username: "employee2",
					email: "employee2@tcg.com",
					isActive: false,
				}),
				userFixtures.storeManager(storeId1, {
					username: "manager1",
					email: "manager1@tcg.com",
				}),
				userFixtures.partner({
					username: "partner1",
					email: "partner1@tcg.com",
				}),
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
			const user = await User.findOne({ email: "employee1@tcg.com" });
			expect(user.username).toBe("employee1");
		});
	});

	describe("Edge Cases - Email Validation", () => {
		it("should reject emails without @ symbol", async () => {
			const user = new User(
				userFixtures.employee(new mongoose.Types.ObjectId(), {
					email: "notanemail",
				})
			);
			await expect(user.save()).rejects.toThrow();
		});

		it("should reject emails without domain", async () => {
			const user = new User(
				userFixtures.employee(new mongoose.Types.ObjectId(), { email: "user@" })
			);
			await expect(user.save()).rejects.toThrow();
		});

		it("should reject emails with double @", async () => {
			const user = new User(
				userFixtures.employee(new mongoose.Types.ObjectId(), {
					email: "user@@example.com",
				})
			);
			await expect(user.save()).rejects.toThrow();
		});

		it("should reject empty email", async () => {
			const user = new User(
				userFixtures.employee(new mongoose.Types.ObjectId(), { email: "" })
			);
			await expect(user.save()).rejects.toThrow();
		});
	});

	describe("Edge Cases - Username Validation", () => {
		it("should trim whitespace from username", async () => {
			const user = new User(
				userFixtures.employee(new mongoose.Types.ObjectId(), {
					username: "  testuser  ",
				})
			);
			const savedUser = await user.save();
			expect(savedUser.username).toBe("testuser");
		});

		it("should reject username below minimum length", async () => {
			const user = new User(
				userFixtures.employee(new mongoose.Types.ObjectId(), { username: "ab" })
			);
			await expect(user.save()).rejects.toThrow();
		});

		it("should reject username above maximum length", async () => {
			const user = new User(
				userFixtures.employee(new mongoose.Types.ObjectId(), {
					username: "a".repeat(50),
				})
			);
			await expect(user.save()).rejects.toThrow();
		});
	});

	describe("Edge Cases - Role and Store Assignment", () => {
		it("should reject null role", async () => {
			const userData = userFixtures.employee(new mongoose.Types.ObjectId());
			delete userData.role;

			await expect(new User(userData).save()).rejects.toThrow();
		});

		it("should allow store-manager with valid store assignment", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const user = new User(userFixtures.storeManager(storeId));
			const savedUser = await user.save();

			expect(savedUser.role).toBe(USER_ROLES.STORE_MANAGER);
			expect(savedUser.assignedStoreId.toString()).toBe(storeId.toString());
		});

		it("should reject employee with invalid ObjectId for assignedStoreId", async () => {
			const user = new User(
				userFixtures.employee(new mongoose.Types.ObjectId(), {
					assignedStoreId: "invalid-id",
				})
			);
			await expect(user.save()).rejects.toThrow();
		});
	});

	describe("Edge Cases - Name Fields", () => {
		it("should trim whitespace from firstName and lastName", async () => {
			const user = new User(
				userFixtures.employee(new mongoose.Types.ObjectId(), {
					firstName: "  John  ",
					lastName: "  Doe  ",
				})
			);
			const savedUser = await user.save();

			expect(savedUser.firstName).toBe("John");
			expect(savedUser.lastName).toBe("Doe");
		});

		it("should handle single character names", async () => {
			const user = new User(
				userFixtures.employee(new mongoose.Types.ObjectId(), {
					firstName: "A",
					lastName: "B",
				})
			);
			const savedUser = await user.save();

			expect(savedUser.firstName).toBe("A");
			expect(savedUser.lastName).toBe("B");
		});

		it("should generate correct fullName with special characters", async () => {
			const user = new User(
				userFixtures.employee(new mongoose.Types.ObjectId(), {
					firstName: "José",
					lastName: "García",
				})
			);
			const savedUser = await user.save();

			expect(savedUser.fullName).toBe("José García");
		});
	});

	describe("Edge Cases - Timestamps and Defaults", () => {
		it("should set createdAt on user creation", async () => {
			const beforeCreation = new Date();
			const user = new User(
				userFixtures.employee(new mongoose.Types.ObjectId())
			);
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
			const userData = userFixtures.employee(new mongoose.Types.ObjectId());
			delete userData.isActive;

			const user = new User(userData);
			const savedUser = await user.save();
			expect(savedUser.isActive).toBe(true);
		});

		it("should allow explicitly setting isActive to false", async () => {
			const user = new User(
				userFixtures.employee(new mongoose.Types.ObjectId(), {
					isActive: false,
				})
			);
			const savedUser = await user.save();
			expect(savedUser.isActive).toBe(false);
		});

		it("should default lastLogin to null", async () => {
			const user = new User(
				userFixtures.employee(new mongoose.Types.ObjectId())
			);
			const savedUser = await user.save();
			expect(savedUser.lastLogin).toBeNull();
		});

		it("should accept valid lastLogin date", async () => {
			const loginDate = new Date();
			const user = new User(
				userFixtures.employee(new mongoose.Types.ObjectId(), {
					lastLogin: loginDate,
				})
			);
			const savedUser = await user.save();

			expect(savedUser.lastLogin).toBeInstanceOf(Date);
			expect(savedUser.lastLogin.getTime()).toBe(loginDate.getTime());
		});
	});

	describe("Edge Cases - Concurrent Updates", () => {
		it("should handle concurrent username uniqueness", async () => {
			const user1 = new User(
				userFixtures.employee(new mongoose.Types.ObjectId(), {
					username: "sameuser",
					email: "user1@test.com",
				})
			);
			const user2 = new User(
				userFixtures.employee(new mongoose.Types.ObjectId(), {
					username: "sameuser",
					email: "user2@test.com",
				})
			);

			await user1.save();
			await expect(user2.save()).rejects.toThrow();
		});

		it("should handle concurrent email uniqueness", async () => {
			const user1 = new User(
				userFixtures.employee(new mongoose.Types.ObjectId(), {
					username: "user1",
					email: "same@test.com",
				})
			);
			const user2 = new User(
				userFixtures.employee(new mongoose.Types.ObjectId(), {
					username: "user2",
					email: "same@test.com",
				})
			);

			await user1.save();
			await expect(user2.save()).rejects.toThrow();
		});
	});
});
