# TCG Inventory Management System

Full-stack inventory management system for trading card game stores with multi-location support and role-based access control.

## Features

### Product Management

- Catalog products by brand (Pokemon, MTG, Yu-Gi-Oh!, etc.) and type (booster packs, single cards, decks)
- Track product details including SKU, pricing, and storage size
- Filter and search across all products

### Inventory Tracking

- Separate floor and back storage locations per store
- Real-time inventory levels with location tracking
- Capacity management based on product unit sizes
- Merge duplicate entries automatically

### Multi-Store Operations

- Manage multiple retail locations from a single system
- Monitor capacity usage across all stores
- View inventory breakdown by store and location

### Transfer Request Workflow

- Multi-stage approval process for inventory movement
- Role-based state transitions (open → approved → in-transit → completed)
- Transfer history with status tracking
- Prevents invalid operations (insufficient inventory, same-store transfers)

### Role-Based Access Control

- **Partners**: Full system access, create stores, approve all requests
- **Store Managers**: Manage assigned store, create transfer requests, limited approvals
- **Employees**: View-only access to assigned store
- Dynamic UI based on user permissions

## Tech Stack

**Frontend**: React, Bootstrap, Vite  
**Backend**: Node.js, Express, MongoDB (Mongoose)  
**Testing**: Vitest, React Testing Library

## Architecture

**Three-Layer Backend**:

- Controllers: HTTP request/response handling
- Services: Business logic and validation
- Repositories: Database operations

**Collections**:

- **Users**: Authentication and role-based permissions
- **Stores**: Location data with capacity tracking
- **Products**: Catalog with brand, type, and pricing
- **Inventory**: Stock levels per store (floor/back)
- **TransferRequests**: Inter-store movement workflow with approval states

## Key Implementation Details

**Capacity Management**: Each product has a `unitSize`. Store capacity = sum of (inventory quantity × product unitSize) across all items. Creates/updates validate against available space.

**Transfer Request State Machine**:

- `open` → `approved` (Partner approves)
- `approved` → `in-transit` (Source manager ships - inventory subtracted)
- `in-transit` → `completed` (Destination manager receives - inventory added)
- Any state → `cancelled` (Inventory returned to source)

**Role Permissions**:

- Partners: All operations, view all stores
- Store Managers: CRUD for assigned store, create transfer requests
- Employees: Read-only for assigned store

**Inventory Merging**: System automatically combines duplicate inventory entries (same product, store, and location) to prevent fragmentation.

**Code Quality**:

- JSDoc documentation across all layers
- Centralized error handling utility
- Three-layer architecture (Controller → Service → Repository)

## Setup & Running

**Backend** (Terminal 1):

```powershell
cd server
npm install
npm run dev  # http://localhost:5000
```

**Frontend** (Terminal 2):

```powershell
cd client
npm install
npm run dev  # http://localhost:5173
```

**Testing**:

```powershell
cd client && npx vitest  # Frontend tests
cd server && npx vitest  # Backend tests
```

## Security

- Bcrypt password hashing
- Session-based authentication
- Role-based authorization middleware
- Input validation on client and server
- MongoDB injection prevention via Mongoose

---

**Project Type**: Skillstorm Project 1  
**Developer**: Keem
**Repository**: [tcg-inventory-management](https://github.com/Keem321/tcg-inventory-management)
