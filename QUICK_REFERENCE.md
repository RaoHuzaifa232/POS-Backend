# Quick Reference Guide - New Features & API Updates

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/pos

# Enable Database Seeding (development only)
ENABLE_SEED=false

# Application Port
PORT=3000
```

### MongoDB Replica Set Setup (for Transactions)

For full transaction support, configure MongoDB as a replica set:

```bash
# Start MongoDB in replica set mode
mongod --replSet rs0 --port 27017

# In MongoDB shell, initialize replica set
mongosh
rs.initiate()
```

---

## 📝 Logging

All services now include structured logging:

### Log Levels
- `error` - Errors and exceptions
- `warn` - Warnings (e.g., hard deletes)
- `log` - Important operations (e.g., order creation)
- `debug` - Detailed operation info

### Example Output
```
[OrdersService] Creating new order with 3 items
[OrdersService] Transaction started
[OrdersService] Stock updated for product Coffee: 50 -> 47
[OrdersService] Order created with ID: 507f1f77bcf86cd799439011
[OrdersService] Order 507f1f77bcf86cd799439011 created successfully with transaction
```

---

## 🛍️ Order Creation

### Server-Side Total Validation

The server now computes and validates order totals. Client-provided totals must match server calculations (within 0.01 tolerance).

**Request Example:**
```json
{
  "items": [
    {
      "product": "507f1f77bcf86cd799439011",
      "quantity": 2,
      "subtotal": 9.98
    }
  ],
  "total": 9.98,
  "tax": 0.80,
  "discount": 0.00,
  "finalTotal": 10.78,
  "paymentMethod": "cash",
  "type": "sale"
}
```

**Server Actions:**
1. Fetches actual product prices from database
2. Computes `actualSubtotal = product.sellingPrice × quantity`
3. Validates client's subtotal matches (within 0.01)
4. Computes final total with tax and discount
5. Uses server-computed values to create order

**Error Response (if totals don't match):**
```json
{
  "statusCode": 400,
  "message": "Total validation failed. Expected: 10.78, Received: 10.99"
}
```

---

## 🔒 Transaction Support

### Automatic Transaction Detection

Orders are created with transactions when MongoDB replica set is detected:

```typescript
// With Replica Set - Full ACID Transactions
✅ All operations in single transaction
✅ Automatic rollback on failure
✅ Perfect consistency

// Without Replica Set - Atomic Operations
✅ Atomic stock updates (no race conditions)
✅ Manual rollback on failure
✅ Best-effort consistency
```

### Race Condition Prevention

Stock updates use atomic conditional operations:

```typescript
// This is ONE atomic database operation
// Prevents race conditions between concurrent orders
await productModel.findOneAndUpdate(
  { _id: productId, stock: { $gte: quantity } }, // Condition
  { $inc: { stock: -quantity } }                 // Update
);
```

**Concurrent Order Scenario:**
```
Product Stock: 5 units

Order A (3 units) and Order B (4 units) created simultaneously:
- One succeeds, one fails with "Insufficient stock"
- Stock never goes negative
- No manual locking required
```

---

## 🗑️ Soft Deletes

### Orders Service

**Soft Delete (Default - Recommended):**
```http
DELETE /orders/:id
```
- Sets `deletedAt` timestamp
- Order hidden from listings
- Data preserved for audit trail
- Can be restored

**Hard Delete (Permanent):**
```typescript
// Not exposed via API by default - requires service modification
await ordersService.hardDelete(orderId);
```

**Restore Deleted Order:**
```typescript
await ordersService.restore(orderId);
```

### Products Service

Same soft delete functionality applies to products:

```http
DELETE /products/:id  # Soft delete
```

---

## 📊 API Changes

### New Query Behavior

All queries now exclude soft-deleted records by default:

```typescript
// GET /orders
// Returns only non-deleted orders
[
  { "id": "...", "total": 100 },
  { "id": "...", "total": 200 }
  // Deleted orders not included
]

