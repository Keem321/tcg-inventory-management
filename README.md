# TCG Inventory Management System

An inventory management solution designed for a trading card game store to manage warehouse operations across multiple locations.

## Overview

Provides tools for two tiers of user - store partners and employees - to efficiently manage inventory.

Alerts and visualizations assist in maintaining capacity constraints and monitoring stock levels.

## Key Features

### Core Functionality

- **Multi-Warehouse Management**: Track inventory across multiple warehouse locations
- **Product Catalog**: Manage diverse product types including cards, decks, accessories, and bundles
- **Inventory Tracking**: Real-time inventory levels with storage location precision
- **Transfer Management**: Move inventory between warehouses with capacity validation
- **Capacity Monitoring**: Automated alerts for warehouse capacity and low stock levels

### Authentication & Authorization

- **Role-Based Access Control**: Two user roles with distinct permissions
  - **Partners**: Full system access including warehouse management and order approval
  - **Employees**: Inventory viewing, order requests, and transfers
- **Secure Authentication**: Industry-standard password hashing and session management

### Advanced Features

- **Order Request Workflow**: Employees create requests, partners approve
- **Bulk Purchase Constraints**: Enforce minimum order quantities for bulk items
- **Alert System**: Proactive monitoring for capacity issues and stock levels
- **Audit Trail**: Complete history of transfers and inventory changes

## Tech Stack

### Frontend

- **React** - UI component library
- **Vite** - Build tool and dev server
- **Vitest** + **React Testing Library** - Testing framework

### Backend

- **Node.js** + **Express** - REST API server
- **MongoDB** - flexible schema
- **Vitest** - Backend testing

### Testing

- (trying) Test-driven development approach
- Unit tests for components and API endpoints
- Integration tests for workflows

## Project Structure

```
tcg-inventory-management/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.jsx        # Main application component
│   │   ├── setupTests.js  # Test configuration
│   │   └── assets/        # Static assets
│   └── vitest.config.js   # Frontend test config
│
├── server/                 # Express backend
│   ├── index.js           # Server entry point
│   ├── .env               # Environment variables
│   └── vitest.config.js   # Backend test config
│
└── README.md
```

## Database Schema

### Collections

1. **Users** - Authentication and role management
2. **Warehouses** - Location and capacity tracking
3. **Products** - Product catalog with type-specific fields
4. **Inventory** - Stock levels per warehouse
5. **Inventory Transfers** - Transfer history and audit trail
6. **Capacity Alerts** - Automated monitoring alerts
7. **Order Requests** - Employee request workflow

See `MongoDB Schema Design.md` for detailed schema documentation.

## Business Logic

### Capacity Management

- Each product has a `unitSize` representing space consumed
- Warehouse capacity = `sum(inventory items × unitSize)`
- Alerts trigger at 80% capacity (warning) and 100% (critical)

### Bulk Purchase Enforcement

- Products can require bulk-only purchases (e.g., dice sold in sets of 10)
- System validates quantities are multiples of `bulkQuantity`
- Prevents partial bulk orders

### Order Request Workflow

1. Employee submits order request with product, quantity, and destination
2. System validates capacity and bulk constraints
3. Partner reviews and approves/rejects with notes
4. Approved requests automatically add inventory

### Low Stock Alerts

- Each inventory item has configurable `minStockLevel`
- Alerts generated when quantity drops below threshold
- Helps maintain optimal stock without sales tracking

## Development Practices

- **Test-Driven Development**: Tests written alongside features
- **Code Documentation**: JSDoc comments for all functions
- **Industry Standards**: Following SOLID and DRY principles
- **Version Control**: Git workflow with meaningful commits

## Testing

Run frontend tests:

```powershell
cd client; npx vitest
```

Run backend tests:

```powershell
cd server; npx vitest
```

additional notes here as needed

## Security Considerations

- Password hashing with bcrypt
- Input validation on client and server
- Session-based authentication
- Role-based authorization middleware (research)
- Rate limiting on authentication endpoints ??

## Future Enhancements

- Automated reordering based on trends
- Barcode generator for scanning in faster inventory updates
- Advanced reporting and dashboards
- Mobile layout for warehouse workers??

---

**Project Type**: Skillstorm Project 1  
**Developer**: Keem  
**Repository**: [tcg-inventory-management](https://github.com/Keem321/tcg-inventory-management)
