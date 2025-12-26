# Quick Reference Guide

A cheat sheet for common backend development tasks in your NestJS project.

---

## NestJS Decorators Cheat Sheet

### Module Decorators
```typescript
@Module({
  imports: [OtherModule],
  controllers: [MyController],
  providers: [MyService],
  exports: [MyService],  // Make available to other modules
})
```

### Controller Decorators
```typescript
@Controller('route')           // Base route
@Get()                         // GET /route
@Get(':id')                    // GET /route/:id
@Post()                        // POST /route
@Put(':id')                    // PUT /route/:id
@Patch(':id')                  // PATCH /route/:id
@Delete(':id')                 // DELETE /route/:id

@Body()                        // Request body
@Param('id')                   // URL parameter
@Query('search')               // Query parameter
@Headers('authorization')      // Header value
```

### Service Decorators
```typescript
@Injectable()                  // Makes class injectable
```

### Validation Decorators (class-validator)
```typescript
@IsString()                   // Must be string
@IsNumber()                   // Must be number
@IsBoolean()                  // Must be boolean
@IsArray()                    // Must be array
@IsOptional()                 // Field is optional
@IsNotEmpty()                 // Cannot be empty
@IsEmail()                    // Must be valid email
@Min(0)                       // Minimum value
@Max(100)                     // Maximum value
@Length(3, 20)                // String length
@Matches(/regex/)             // Regex pattern
```

### Swagger Decorators
```typescript
@ApiTags('products')           // Group in Swagger
@ApiOperation({ summary: '...' })  // Endpoint description
@ApiProperty()                // Property documentation
@ApiResponse({ status: 200 }) // Response documentation
```

---

## MongoDB/Mongoose Operations

### Create
```typescript
// Method 1: Create and save
const product = new this.productModel(data);
await product.save();

// Method 2: Create directly
await this.productModel.create(data);
```

### Read
```typescript
// Find all
await this.productModel.find().exec();

// Find one
await this.productModel.findOne({ name: 'Laptop' }).exec();

// Find by ID
await this.productModel.findById(id).exec();

// Find with conditions
await this.productModel.find({ stock: { $gt: 0 } }).exec();

// Count documents
await this.productModel.countDocuments({ stock: 0 }).exec();
```

### Update
```typescript
// Update and return updated document
await this.productModel.findByIdAndUpdate(
  id,
  { stock: 10 },
  { new: true }
).exec();

// Update multiple
await this.productModel.updateMany(
  { stock: 0 },
  { $set: { status: 'out-of-stock' } }
).exec();
```

### Delete
```typescript
// Delete one
await this.productModel.findByIdAndDelete(id).exec();

// Delete multiple
await this.productModel.deleteMany({ stock: 0 }).exec();
```

### Query Operators
```typescript
// Comparison
{ price: { $gt: 100 } }      // Greater than
{ price: { $gte: 100 } }      // Greater than or equal
{ price: { $lt: 100 } }       // Less than
{ price: { $lte: 100 } }      // Less than or equal
{ price: { $ne: 100 } }       // Not equal
{ price: { $in: [10, 20, 30] } }  // In array

// Logical
{ $or: [{ stock: 0 }, { price: 0 }] }  // OR
{ $and: [{ stock: { $gt: 0 } }, { price: { $gt: 0 } }] }  // AND
{ $not: { stock: 0 } }       // NOT

// Array
{ tags: { $in: ['electronics'] } }  // Array contains
{ tags: { $all: ['electronics', 'sale'] } }  // Array contains all

// Text search
{ $text: { $search: 'laptop' } }  // Text search (requires text index)
```

### Aggregation
```typescript
await this.productModel.aggregate([
  { $match: { stock: { $gt: 0 } } },  // Filter
  { $group: { _id: '$category', total: { $sum: '$stock' } } },  // Group
  { $sort: { total: -1 } },  // Sort
  { $limit: 10 }  // Limit
]).exec();
```

---

## Common Patterns

### CRUD Service Pattern
```typescript
@Injectable()
export class MyService {
  constructor(
    @InjectModel(MyModel.name) private model: Model<MyDocument>,
  ) {}

  async create(dto: CreateDto): Promise<MyModel> {
    const item = new this.model(dto);
    return item.save();
  }

  async findAll(): Promise<MyModel[]> {
    return this.model.find().exec();
  }

  async findOne(id: string): Promise<MyModel> {
    const item = await this.model.findById(id).exec();
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return item;
  }

  async update(id: string, dto: UpdateDto): Promise<MyModel> {
    const item = await this.model
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return item;
  }

  async remove(id: string): Promise<MyModel> {
    const item = await this.model.findByIdAndDelete(id).exec();
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return item;
  }
}
```

### CRUD Controller Pattern
```typescript
@Controller('items')
export class MyController {
  constructor(private readonly service: MyService) {}

  @Post()
  create(@Body() dto: CreateDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
```

