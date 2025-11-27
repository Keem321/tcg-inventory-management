# TCG Inventory Management - Authentication System

## Overview

This project includes a complete authentication system with:

- **Backend**: Express.js REST API with session-based auth
- **Frontend**: React + Bootstrap login & dashboard
- **Database**: MongoDB with Mongoose ODM
- **Security**: bcrypt password hashing, express-session

## Authentication Flow

### Login Process

1. User enters username & password in React form
2. Frontend sends POST to `/api/auth/login`
3. Backend validates credentials with bcrypt
4. Creates session with `req.session.userId`
5. Returns user data (without password hash)
6. Frontend stores user in state & shows Dashboard

### Session Check

1. On app load, frontend calls GET `/api/auth/session`
2. Backend checks if `req.session.userId` exists
3. Returns user data if valid, 401 if not
4. Frontend shows Login or Dashboard accordingly

### Logout Process

1. User clicks Logout button
2. Frontend sends POST to `/api/auth/logout`
3. Backend destroys session with `req.session.destroy()`
4. Frontend clears user state & shows Login

## Role-Based Access Control

### 3-Tier Role System

| Role              | Access Level                            | Store Assignment             |
| ----------------- | --------------------------------------- | ---------------------------- |
| **Employee**      | Store-level access                      | Required (`assignedStoreId`) |
| **Store Manager** | Store management + inter-store requests | Required (`assignedStoreId`) |
| **Partner**       | Full system access                      | Not allowed (must be `null`) |

### Role Validation

- Enforced at **database schema level** via custom validators
- Tested in `User.test.js`
- Middleware available: `requireAuth`, `requireRole(['role1', 'role2'])`, `requirePartner`, `requireManager`

**Test Infrastructure**:

- `mongodb-memory-server` for isolated in-memory database
- Vitest for fast, modern test runner
- Automatic cleanup between tests

## 🔧 API Endpoints

### Authentication Routes (`/api/auth`)

#### POST `/api/auth/login`

Login user and create session

**Request Body:**

```json
{
	"username": "partner",
	"password": "password123"
}
```

**Response (200):**

```json
{
	"success": true,
	"message": "Login successful",
	"user": {
		"id": "...",
		"username": "partner",
		"email": "partner@tcg.com",
		"role": "partner",
		"assignedStoreId": null,
		"firstName": "Alex",
		"lastName": "Partner",
		"fullName": "Alex Partner"
	}
}
```

**Error Responses:**

- `400`: Missing username or password
- `401`: Invalid credentials
- `403`: Inactive account

#### POST `/api/auth/logout`

Logout user and destroy session

**Response (200):**

```json
{
	"success": true,
	"message": "Logout successful"
}
```

#### GET `/api/auth/session`

Check current session and return user data

**Response (200):**

```json
{
	"success": true,
	"user": {
		/* user object */
	}
}
```

**Error Responses:**

- `401`: Not authenticated or session invalid

## Security Features

✅ **Password Hashing**: bcrypt with 10 salt rounds  
✅ **Session Management**: express-session with secure cookies  
✅ **CORS Protection**: Configured for localhost:5173  
✅ **HttpOnly Cookies**: Prevents XSS attacks  
✅ **Schema Validation**: Mongoose validators for data integrity  
✅ **Role Enforcement**: Database-level + middleware protection

## Database Schema

### Users Collection

```javascript
{
  username: String,        // Unique, 3-30 chars
  email: String,           // Unique, valid email format
  passwordHash: String,    // bcrypt hash (never exposed)
  role: String,            // 'employee' | 'store-manager' | 'partner'
  assignedStoreId: ObjectId, // Required for employee/store-manager, null for partner
  firstName: String,
  lastName: String,
  isActive: Boolean,       // Default: true
  lastLogin: Date,         // Updated on each login
  createdAt: Date,         // Auto-managed by Mongoose
  updatedAt: Date          // Auto-managed by Mongoose
}
```

**Indexes:**

- `username` (unique)
- `email` (unique)
- `role, isActive` (compound)
- `assignedStoreId`

**Virtuals:**

- `fullName`: `${firstName} ${lastName}`
