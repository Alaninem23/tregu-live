/**
 * Market Live Newsfeed - Type Definitions
 * Real-time feed showing catalog posts, products, reviews, and interactions
 */

// ============================================================================
// Core Feed Types
// ============================================================================

export type PostType = 'NEW' | 'PRICE_DROP' | 'RESTOCK' | 'CATALOG' | 'AUCTION';

export type PricingMode = 'FIXED' | 'BIDDING' | 'REQUEST_QUOTE' | 'NEGOTIABLE';

export type ListingStatus = 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'DRAFT';

export interface PricingDetails {
  mode: PricingMode;
  currency: string; // ISO 4217 (USD, EUR, etc.)
  
  // Fixed price
  price?: number;
  compareAtPrice?: number; // Original price for showing discounts
  
  // Bidding/Auction
  startingBid?: number;
  currentBid?: number;
  bidCount?: number;
  reservePrice?: number; // Minimum acceptable price (hidden)
  bidIncrement?: number;
  auctionEndDate?: string; // ISO 8601
  
  // Bulk pricing
  minQuantity?: number;
  maxQuantity?: number;
  bulkDiscounts?: Array<{
    minQty: number;
    price: number;
    discount?: number; // Percentage
  }>;
}

export interface ProductDimensions {
  length?: number;
  width?: number;
  height?: number;
  unit: 'in' | 'cm' | 'mm' | 'ft' | 'm'; // Length unit
  weight?: number;
  weightUnit: 'lb' | 'kg' | 'oz' | 'g';
}

export interface ProductVariant {
  id: string;
  name: string; // e.g., "Size", "Color", "Material"
  options: Array<{
    value: string; // e.g., "Small", "Red", "Cotton"
    sku?: string;
    price?: number; // Price override
    inStock: boolean;
    imageUrl?: string;
  }>;
}

export interface ShippingDetails {
  freeShipping: boolean;
  shippingCost?: number;
  estimatedDays?: number; // Delivery time
  shipsFrom?: string; // City/State/Country
  restrictions?: string[]; // Countries/regions that cannot be shipped to
}

export interface MarketPost {
  id: string;
  brandId: string;
  brandName: string;
  brandLogo?: string;
  brandVerified: boolean;
  type: PostType;
  productIds: string[];
  headline: string;
  description?: string;
  primaryImage?: string;
  images?: string[]; // Additional images
  createdAt: string; // ISO 8601
  updatedAt?: string; // ISO 8601
  metrics: PostMetrics;
  score: number; // Denormalized for fast sort
  status?: ListingStatus;
  
  // Enhanced product details
  category?: string; // e.g., "Electronics > Computers > Laptops"
  tags?: string[]; // Searchable tags
  pricing?: PricingDetails;
  dimensions?: ProductDimensions;
  variants?: ProductVariant[];
  shipping?: ShippingDetails;
  // Optional quality/brand metadata used by ranking helpers
  ratingSummary?: {
    average?: number;
    count?: number;
    verifiedPurchaseRatio?: number;
    returnRate?: number;
  };
  brandReputation?: {
    disputeRate?: number;
    fulfillmentRate?: number;
    responseTime?: number;
    accountAge?: number;
  };
  
  // Stock and availability
  stockQuantity?: number;
  lowStockThreshold?: number;
  sku?: string;
  barcode?: string; // UPC/EAN
  
  // Business features
  minimumOrder?: number; // MOQ
  leadTime?: number; // Days for made-to-order
  returnPolicy?: string;
  warranty?: string;
  certifications?: string[]; // e.g., ["ISO 9001", "CE", "UL"]
}

export interface PostMetrics {
  views: number;
  clicks: number;
  follows: number;
  carts: number;
  comments: number;
  reviews: number;
}

// ============================================================================
// Review Types
// ============================================================================

export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName?: string; // Display name (optional, can be anonymous)
  rating: ReviewRating;
  title?: string;
  body: string;
  media?: string[]; // Image URLs
  verifiedPurchase: boolean;
  createdAt: string; // ISO 8601
  helpful: number; // Upvote count
  reports: number; // Abuse report count
}

export interface AggregateRating {
  productId: string;
  average: number; // 1.0 - 5.0
  count: number; // Total reviews
  breakdown: [number, number, number, number, number]; // [5-star, 4-star, 3-star, 2-star, 1-star]
}