// GET /products
// Returns only non-deleted products
```

### Soft-Deleted Records

Soft-deleted records have `deletedAt` field:

```json
{
  "id": "507f1f77bcf86cd799439011",
  "total": 100,
  "deletedAt": "2024-01-15T10:30:00.000Z"
}
```

---

## 🌱 Database Seeding

### Enable Seeding

Set environment variable:
```bash
ENABLE_SEED=true npm run start:dev
```

### Disable Seeding (Default)

```bash
npm run start:dev
# or
ENABLE_SEED=false npm run start:dev
```

### Seed Data

The seed service creates:
- 4 Categories (Beverages, Food, Snacks, Electronics)
- 3 Suppliers
- 4 Payment Methods
- 6 Products

### Behavior

- Only seeds if database is empty (`productCount === 0`)
- Logs all actions
- Safe to run multiple times (idempotent)

---

## 🔍 Debugging & Monitoring

### Check Transaction Support

Look for this log message on startup:
```
[OrdersService] Creating new order with X items
[OrdersService] Transaction started  # ← Transactions available
```

Or:
```
[OrdersService] MongoDB transactions not available. Using atomic operations...
```

### Monitor Stock Changes

```
[StockService] Recording out stock movement for product 507f...: 3 units
[StockService] Stock movement recorded with ID 507f...
```

### Track Soft Deletes

```
[OrdersService] Soft deleting order 507f...
[OrdersService] Order 507f... soft deleted successfully
```

### Hard Delete Warnings

```
[OrdersService] HARD DELETING order 507f... - This action is irreversible
[OrdersService] Order 507f... permanently deleted
```

---

## 🧪 Testing

### Test Race Conditions

Create concurrent orders for same product:

```javascript
// Both orders try to buy product with stock=5
const [result1, result2] = await Promise.allSettled([
  fetch('/orders', { 
    method: 'POST', 
    body: JSON.stringify({ items: [{ product: productId, quantity: 3 }] }) 
  }),
  fetch('/orders', { 
    method: 'POST', 
    body: JSON.stringify({ items: [{ product: productId, quantity: 4 }] }) 
  })
]);

// One succeeds, one fails with 400 "Insufficient stock"
```

### Test Total Validation

```javascript
// Try to manipulate price
const order = {
  items: [
    { product: coffeeId, quantity: 1, subtotal: 1.00 }  // Real price: 4.99
  ],
  total: 1.00,
  finalTotal: 1.00,
  // ...
};

// Server responds: 400 "Total validation failed. Expected: 4.99, Received: 1.00"
```

### Test Soft Deletes

```javascript
// Delete order
const deleted = await fetch(`/orders/${orderId}`, { method: 'DELETE' });
console.log(deleted.deletedAt); // timestamp

// Verify not in list
const orders = await fetch('/orders').then(r => r.json());
console.log(orders.find(o => o.id === orderId)); // undefined
```

---

## 📈 Performance Considerations

### Indexes

Soft delete queries use indexes:
```javascript
// Recommended index for performance
db.orders.createIndex({ deletedAt: 1 });
db.products.createIndex({ deletedAt: 1 });
```

### Query Patterns

```javascript
// Efficient - uses index
.find({ deletedAt: { $exists: false } })

// Include deleted records (admin view)
.find({}) // No filter on deletedAt
```

---

## 🚨 Common Issues & Solutions

### Issue: "MongoDB transactions not available"

**Cause:** MongoDB not configured as replica set

**Solution:**
```bash
# Single-node replica set (development)
mongod --replSet rs0
mongosh
rs.initiate()
```

### Issue: "Total validation failed"

**Cause:** Client calculated total doesn't match server

**Solutions:**
1. Use server prices (don't cache prices client-side)
2. Accept server-computed totals as source of truth
3. Check for floating-point rounding (0.01 tolerance)

### Issue: "Insufficient stock" on low-traffic site

**Cause:** Stale product data on client

**Solution:**
1. Fetch fresh product data before order creation
2. Handle 400 errors gracefully
3. Show updated stock to user

---

## 📚 Code Examples

### Create Order with Logging

```typescript
try {
  const order = await orderService.create(createOrderDto);
  console.log('Order created:', order.id);
} catch (error) {
  if (error.message.includes('Insufficient stock')) {
    // Handle out of stock
  } else if (error.message.includes('Total validation failed')) {
    // Handle price mismatch
  }
}
```

### Soft Delete with Restore Option

```typescript
// Delete order
await orderService.remove(orderId);

// User changes mind - restore
await orderService.restore(orderId);

// Permanent delete (use sparingly)
await orderService.hardDelete(orderId);
```

### Query Deleted Records (Admin)

```typescript
// Override soft delete filter
const allOrders = await orderModel.find({}).exec();
const deletedOrders = allOrders.filter(o => o.deletedAt);
```

---

## ✅ Checklist for Production

- [ ] MongoDB configured as replica set
- [ ] `ENABLE_SEED=false` in production
- [ ] Indexes created for `deletedAt` fields
- [ ] Log aggregation configured (e.g., ELK, CloudWatch)
- [ ] Monitor for transaction errors
- [ ] Backup strategy for hard deletes
- [ ] Client updated to handle total validation errors
- [ ] Race condition tests passing

---

## 📞 Support

For issues or questions:
1. Check logs for detailed error messages
2. Review `IMPROVEMENTS.md` for detailed explanations
3. Test with `LOG_LEVEL=debug` for more details

