# Optional Fields Handling in POS Backend

This document explains how optional fields are handled in the POS backend system to ensure consistent behavior when fields are not provided by the frontend.

## Overview

The backend now automatically handles optional fields using a combination of:
1. **Custom Decorators** - Transform and apply default values
2. **Utility Functions** - Service-level default value application
3. **Schema Defaults** - Database-level default values
4. **Validation Pipeline** - Automatic transformation during validation

## Custom Decorators

Located in `src/common/decorators/default-value.decorator.ts`:

### Available Decorators

- `@DefaultValue(defaultValue)` - Generic default value decorator
- `@DefaultNumber(defaultValue)` - For numeric fields (default: 0)
- `@DefaultString(defaultValue)` - For string fields (default: '')
- `@DefaultBoolean(defaultValue)` - For boolean fields (default: false)
- `@DefaultDate(defaultValue)` - For date fields (default: new Date())

### Usage in DTOs

```typescript
export class CreateProductDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @DefaultString('')
  description?: string;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  @DefaultNumber(0)
  stock: number;

  @ApiProperty({ default: true })
  @IsBoolean()
  @DefaultBoolean(true)
  isActive: boolean;
}
```

## Utility Functions

Located in `src/common/utils/field-defaults.util.ts`:

### Functions

- `applyDefaults<T>(data, defaults)` - Apply default values to an object
- `cleanObject<T>(obj, defaults?)` - Clean undefined/null values
- `DEFAULT_VALUES` - Predefined default values for entities

### Usage in Services

```typescript
import { applyDefaults, DEFAULT_VALUES } from '../common/utils/field-defaults.util';

async create(createProductDto: CreateProductDto): Promise<Product> {
  // Apply default values for optional fields
  const productData = applyDefaults(createProductDto, DEFAULT_VALUES.product);
  const createdProduct = new this.productModel(productData);
  return createdProduct.save();
}
```

## Default Values Configuration

The `DEFAULT_VALUES` object contains predefined defaults for all entities:

```typescript
export const DEFAULT_VALUES = {
  product: {
    stock: 0,
    minStock: 0,
    image: '',
    barcode: '',
    supplier: '',
    description: '',
  },
  order: {
    discount: 0,
    customerName: '',
    tax: 0,
    timestamp: () => new Date(),
  },
  supplier: {
    email: '',
    address: '',
    phone: '',
  },
  // ... more entities
};
```

## Schema-Level Defaults

Mongoose schemas also include default values:

```typescript
@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, default: 0 })
  stock: number;

  @Prop({ default: '' })
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}
```

## Validation Pipeline

The main application is configured with transformation enabled:

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true, // This enables our decorators
}));
```

## Benefits

1. **Consistent Data** - All optional fields have predictable default values
2. **Frontend Flexibility** - Frontend doesn't need to provide all optional fields
3. **Database Integrity** - No undefined/null values in optional fields
4. **Type Safety** - TypeScript types remain accurate
5. **Maintainability** - Centralized default value management

## Examples

### Creating a Product (Frontend sends minimal data)

**Frontend Request:**
```json
{
  "name": "Test Product",
  "sellingPrice": 100,
  "costPrice": 80,
  "category": "Electronics"
}
```

**Backend Processing:**
- Decorators apply defaults: `stock: 0, minStock: 0, description: '', etc.`
- Service applies additional defaults if needed
- Schema ensures database consistency

**Final Database Record:**
```json
{
  "name": "Test Product",
  "sellingPrice": 100,
  "costPrice": 80,
  "category": "Electronics",
  "stock": 0,
  "minStock": 0,
  "image": "",
  "barcode": "",
  "supplier": "",
  "description": ""
}
```

### Updating with Partial Data

**Frontend Request:**
```json
{
  "name": "Updated Product Name"
}
```

**Backend Processing:**
- Only provided fields are updated
- Optional fields retain their existing values or get defaults if undefined
- No data corruption or undefined values

## Implementation Status

✅ **Completed:**
- Custom decorators for default values
- Utility functions for service-level defaults
- Updated DTOs with appropriate decorators
- Updated services to use utility functions
- Validation pipeline configuration
- Schema-level defaults

This ensures that all optional fields are properly handled throughout the application stack.