---

## Error Handling

### Common Exceptions
```typescript
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

// Throw errors
throw new NotFoundException('Product not found');
throw new BadRequestException('Invalid data');
throw new ConflictException('Product already exists');
```

### Custom Error Messages
```typescript
throw new NotFoundException(`Product with ID ${id} not found`);
```

---

## DTO Patterns

### Create DTO
```typescript
export class CreateItemDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  description?: string;
}
```

### Update DTO
```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateItemDto } from './create-item.dto';

export class UpdateItemDto extends PartialType(CreateItemDto) {}
```

---

## Schema Patterns

### Basic Schema
```typescript
@Schema({ timestamps: true })
export class Item {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: 0 })
  quantity: number;

  @Prop()
  description?: string;
}

export type ItemDocument = Item & Document;
export const ItemSchema = SchemaFactory.createForClass(Item);
```

### Schema with References
```typescript
@Schema({ timestamps: true })
export class Order {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  productId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId?: string;
}
```

### Schema with Indexes
```typescript
ItemSchema.index({ name: 1 });  // Single field index
ItemSchema.index({ name: 1, category: 1 });  // Compound index
ItemSchema.index({ name: 'text', description: 'text' });  // Text index
```

### Schema Transform
```typescript
ItemSchema.set('toJSON', {
  transform: function(doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});
```

---

## Module Registration

### Feature Module
```typescript
@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Item', schema: ItemSchema }]),
  ],
  controllers: [ItemsController],
  providers: [ItemsService],
})
export class ItemsModule {}
```

### Root Module
```typescript
@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/pos'),
    ItemsModule,
    // ... other modules
  ],
})
export class AppModule {}
```

---

## Useful Commands

### NPM Scripts
```bash
npm run start          # Start in production mode
npm run start:dev      # Start in development (watch mode)
npm run start:debug    # Start with debugger
npm run build          # Build for production
npm run test           # Run tests
npm run test:watch     # Run tests in watch mode
npm run lint           # Lint code
npm run format         # Format code with Prettier
```

### MongoDB Shell Commands
```javascript
// Connect
use pos

// Find
db.products.find()
db.products.findOne({ name: "Laptop" })

// Insert
db.products.insertOne({ name: "Laptop", price: 999 })

// Update
db.products.updateOne({ name: "Laptop" }, { $set: { price: 899 } })

// Delete
db.products.deleteOne({ name: "Laptop" })
```

---

## TypeScript Types

### Common Types
```typescript
// Primitives
string
number
boolean
null
undefined

// Arrays
string[]
number[]
Array<string>

// Objects
{ name: string; age: number }
Record<string, any>

// Functions
() => void
(id: string) => Promise<Product>
```

### Generic Types
```typescript
Promise<Product>           // Promise that resolves to Product
Model<ProductDocument>     // Mongoose model type
Array<T>                   // Generic array
```

---

## Environment Variables

### Using .env file
```typescript
// .env
MONGODB_URI=mongodb://localhost:27017/pos
PORT=3000
JWT_SECRET=your-secret-key

// In code
process.env.MONGODB_URI
process.env.PORT ?? 3000
```

### Install dotenv
```bash
npm install @nestjs/config
```

---

## Testing Patterns

### Service Test
```typescript
describe('ProductsService', () => {
  let service: ProductsService;
  let model: Model<ProductDocument>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getModelToken(Product.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    model = module.get<Model<ProductDocument>>(getModelToken(Product.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

---

## Performance Tips

1. **Use Indexes**: Index frequently queried fields
2. **Limit Results**: Use `.limit()` and `.skip()` for pagination
3. **Select Fields**: Use `.select()` to only fetch needed fields
4. **Use Lean**: Use `.lean()` for read-only queries (faster)
5. **Batch Operations**: Use `insertMany()` instead of multiple `save()`

```typescript
// Good: Only fetch needed fields
await this.model.find().select('name price').exec();

// Good: Use lean for read-only
await this.model.find().lean().exec();

// Good: Pagination
await this.model.find().skip(0).limit(10).exec();
```

---

## Security Checklist

- [ ] Validate all input (use DTOs)
- [ ] Sanitize user input
- [ ] Use environment variables for secrets
- [ ] Enable CORS properly
- [ ] Use HTTPS in production
- [ ] Implement authentication
- [ ] Implement authorization
- [ ] Rate limiting
- [ ] Input size limits
- [ ] SQL injection prevention (MongoDB is safer, but still validate)

---

## Debugging Tips

1. **Console Logging**
```typescript
console.log('Debug:', data);
```

2. **Use Debugger**
```typescript
debugger;  // Set breakpoint
```

3. **Check Swagger**: Test endpoints in Swagger UI
4. **Check MongoDB**: Verify data in database
5. **Check Logs**: Look at server console output

---

*Keep this reference handy while coding!*

