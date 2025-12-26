# Hands-On Tutorial: Building a Feature from Scratch

This tutorial will walk you through building a complete feature (Reviews for Products) step-by-step. Follow along to understand how everything connects!

## What We're Building

A **Product Reviews** feature where customers can:
- Add reviews to products
- View all reviews for a product
- Update their reviews
- Delete their reviews

---

## Step 1: Create the Schema

**File**: `src/schemas/review.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  productId: string;

  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true })
  comment: string;

  @Prop({ default: true })
  isVisible: boolean;
}

export type ReviewDocument = Review & Document;
export const ReviewSchema = SchemaFactory.createForClass(Review);

// Transform _id to id
ReviewSchema.set('toJSON', {
  transform: function(doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Indexes for performance
ReviewSchema.index({ productId: 1 });
ReviewSchema.index({ rating: 1 });
```

**What we did**:
- Created a schema with fields: `productId`, `customerName`, `rating`, `comment`, `isVisible`
- Added validation: `rating` must be between 1-5
- Added indexes for faster queries
- Set up JSON transformation

---

## Step 2: Create DTOs

**File**: `src/reviews/dto/create-review.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min, Max, IsOptional, IsBoolean } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: 'Product ID' })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Customer name' })
  @IsNotEmpty()
  @IsString()
  customerName: string;

  @ApiProperty({ description: 'Rating from 1 to 5', minimum: 1, maximum: 5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Review comment' })
  @IsNotEmpty()
  @IsString()
  comment: string;

  @ApiProperty({ description: 'Is review visible', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
```

**File**: `src/reviews/dto/update-review.dto.ts`

```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateReviewDto } from './create-review.dto';

export class UpdateReviewDto extends PartialType(CreateReviewDto) {}
```

**What we did**:
- Created DTOs with validation decorators
- Used `PartialType` to make all fields optional for updates
- Added Swagger documentation

---

## Step 3: Create the Service

**File**: `src/reviews/reviews.service.ts`

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument } from '../schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Product } from '../schemas/product.schema';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<Review> {
    // Verify product exists
    const product = await this.productModel.findById(createReviewDto.productId).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${createReviewDto.productId} not found`);
    }

    // Create review
    const review = new this.reviewModel({
      ...createReviewDto,
      isVisible: createReviewDto.isVisible ?? true,
    });
    return review.save();
  }

  async findAll(): Promise<Review[]> {
    return this.reviewModel.find().exec();
  }

  async findByProduct(productId: string): Promise<Review[]> {
    // Verify product exists
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    return this.reviewModel.find({ productId, isVisible: true }).exec();
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewModel.findById(id).exec();
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    return review;
  }

  async update(id: string, updateReviewDto: UpdateReviewDto): Promise<Review> {
    // If productId is being updated, verify it exists
    if (updateReviewDto.productId) {
      const product = await this.productModel.findById(updateReviewDto.productId).exec();
      if (!product) {
        throw new NotFoundException(`Product with ID ${updateReviewDto.productId} not found`);
      }
    }

    const updatedReview = await this.reviewModel
      .findByIdAndUpdate(id, updateReviewDto, { new: true })
      .exec();

    if (!updatedReview) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return updatedReview;
  }

  async remove(id: string): Promise<Review> {
    const deletedReview = await this.reviewModel.findByIdAndDelete(id).exec();
    if (!deletedReview) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    return deletedReview;
  }

  async getAverageRating(productId: string): Promise<number> {
    const result = await this.reviewModel.aggregate([
      { $match: { productId, isVisible: true } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]).exec();

    return result.length > 0 ? Math.round(result[0].avgRating * 10) / 10 : 0;
  }
}
```

**What we did**:
- Injected both Review and Product models
- Added validation (checking if product exists)
- Implemented CRUD operations
- Added a bonus method: `getAverageRating` using MongoDB aggregation

---

## Step 4: Create the Controller

**File**: `src/reviews/reviews.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new review' })
  create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(createReviewDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews' })
  findAll() {
    return this.reviewsService.findAll();
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get all reviews for a product' })
  findByProduct(@Param('productId') productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  @Get('product/:productId/average-rating')
  @ApiOperation({ summary: 'Get average rating for a product' })
  getAverageRating(@Param('productId') productId: string) {
    return this.reviewsService.getAverageRating(productId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a review by id' })
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a review' })
  update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
    return this.reviewsService.update(id, updateReviewDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a review' })
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
```

