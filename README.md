# TCG Inventory Management System

A comprehensive inventory management solution designed for trading card game stores to manage retail operations across multiple store locations.

## Overview

This system empowers store staff at three permission levels - Employees, Store Managers, and Partners - to efficiently manage inventory across sales floors and back storage areas. The dynamic interface adapts based on user role and assigned store, providing appropriate tools and visibility for each user's responsibilities.

Intelligent alerts and multi-level floor display management ensure optimal product representation and inventory control.

## Key Features

### Core Functionality

- **Multi-Store Management**: Track inventory across multiple retail store locations
- **Floor & Back Inventory**: Separate tracking for sales floor display and back storage
- **Product Catalog**: Manage diverse product types by brand (Pokemon, MTG, Yu-Gi-Oh!, etc.)
- **Inventory Tracking**: Real-time inventory levels with precise location tracking (floor/back, aisle/bin)
- **Transfer Management**: Move inventory between stores or between floor and back with validation
- **Intelligent Alerts**: Multi-level monitoring for capacity, stock levels, and floor display requirements

### Authentication & Authorization

- **Three-Tier Role-Based Access Control**: Dynamic permissions with store assignment
  - **Employees**: Store-level access, create order requests, move items floor↔back
  - **Store Managers**: Full store management, approve employee requests, create inter-store transfer requests
  - **Partners**: System-wide access including store creation, all approvals, global configuration
- **Store Assignment**: Employees and Store Managers assigned to specific stores; Partners have global access
- **Dynamic UI**: Interface adapts based on role and store assignment
- **Secure Authentication**: Industry-standard password hashing and session management

### Advanced Features

- **Multi-Level Floor Display Management**: Configure minimums at 4 granularities:
  - Specific product (e.g., "Crimson Vow Collector Booster")
  - Product type + brand (e.g., "Booster Packs" for "Pokemon")
  - Product type across brands (e.g., all "Booster Packs")
  - Brand across types (e.g., all "Magic: The Gathering" products)
- **Tiered Approval Workflow**: Employee requests → Store Manager/Partner approval
- **Inter-Store Transfer Requests**: Store Managers request, Partners approve
- **Bulk Purchase Constraints**: Enforce minimum order quantities for bulk items
- **High-Value Item Alerts**: Notify managers of expensive cards in back storage
- **Audit Trail**: Complete history of transfers, requests, and inventory changes

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

## Database Schema

### Collections

1. **Users** - Authentication, role management, and store assignment
2. **Stores** - Retail locations with floor and back capacity tracking
3. **Products** - Product catalog with brand, type, and product-specific fields
4. **Inventory** - Stock levels per store with floor/back location tracking
5. **Inventory Transfers** - Transfer history between stores with approval workflow
6. **Capacity Alerts** - Automated monitoring alerts with multiple trigger types
7. **Order Requests** - Employee request workflow with manager/partner approval
8. **Floor Display Config** - Multi-level minimum configuration (product/type/brand)

## Business Logic

### Store Structure

- All locations are retail stores with both sales floor and back storage
- Inventory tracked separately for "floor" (customer-facing) and "back" (storage)
- Enables retail-specific workflows like floor restocking and high-value item security

### Capacity Management

- Each product has a `unitSize` representing space consumed
- Store capacity = `sum(inventory items × unitSize)` across floor + back
- Alerts trigger at 80% capacity (warning) and 100% (critical)

### Floor Display Management

Four-level hierarchical system for minimum floor quantities:

1. **Specific Product**: Individual SKU minimums (e.g., "Crimson Vow Collector Booster" = 10)
2. **Product Type + Brand**: Type within brand (e.g., "Booster Packs" for "Pokemon" = 20)
3. **Product Type**: Type across all brands (e.g., all "Deck Boxes" = 15)
4. **Brand**: All products from brand (e.g., all "Magic: The Gathering" = 50)

Most specific configuration takes precedence. Store Managers configure per-store; Partners set system-wide defaults.

### Product Organization

- **brand**: Game/product line (e.g., "Pokemon", "Magic: The Gathering", "Yu-Gi-Oh!")
- **productType**: Item category (e.g., "boosterPack", "collectorBooster", "deck", "singleCard")
- **name**: Specific product/set (e.g., "Crimson Vow Collector Booster", "Base Set Booster Pack")

### Bulk Purchase Enforcement

- Products can require bulk-only purchases (e.g., dice sold in sets of 10)
- System validates quantities are multiples of `bulkQuantity`
- Prevents partial bulk orders

### Approval Workflows

#### Order Requests (Adding Inventory)

1. Employee submits request with product, quantity, destination (floor/back)
2. System validates capacity and bulk constraints
3. Store Manager (for their store) or Partner approves/rejects
4. Approved requests automatically add inventory

#### Inter-Store Transfers

1. Store Manager or Partner initiates transfer request
2. System validates source quantity and destination capacity
3. If Store Manager initiated: Partner must approve
4. If Partner initiated: Auto-approved
5. Transfer completes, both stores updated

### Alert Types

- **Near-Capacity**: Store reaches 80% of max capacity
- **Over-Capacity**: Attempt to exceed store capacity
- **Low Stock**: Inventory falls below configured `minStockLevel`
- **Low Floor Display**: Floor inventory below configured minimum (any of 4 levels)
- **High-Value Card**: Expensive card in back storage (suggest moving to floor display)

## Development Practices

- **Test-Driven Development**: Tests written alongside features
- **Code Documentation**: JSDoc comments for all functions
- **Industry Standards**: Following SOLID and DRY principles
- **Dynamic UI Design**: Interface adapts to user role and store assignment
- **Permission-Based Features**: All actions validated against user role
- **Version Control**: Git workflow with meaningful commits

## Running

**Terminal 1 - Backend Server:**

```powershell
cd server
npm run dev
```

Server runs on http://localhost:5000

**Terminal 2 - Frontend Client:**

```powershell
cd client
npm run dev
```

Client runs on http://localhost:5173

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

- Sales tracking and analytics integration
- Automated reordering based on sales trends and stock levels
- Barcode scanning for faster inventory updates
- Advanced reporting dashboards with cross-store comparisons
- Mobile app for store employees
- Point-of-sale (POS) system integration
- Customer loyalty program integration
- Mobile layout for warehouse workers??

---

**Project Type**: Skillstorm Project 1  
**Developer**: Keem  
**Repository**: [tcg-inventory-management](https://github.com/Keem321/tcg-inventory-management)
