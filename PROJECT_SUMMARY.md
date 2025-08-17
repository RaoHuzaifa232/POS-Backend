# POS Backend Project Summary

## Overview
This is a comprehensive Point of Sale (POS) backend system built with NestJS and MongoDB. The system has been updated with new schemas and features to support modern POS requirements.

## Architecture
- **Framework**: NestJS with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **API Documentation**: Swagger/OpenAPI
- **Validation**: Class-validator and class-transformer

## Updated Schemas

### Product Schema
- `name`: Product name
- `price`: Selling price
- `costPrice`: Purchase cost
- `description`: Product description
- `stock`: Current stock level
- `minStock`: Minimum stock alert level
- `categoryId`: Associated category
- `barcode`: Product barcode
- `supplier`: Supplier information
- `image`: Product image URL
- `createdAt`: Creation timestamp

### Category Schema
- `name`: Category name
- `description`: Category description
- `color`: Category color for UI
- `createdAt`: Creation timestamp

### Supplier Schema
- `name`: Supplier name
- `contact`: Primary contact person
- `address`: Supplier address
- `phone`: Contact phone
- `email`: Contact email
- `createdAt`: Creation timestamp

### Order Schema
- `orderNumber`: Unique order identifier
- `items`: Array of order items
- `total`: Order total before tax/discount
- `tax`: Tax amount
- `discount`: Discount amount
- `finalTotal`: Final amount after tax/discount
- `paymentMethod`: Payment method (cash/card/digital)
- `customerName`: Customer name
- `type`: Order type (sale/purchase)
- `status`: Order status
- `createdAt`: Creation timestamp

### Purchase Schema
- `productId`: Associated product
- `productName`: Product name
- `quantity`: Purchase quantity
- `costPrice`: Unit cost price
- `totalCost`: Total cost
- `supplier`: Supplier information
- `invoiceNumber`: Invoice reference
- `purchaseDate`: Purchase date
- `notes`: Additional notes

### Stock Movement Schema
- `productId`: Associated product
- `productName`: Product name
- `type`: Movement type (in/out/adjustment)
- `quantity`: Movement quantity
- `reason`: Movement reason
- `reference`: Reference document
- `createdAt`: Creation timestamp

### Sales Return Schema
- `orderId`: Original order reference
- `productId`: Product being returned
- `productName`: Product name
- `quantity`: Return quantity
- `unitPrice`: Unit price at time of sale
- `totalAmount`: Total return amount
- `reason`: Return reason
- `returnDate`: Return date
- `customerName`: Customer name
- `status`: Return status (pending/approved/rejected)
- `notes`: Additional notes

### Purchase Return Schema
- `purchaseId`: Original purchase reference
- `productId`: Product being returned
- `productName`: Product name
- `quantity`: Return quantity
- `unitPrice`: Unit price at time of purchase
- `totalAmount`: Total return amount
- `reason`: Return reason
- `returnDate`: Return date
- `supplier`: Supplier information
- `status`: Return status (pending/approved/rejected)
- `notes`: Additional notes

## API Endpoints

### Products
- `GET /products` - Get all products
- `GET /products/:id` - Get product by ID
- `POST /products` - Create new product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Categories
- `GET /categories` - Get all categories
- `GET /categories/:id` - Get category by ID
- `POST /categories` - Create new category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

### Suppliers
- `GET /suppliers` - Get all suppliers
- `GET /suppliers/:id` - Get supplier by ID
- `POST /suppliers` - Create new supplier
- `PUT /suppliers/:id` - Update supplier
- `DELETE /suppliers/:id` - Delete supplier

### Orders
- `GET /orders` - Get all orders
- `GET /orders/:id` - Get order by ID
- `POST /orders` - Create new order
- `PUT /orders/:id` - Update order
- `DELETE /orders/:id` - Delete order

### Purchases
- `GET /purchases` - Get all purchases
- `GET /purchases/:id` - Get purchase by ID
- `POST /purchases` - Create new purchase
- `PUT /purchases/:id` - Update purchase
- `DELETE /purchases/:id` - Delete purchase

### Stock Movements
- `GET /stock-movements` - Get all stock movements
- `GET /stock-movements/:id` - Get movement by ID
- `POST /stock-movements` - Create new movement
- `PUT /stock-movements/:id` - Update movement
- `DELETE /stock-movements/:id` - Delete movement

### Sales Returns
- `GET /sales-returns` - Get all sales returns
- `GET /sales-returns/:id` - Get return by ID
- `POST /sales-returns` - Create new return
- `PUT /sales-returns/:id` - Update return
- `DELETE /sales-returns/:id` - Delete return

### Purchase Returns
- `GET /purchase-returns` - Get all purchase returns
- `GET /purchase-returns/:id` - Get return by ID
- `POST /purchase-returns` - Create new return
- `PUT /purchase-returns/:id` - Update return
- `DELETE /purchase-returns/:id` - Delete return

## Running the Application

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start MongoDB**:
   Ensure MongoDB is running on `localhost:27017`

3. **Start the application**:
   ```bash
   npm run start:dev
   ```

4. **Access Swagger documentation**:
   Open `http://localhost:3000/api` in your browser

## Database Configuration
- **Database**: `pos`
- **Connection**: `mongodb://localhost:27017/pos`

## Features
- Complete CRUD operations for all entities
- Comprehensive validation with DTOs
- Swagger API documentation
- Error handling with appropriate HTTP status codes
- MongoDB integration with Mongoose
- Modular architecture following NestJS best practices