**What we did**:
- Created RESTful endpoints
- Added Swagger documentation
- Used proper HTTP methods
- Added custom routes for product-specific queries

---

## Step 5: Create the Module

**File**: `src/reviews/reviews.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewSchema } from '../schemas/review.schema';
import { ProductSchema } from '../schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Review', schema: ReviewSchema },
      { name: 'Product', schema: ProductSchema },
    ]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
```

**What we did**:
- Registered both Review and Product models (needed for validation)
- Connected controller and service

---

## Step 6: Register Module in AppModule

**File**: `src/app.module.ts`

Add to imports array:
```typescript
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [
    // ... existing imports
    ReviewsModule,  // Add this
  ],
})
```

---

## Step 7: Test Your Feature

### Using Swagger (Recommended)

1. Start your server: `npm run start:dev`
2. Go to: `http://localhost:3000/api`
3. Find the "reviews" section
4. Try creating a review:
   ```json
   {
     "productId": "YOUR_PRODUCT_ID",
     "customerName": "John Doe",
     "rating": 5,
     "comment": "Great product!"
   }
   ```

### Using cURL

```bash
# Create a review
curl -X POST http://localhost:3000/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "YOUR_PRODUCT_ID",
    "customerName": "John Doe",
    "rating": 5,
    "comment": "Great product!"
  }'

# Get all reviews
curl http://localhost:3000/reviews

# Get reviews for a product
curl http://localhost:3000/reviews/product/YOUR_PRODUCT_ID

# Get average rating
curl http://localhost:3000/reviews/product/YOUR_PRODUCT_ID/average-rating
```

---

## Understanding What Happened

### Request Flow

1. **Request arrives**: `POST /reviews`
2. **Controller receives**: `ReviewsController.create()`
3. **Validation**: ValidationPipe checks `CreateReviewDto`
4. **Service called**: `ReviewsService.create()`
5. **Business logic**: 
   - Checks if product exists
   - Creates review
   - Saves to database
6. **Response**: Returns created review

### Key Concepts Demonstrated

1. **Schema Definition**: Structure of data
2. **DTOs**: Validation and type safety
3. **Service Layer**: Business logic
4. **Controller Layer**: HTTP handling
5. **Module System**: Organization
6. **Dependency Injection**: Models injected into service
7. **Error Handling**: NotFoundException for missing data

---

## Challenge Exercises

### Challenge 1: Add Pagination
Modify `findByProduct` to support pagination:
- Add `page` and `limit` query parameters
- Return paginated results

### Challenge 2: Add Sorting
Allow sorting reviews by:
- Date (newest first)
- Rating (highest first)

### Challenge 3: Add Review Limits
Prevent customers from reviewing the same product twice:
- Check if customer already reviewed
- Return appropriate error if duplicate

### Challenge 4: Update Product Rating
When a review is created/updated/deleted:
- Automatically update the product's average rating
- Store it in the Product schema

---

## Common Issues & Solutions

### Issue 1: "Cannot find module"
**Solution**: Check file paths and imports

### Issue 2: "Validation failed"
**Solution**: Check DTO validation rules match your data

### Issue 3: "Product not found"
**Solution**: Make sure productId exists in database

### Issue 4: "Module not registered"
**Solution**: Add module to `app.module.ts` imports

---

## Next Steps

1. **Add Tests**: Create unit tests for service methods
2. **Add Authentication**: Only allow authenticated users to review
3. **Add Moderation**: Admin approval before reviews are visible
4. **Add Images**: Allow customers to upload review images
5. **Add Helpful Votes**: Let users vote if review was helpful

---

## Summary

You've built a complete feature! You learned:
- ✅ Creating schemas
- ✅ Creating DTOs with validation
- ✅ Implementing service logic
- ✅ Creating REST endpoints
- ✅ Organizing with modules
- ✅ Error handling
- ✅ Database relationships

**Keep practicing**: Try building other features like "Wishlist" or "Notifications"!

