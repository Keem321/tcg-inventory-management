/**
 * Tests for User Model
 */

import { describe, it, expect, beforeEach } from "vitest";
import { User } from "../../src/models/User.js";
import mongoose from "mongoose";
import "../setup.js"; // Import test setup

describe("User Model", () => {
	describe("Schema Validation", () => {
		it("should create a valid employee user", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData = {
				username: "johndoe",
				email: "john@example.com",
				passwordHash: "hashedpassword123",
				role: "employee",
				assignedStoreId: storeId,
				firstName: "John",
				lastName: "Doe",
			};

			const user = new User(userData);
			const savedUser = await user.save();

			expect(savedUser._id).toBeDefined();
			expect(savedUser.username).toBe("johndoe");
			expect(savedUser.email).toBe("john@example.com");
			expect(savedUser.role).toBe("employee");
			expect(savedUser.assignedStoreId.toString()).toBe(storeId.toString());
			expect(savedUser.isActive).toBe(true);
			expect(savedUser.createdAt).toBeInstanceOf(Date);
		});

		it("should create a valid store-manager user", async () => {
			const storeId = new mongoose.Types.ObjectId();
			const userData = {
				username: "janesmith",
				email: "jane@example.com",
				passwordHash: "hashedpassword456",
				role: "store-manager",
				assignedStoreId: storeId,
				firstName: "Jane",
				lastName: "Smith",
			};

			const user = new User(userData);
			const savedUser = await user.save();

			expect(savedUser.role).toBe("store-manager");
			expect(savedUser.assignedStoreId).toBeDefined();
		});

		it("should create a valid partner user without assigned store", async () => {
			const userData = {
				username: "partner1",
				email: "partner@example.com",
				passwordHash: "hashedpassword789",
				role: "partner",
				assignedStoreId: null,
				firstName: "Alex",
				lastName: "Partner",
			};

			const user = new User(userData);
			const savedUser = await user.save();

			expect(savedUser.role).toBe("partner");
			expect(savedUser.assignedStoreId).toBeNull();
		});

		it("should fail if username is missing", async () => {
			const userData = {
				email: "test@example.com",
				passwordHash: "hash",
				role: "employee",
				assignedStoreId: new mongoose.Types.ObjectId(),
				firstName: "Test",
				lastName: "User",
			};

			const user = new User(userData);
			await expect(user.save()).rejects.toThrow();
		});

		it("should fail if email is invalid", async () => {
			const userData = {
				username: "testuser",
				email: "invalid-email",
				passwordHash: "hash",
				role: "employee",
				assignedStoreId: new mongoose.Types.ObjectId(),
				firstName: "Test",
				lastName: "User",
			};

			const user = new User(userData);
			await expect(user.save()).rejects.toThrow();
		});

		it("should fail if role is invalid", async () => {
			const userData = {
				username: "testuser",
				email: "test@example.com",
				passwordHash: "hash",
				role: "invalid-role",
				assignedStoreId: new mongoose.Types.ObjectId(),
				firstName: "Test",
				lastName: "User",
			};

			const user = new User(userData);
			await expect(user.save()).rejects.toThrow();
		});

		it("should fail if employee/store-manager missing assignedStoreId", async () => {
			const userData = {
				username: "testuser",
				email: "test@example.com",
				passwordHash: "hash",
				role: "employee",
				assignedStoreId: null,
				firstName: "Test",
				lastName: "User",
			};

			const user = new User(userData);
			await expect(user.save()).rejects.toThrow();
		});

		it("should fail if partner has assignedStoreId", async () => {
			const userData = {
				username: "testpartner",
				email: "partner@example.com",
				passwordHash: "hash",
				role: "partner",
				assignedStoreId: new mongoose.Types.ObjectId(),
				firstName: "Test",
				lastName: "Partner",
			};

			const user = new User(userData);
			await expect(user.save()).rejects.toThrow();
		});

		it("should enforce unique username", async () => {
			const userData1 = {
				username: "sameuser",
				email: "user1@example.com",
				passwordHash: "hash",
				role: "employee",
				assignedStoreId: new mongoose.Types.ObjectId(),
				firstName: "User",
				lastName: "One",
			};

			const userData2 = {
				username: "sameuser",
				email: "user2@example.com",
				passwordHash: "hash",
				role: "employee",
				assignedStoreId: new mongoose.Types.ObjectId(),
				firstName: "User",
				lastName: "Two",
			};

			await new User(userData1).save();
			await expect(new User(userData2).save()).rejects.toThrow();
		});

		it("should enforce unique email", async () => {
			const userData1 = {
				username: "user1",
				email: "same@example.com",
				passwordHash: "hash",
				role: "employee",
				assignedStoreId: new mongoose.Types.ObjectId(),
				firstName: "User",
				lastName: "One",
			};

			const userData2 = {
				username: "user2",
				email: "same@example.com",
				passwordHash: "hash",
				role: "employee",
				assignedStoreId: new mongoose.Types.ObjectId(),
				firstName: "User",
				lastName: "Two",
			};

			await new User(userData1).save();
			await expect(new User(userData2).save()).rejects.toThrow();
		});
	});

	describe("Virtual Properties", () => {
		it("should generate fullName virtual property", async () => {
			const userData = {
				username: "johndoe",
				email: "john@example.com",
				passwordHash: "hash",
				role: "partner",
				firstName: "John",
				lastName: "Doe",
			};

			const user = new User(userData);
			const savedUser = await user.save();

			expect(savedUser.fullName).toBe("John Doe");
		});
	});

	describe("User Queries", () => {
		beforeEach(async () => {
			// Create test data
			const storeId1 = new mongoose.Types.ObjectId();
			const storeId2 = new mongoose.Types.ObjectId();

			await User.create([
				{
					username: "employee1",
					email: "emp1@example.com",
					passwordHash: "hash",
					role: "employee",
					assignedStoreId: storeId1,
					firstName: "Employee",
					lastName: "One",
				},
				{
					username: "employee2",
					email: "emp2@example.com",
					passwordHash: "hash",
					role: "employee",
					assignedStoreId: storeId2,
					firstName: "Employee",
					lastName: "Two",
					isActive: false,
				},
				{
					username: "manager1",
					email: "mgr1@example.com",
					passwordHash: "hash",
					role: "store-manager",
					assignedStoreId: storeId1,
					firstName: "Manager",
					lastName: "One",
				},
				{
					username: "partner1",
					email: "partner1@example.com",
					passwordHash: "hash",
					role: "partner",
					firstName: "Partner",
					lastName: "One",
				},
			]);
		});

		it("should find users by role", async () => {
			const employees = await User.find({ role: "employee" });
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
			const user = await User.findOne({ email: "emp1@example.com" });
			expect(user.username).toBe("employee1");
		});
	});
});
