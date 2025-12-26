# Architecture Explained: Visual Guide

This document explains the architecture of your POS Backend using visual diagrams and real examples from your codebase.

---

## The Big Picture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Frontend)                        │
│              http://localhost:4200                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP Requests (GET, POST, PUT, DELETE)
                       │ JSON Data
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  NESTJS APPLICATION                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              main.ts (Bootstrap)                     │  │
│  │  - Creates NestJS app                                │  │
│  │  - Configures global pipes, CORS, Swagger           │  │
│  │  - Starts server on port 3000                       │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                       │
│                     ▼                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              app.module.ts (Root Module)             │  │
│  │  - Connects to MongoDB                               │  │
│  │  - Imports all feature modules                       │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                       │
│         ┌───────────┼───────────┐                          │
│         ▼           ▼           ▼                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                  │
│  │ Products │ │ Orders   │ │ Categories│                  │
│  │  Module  │ │  Module  │ │  Module  │                  │
│  └──────────┘ └──────────┘ └──────────┘                  │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    MONGODB DATABASE                         │
│              mongodb://localhost:27017/pos                  │
│                                                             │
│  Collections: products, orders, categories, ...             │
└─────────────────────────────────────────────────────────────┘
```

---

## Request Flow: Step by Step

### Example: Creating a Product

```
Step 1: Frontend sends request
┌─────────────────────────────────────────────────────────┐
│ POST http://localhost:3000/products                    │
│ Content-Type: application/json                          │
│                                                         │
│ {                                                       │
│   "name": "Laptop",                                     │
│   "sellingPrice": 999.99,                              │
│   "costPrice": 700,                                    │
│   "category": "Electronics",                           │
│   "stock": 10                                          │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
Step 2: NestJS receives request
┌─────────────────────────────────────────────────────────┐
│ NestJS Router matches route: POST /products            │
│ Finds: ProductsController.create()                     │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
Step 3: Validation Pipe processes
┌─────────────────────────────────────────────────────────┐
│ ValidationPipe checks data against CreateProductDto:   │
│ ✓ name is string and not empty                         │
│ ✓ sellingPrice is number and >= 0                      │
│ ✓ costPrice is number and >= 0                        │
│ ✓ category is string and not empty                     │
│ ✓ stock is number and >= 0                            │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
Step 4: Controller receives validated data
┌─────────────────────────────────────────────────────────┐
│ ProductsController.create()                            │
│                                                         │
│ create(@Body() createProductDto: CreateProductDto) {   │
│   return this.productsService.create(createProductDto);│
│ }                                                       │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
Step 5: Service processes business logic
┌─────────────────────────────────────────────────────────┐
│ ProductsService.create()                               │
│                                                         │
│ 1. Apply default values                                │
│ 2. Create new Product model instance                   │
│ 3. Save to database                                    │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
Step 6: Database operation
┌─────────────────────────────────────────────────────────┐
│ MongoDB receives insert command                        │
│                                                         │
│ db.products.insertOne({                                │
│   name: "Laptop",                                       │
│   sellingPrice: 999.99,                                │
│   costPrice: 700,                                      │
│   category: "Electronics",                             │
│   stock: 10,                                           │
│   _id: ObjectId("507f1f77bcf86cd799439011"),          │
│   createdAt: ISODate("2024-01-15T10:30:00Z")          │
│ })                                                      │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
Step 7: Response flows back
┌─────────────────────────────────────────────────────────┐
│ Database returns saved document                         │
│         │                                                │
│         ▼                                                │
│ Service returns Product object                          │
│         │                                                │
│         ▼                                                │
│ Controller returns to NestJS                            │
│         │                                                │
│         ▼                                                │
│ NestJS serializes to JSON                               │
│         │                                                │
│         ▼                                                │
│ HTTP Response sent to frontend                          │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
Step 8: Frontend receives response
┌─────────────────────────────────────────────────────────┐
│ HTTP 201 Created                                       │
│                                                         │
│ {                                                       │
│   "id": "507f1f77bcf86cd799439011",                    │
│   "name": "Laptop",                                     │
│   "sellingPrice": 999.99,                              │
│   "costPrice": 700,                                    │
│   "category": "Electronics",                           │
│   "stock": 10,                                         │
│   "createdAt": "2024-01-15T10:30:00.000Z"              │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
```

---

## Module Structure

### Products Module (Example)

```
┌─────────────────────────────────────────────────────────────┐
│                    ProductsModule                           │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Imports:                                             │  │
│  │  - MongooseModule.forFeature([ProductSchema])        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Controllers:                                        │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │ ProductsController                             │  │  │
│  │  │                                                │  │  │
│  │  │ @Get() findAll()                              │  │  │
│  │  │ @Post() create()                              │  │  │
│  │  │ @Get(':id') findOne()                         │  │  │
│  │  │ @Put(':id') update()                          │  │  │
│  │  │ @Delete(':id') remove()                       │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Providers:                                          │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │ ProductsService                                │  │  │
│  │  │                                                │  │  │
│  │  │ constructor(                                   │  │  │
│  │  │   @InjectModel(Product.name)                  │  │  │
│  │  │   private productModel: Model<ProductDocument>│  │  │
│  │  │ )                                             │  │  │
│  │  │                                                │  │  │
│  │  │ async create(dto) { ... }                     │  │  │
│  │  │ async findAll() { ... }                       │  │  │
│  │  │ async findOne(id) { ... }                     │  │  │
│  │  │ async update(id, dto) { ... }                  │  │  │
│  │  │ async remove(id) { ... }                       │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Dependency Injection Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Dependency Injection                      │
│                                                             │
│  When ProductsController needs ProductsService:             │
│                                                             │
│  1. Controller declares dependency:                         │
│     constructor(private readonly productsService:           │
│                 ProductsService) {}                         │
│                                                             │
│  2. NestJS looks for ProductsService in module:            │
│     @Module({                                               │
│       providers: [ProductsService]  ← Found here!          │
│     })                                                      │
│                                                             │
│  3. NestJS creates instance (if not exists):               │
│     - Checks if ProductsService needs dependencies          │
│     - Creates ProductModel instance                        │
│     - Injects into ProductsService                         │
│     - Injects ProductsService into ProductsController     │
│                                                             │
│  4. Controller can now use service:                        │
│     this.productsService.findAll()                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Schema → DTO → Service → Controller

```
┌─────────────────────────────────────────────────────────────┐
│                    Product Schema                            │
│  (Database Structure)                                        │
│                                                             │
│  @Schema({ timestamps: true })                             │
│  export class Product {                                     │
│    @Prop({ required: true })                                │
│    name: string;                                            │
│                                                             │
│    @Prop({ required: true })                               │
│    sellingPrice: number;                                    │
│                                                             │
│    @Prop({ default: 0 })                                    │
│    stock: number;                                           │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Used by
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              CreateProductDto                                │
│  (Validation Rules)                                          │
│                                                             │
│  export class CreateProductDto {                            │
│    @IsNotEmpty()                                            │
│    @IsString()                                              │
│    name: string;                                            │
│                                                             │
│    @IsNotEmpty()                                            │
│    @IsNumber()                                              │
│    @Min(0)                                                  │
│    sellingPrice: number;                                    │
│                                                             │
│    @IsNumber()                                              │
│    @Min(0)                                                  │
│    @DefaultNumber(0)                                        │
│    stock: number;                                           │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Validates
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              ProductsService                                │
│  (Business Logic)                                           │
│                                                             │
│  async create(dto: CreateProductDto): Promise<Product> {   │
│    const productData = applyDefaults(dto, ...);            │
│    const product = new this.productModel(productData);     │
│    return product.save();  // Saves to MongoDB             │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Returns
                            ▼
┌─────────────────────────────────────────────────────────────┐
│            ProductsController                                │
│  (HTTP Handler)                                             │
│                                                             │
│  @Post()                                                    │
│  create(@Body() dto: CreateProductDto) {                   │
│    return this.productsService.create(dto);                 │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Relationships

### One-to-Many: Product → Orders

```
┌─────────────────────────────────────────────────────────────┐
│                    Product Collection                        │
│                                                             │
│  {                                                          │
│    _id: "product123",                                      │
│    name: "Laptop",                                          │
│    price: 999.99                                            │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Referenced by
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Order Collection                         │
│                                                             │
│  {                                                          │
│    _id: "order1",                                          │
│    items: [                                                 │
│      {                                                      │
│        productId: "product123",  ← Reference              │
│        quantity: 2,                                         │
│        price: 999.99                                        │
│      }                                                      │
│    ]                                                        │
│  }                                                          │
│                                                             │
│  {                                                          │
│    _id: "order2",                                          │
│    items: [                                                 │
│      {                                                      │
│        productId: "product123",  ← Same product            │
│        quantity: 1,                                         │
│        price: 999.99                                        │
│      }                                                      │
│    ]                                                        │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

### Many-to-Many: Products ↔ Categories

```
┌─────────────────────────────────────────────────────────────┐
│                  Category Collection                         │
│                                                             │
│  { _id: "cat1", name: "Electronics" }                      │
│  { _id: "cat2", name: "Clothing" }                         │
└─────────────────────────────────────────────────────────────┘
         ▲                              ▲
         │                              │
         │ Referenced by                │ Referenced by
         │                              │
┌─────────────────────────────────────────────────────────────┐
│                  Product Collection                         │
│                                                             │
│  {                                                          │
│    _id: "prod1",                                            │
│    name: "Laptop",                                          │
│    categoryId: "cat1"  ← References Electronics           │
│  }                                                          │
│                                                             │
│  {                                                          │
│    _id: "prod2",                                            │
│    name: "T-Shirt",                                         │
│    categoryId: "cat2"  ← References Clothing              │
│  }                                                          │
│                                                             │
│  {                                                          │
│    _id: "prod3",                                            │
│    name: "Phone",                                           │
│    categoryId: "cat1"  ← Also Electronics                │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Request: GET /products/invalid-id               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         ProductsController.findOne('invalid-id')            │
│                                                             │
│  findOne(@Param('id') id: string) {                        │
│    return this.productsService.findOne(id);                 │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         ProductsService.findOne('invalid-id')               │
│                                                             │
│  async findOne(id: string): Promise<Product> {             │
│    const product = await this.productModel                 │
│      .findById(id).exec();                                 │
│                                                             │
│    if (!product) {  ← Product not found!                   │
│      throw new NotFoundException(                           │
│        `Product with ID ${id} not found`                    │
│      );                                                     │
│    }                                                        │
│                                                             │
│    return product;                                          │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              NestJS Exception Handler                        │
│                                                             │
│  Catches: NotFoundException                                 │
│  Converts to: HTTP 404 Not Found                            │
│                                                             │
│  Response:                                                  │
│  {                                                          │
│    "statusCode": 404,                                       │
│    "message": "Product with ID invalid-id not found",      │
│    "error": "Not Found"                                     │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Client receives error response                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Middleware & Pipes Flow

```
Request
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│              CORS Middleware                                 │
│  Checks if origin is allowed                                │
└─────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│              ValidationPipe                                  │
│                                                             │
│  1. Transforms plain object to DTO instance                │
│  2. Validates against DTO decorators                       │
│  3. Strips unknown properties (whitelist: true)            │
│  4. Throws BadRequestException if validation fails         │
└─────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│              Controller Method                              │
│  Receives validated and transformed DTO                     │
└─────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│              Response Serialization                          │
│  Converts object to JSON                                    │
└─────────────────────────────────────────────────────────────┘
  │
  ▼
Response
```

---

## Module Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                    AppModule (Root)                          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Imports:                                            │  │
│  │  - MongooseModule.forRoot(...)  ← Database          │  │
│  │  - ProductsModule                                    │  │
│  │  - CategoriesModule                                  │  │
│  │  - OrdersModule                                      │  │
│  │  - SuppliersModule                                   │  │
│  │  - ... (all feature modules)                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │              │              │
         │              │              │
         ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Products     │ │ Categories   │ │ Orders       │
│ Module       │ │ Module       │ │ Module       │
│              │ │              │ │              │
│ - Controller │ │ - Controller │ │ - Controller │
│ - Service    │ │ - Service    │ │ - Service    │
│ - Schema     │ │ - Schema     │ │ - Schema     │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## File Organization Pattern

```
src/
│
├── main.ts                    ← Application entry point
├── app.module.ts              ← Root module
│
├── schemas/                   ← Database schemas
│   ├── product.schema.ts
│   ├── order.schema.ts
│   └── category.schema.ts
│
├── products/                  ← Feature module
│   ├── products.module.ts     ← Module definition
│   ├── products.controller.ts ← HTTP handlers
│   ├── products.service.ts    ← Business logic
│   └── dto/                   ← Data Transfer Objects
│       ├── create-product.dto.ts
│       └── update-product.dto.ts
│
├── orders/                    ← Another feature module
│   └── ...
│
└── common/                    ← Shared utilities
    ├── decorators/
    └── utils/
```

**Pattern**: Each feature has its own folder with:
- Module file
- Controller file
- Service file
- DTOs folder

---

## Summary

Your application follows these key architectural patterns:

1. **Modular Architecture**: Each feature is a separate module
2. **Layered Architecture**: Controller → Service → Database
3. **Dependency Injection**: NestJS manages dependencies
4. **Separation of Concerns**: Each layer has one responsibility
5. **RESTful API**: Standard HTTP methods and status codes
6. **Validation**: DTOs ensure data integrity
7. **Error Handling**: Proper exceptions with meaningful messages

Understanding this architecture helps you:
- Know where to add new features
- Understand how data flows
- Debug issues more effectively
- Write maintainable code

---

*Use this guide alongside the code to understand how everything connects!*