// ============================================================================
// Comment Types
// ============================================================================

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName?: string;
  body: string;
  createdAt: string; // ISO 8601
  reports: number;
}

// ============================================================================
// Product Types (for feed cards)
// ============================================================================

export interface ProductSummary {
  id: string;
  sku: string;
  name: string;
  price: number;
  currency: string;
  image?: string;
  availability: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'PREORDER';
  inventoryCount?: number;
}

// ============================================================================
// Feed API Types
// ============================================================================

export type FeedSort = 'top' | 'new' | 'rising';

export type FeedFilter = 'all' | 'following' | 'price_change' | 'new_products' | 'trending';

export interface FeedQuery {
  sort?: FeedSort;
  filter?: FeedFilter;
  category?: string;
  after?: string; // Cursor for pagination
  limit?: number;
}

export interface FeedResponse {
  items: MarketPost[];
  nextCursor?: string;
  hasMore: boolean;
}

// ============================================================================
// Real-time Event Types (SSE)
// ============================================================================

export type FeedEventType = 'post_created' | 'metric_updated' | 'post_deleted';

export interface FeedEvent {
  type: FeedEventType;
  data: MarketPost | { id: string; metrics: PostMetrics; score: number } | { id: string };
  timestamp: string; // ISO 8601
}

// ============================================================================
// Schema.org Structured Data Types (for SEO)
// ============================================================================

/**
 * Product structured data (schema.org/Product)
 * Use this for rich snippets in search results
 */
export interface ProductStructuredData {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  image?: string | string[];
  description?: string;
  sku?: string;
  brand?: {
    '@type': 'Brand';
    name: string;
  };
  offers?: {
    '@type': 'Offer';
    url?: string;
    priceCurrency: string;
    price: number;
    availability: string; // schema.org/InStock, schema.org/OutOfStock, etc.
  };
  aggregateRating?: AggregateRatingStructuredData;
}

/**
 * AggregateRating structured data (schema.org/AggregateRating)
 * Include with Product to show star ratings in search
 */
export interface AggregateRatingStructuredData {
  '@type': 'AggregateRating';
  ratingValue: number; // 1.0 - 5.0
  reviewCount: number;
  bestRating?: number; // Default 5
  worstRating?: number; // Default 1
}

/**
 * Review structured data (schema.org/Review)
 * Include individual reviews for search visibility
 */
export interface ReviewStructuredData {
  '@context': 'https://schema.org';
  '@type': 'Review';
  author: {
    '@type': 'Person';
    name: string;
  };
  datePublished: string; // ISO 8601
  reviewBody: string;
  reviewRating: {
    '@type': 'Rating';
    ratingValue: ReviewRating;
    bestRating: 5;
    worstRating: 1;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Convert AggregateRating to schema.org format
 */
export function toAggregateRatingSchema(rating: AggregateRating): AggregateRatingStructuredData {
  return {
    '@type': 'AggregateRating',
    ratingValue: rating.average,
    reviewCount: rating.count,
    bestRating: 5,
    worstRating: 1,
  };
}

/**
 * Convert Review to schema.org format
 */
export function toReviewSchema(review: Review): ReviewStructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.userName || 'Anonymous',
    },
    datePublished: review.createdAt,
    reviewBody: review.body,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
  };
}

/**
 * Convert ProductSummary + AggregateRating to schema.org format
 */
export function toProductSchema(
  product: ProductSummary,
  rating?: AggregateRating,
  brandName?: string
): ProductStructuredData {
  const availabilityMap: Record<string, string> = {
    IN_STOCK: 'https://schema.org/InStock',
    LOW_STOCK: 'https://schema.org/LimitedAvailability',
    OUT_OF_STOCK: 'https://schema.org/OutOfStock',
    PREORDER: 'https://schema.org/PreOrder',
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image,
    sku: product.sku,
    brand: brandName
      ? {
          '@type': 'Brand',
          name: brandName,
        }
      : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: product.currency,
      price: product.price,
      availability: availabilityMap[product.availability] || 'https://schema.org/InStock',
    },
    aggregateRating: rating ? toAggregateRatingSchema(rating) : undefined,
  };
}
