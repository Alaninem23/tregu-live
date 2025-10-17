/**
 * Market Post Detail Page
 * Full post view with gallery, specs, reviews, comments, actions, and schema.org structured data
 */

'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { AggregateRating } from '@/components/AggregateRating';
import { ReviewList } from '@/components/ReviewList';
import { Stars } from '@/components/Stars';
import type { MarketPost, Review, AggregateRating as AggregateRatingType } from '@/types/market-feed';
import { toProductSchema, toAggregateRatingSchema, toReviewSchema } from '@/types/market-feed';

interface PostDetailPageProps {
  params: Promise<{ postId: string }>;
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId } = use(params);
  const [post, setPost] = useState<MarketPost | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [aggregateRating, setAggregateRating] = useState<AggregateRatingType | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPostDetail = async () => {
      try {
        setIsLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8010';

        // Fetch post data
        const postRes = await fetch(`${apiUrl}/api/market/posts/${postId}`);
        if (!postRes.ok) throw new Error('Post not found');
        const postData: MarketPost = await postRes.json();
        setPost(postData);

        // Fetch reviews for first product if any
        if (postData.productIds && postData.productIds.length > 0) {
          const productId = postData.productIds[0];
          
          const [reviewsRes, ratingRes] = await Promise.all([
            fetch(`${apiUrl}/api/products/${productId}/reviews?limit=20`),
            fetch(`${apiUrl}/api/products/${productId}/aggregate-rating`)
          ]);

          if (reviewsRes.ok) {
            const reviewsData = await reviewsRes.json();
            setReviews(reviewsData.reviews || []);
          }

          if (ratingRes.ok) {
            const ratingData = await ratingRes.json();
            setAggregateRating(ratingData);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPostDetail();
  }, [postId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading post...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Post not found'}</p>
          <Link href="/market" className="text-brand-600 hover:text-brand-700">
            ← Back to Market
          </Link>
        </div>
      </div>
    );
  }

  // Generate schema.org structured data (if product data available)
  const structuredData = post.productIds && post.productIds.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": post.headline,
    "description": post.description || post.headline,
    "brand": {
      "@type": "Brand",
      "name": post.brandName
    },
    ...(post.primaryImage && { "image": post.primaryImage }),
    ...(aggregateRating && aggregateRating.count > 0 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": aggregateRating.average,
        "reviewCount": aggregateRating.count,
        "bestRating": 5,
        "worstRating": 1
      }
    }),
    ...(reviews.length > 0 && {
      "review": reviews.slice(0, 5).map(review => ({
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": review.rating,
          "bestRating": 5,
          "worstRating": 1
        },
        "author": {
          "@type": "Person",
          "name": review.userName || "Anonymous"
        },
        "reviewBody": review.body,
        "datePublished": review.createdAt
      }))
    })
  } : null;

  const images = post.primaryImage ? [post.primaryImage] : [];
  const isLive = Date.now() - new Date(post.createdAt).getTime() < 5 * 60 * 1000;

  return (
    <>
      {/* Inject schema.org structured data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}

      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b shadow-sm">
          <div className="container py-3">
            <Link href="/market" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Market
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="container py-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column: Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square bg-white rounded-xl border overflow-hidden">
                {images.length > 0 ? (
                  <img
                    src={images[selectedImageIndex]}
                    alt={post.headline}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                    <span className="text-6xl font-bold text-slate-400">
                      {post.brandName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {isLive && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-full">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    Live
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-20 h-20 rounded-lg border-2 overflow-hidden transition ${
                        selectedImageIndex === idx ? 'border-brand-600' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Post Info */}
            <div className="space-y-6">
              {/* Brand Header */}
              <div className="flex items-center gap-3">
                {post.brandLogo ? (
                  <img src={post.brandLogo} alt={post.brandName} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold">
                    {post.brandName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{post.brandName}</h3>
                    {post.brandVerified && (
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">Verified Partner</p>
                </div>
              </div>

              {/* Post Type Badge */}
              {post.type && (
                <div>
                  <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                    post.type === 'NEW' ? 'bg-green-50 text-green-700' :
                    post.type === 'PRICE_DROP' ? 'bg-orange-50 text-orange-700' :
                    post.type === 'RESTOCK' ? 'bg-blue-50 text-blue-700' :
                    'bg-slate-50 text-slate-700'
                  }`}>
                    {post.type === 'NEW' ? 'New Product' :
                     post.type === 'PRICE_DROP' ? 'Price Drop' :
                     post.type === 'RESTOCK' ? 'Back in Stock' :
                     'Catalog Update'}
                  </span>
                </div>
              )}

              {/* Headline */}
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{post.headline}</h1>
                {post.description && (
                  <p className="text-slate-600 leading-relaxed">{post.description}</p>
                )}
              </div>

              {/* Category & Tags */}
              {(post.category || (post.tags && post.tags.length > 0)) && (
                <div className="flex flex-wrap gap-2">
                  {post.category && (
                    <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded">
                      {post.category}
                    </span>
                  )}
                  {post.tags?.map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 text-xs text-slate-600 bg-slate-50 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Pricing Section */}
              {post.pricing && (
                <div className="p-4 bg-gradient-to-br from-brand-50 to-white rounded-lg border-2 border-brand-200">
                  {/* Fixed Price */}
                  {post.pricing.mode === 'FIXED' && post.pricing.price && (
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-brand-600">
                          {post.pricing.currency} ${post.pricing.price.toFixed(2)}
                        </span>
                        {post.pricing.compareAtPrice && post.pricing.compareAtPrice > post.pricing.price && (
                          <span className="text-lg text-slate-400 line-through">
                            ${post.pricing.compareAtPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {post.pricing.compareAtPrice && post.pricing.compareAtPrice > post.pricing.price && (
                        <p className="text-sm font-medium text-green-600 mt-1">
                          Save ${(post.pricing.compareAtPrice - post.pricing.price).toFixed(2)} (
                          {Math.round(((post.pricing.compareAtPrice - post.pricing.price) / post.pricing.compareAtPrice) * 100)}% off)
                        </p>
                      )}
                    </div>
                  )}

                  {/* Bidding/Auction */}
                  {post.pricing.mode === 'BIDDING' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="text-sm font-semibold text-slate-700">Auction</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs text-slate-600">Current Bid:</span>
                        <span className="text-2xl font-bold text-brand-600">
                          ${post.pricing.currentBid?.toFixed(2) || post.pricing.startingBid?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      {post.pricing.bidCount !== undefined && post.pricing.bidCount > 0 && (
                        <p className="text-xs text-slate-600">
                          {post.pricing.bidCount} bid{post.pricing.bidCount !== 1 ? 's' : ''}
                        </p>
                      )}
                      {post.pricing.auctionEndDate && (
                        <p className="text-xs font-medium text-orange-600">
                          Ends: {new Date(post.pricing.auctionEndDate).toLocaleString()}
                        </p>
                      )}
                      {post.pricing.bidIncrement && (
                        <p className="text-xs text-slate-500">
                          Minimum increment: ${post.pricing.bidIncrement.toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Request Quote */}
                  {post.pricing.mode === 'REQUEST_QUOTE' && (
                    <div className="text-center py-2">
                      <p className="text-lg font-semibold text-slate-700">Request Quote</p>
                      <p className="text-xs text-slate-500 mt-1">Contact seller for pricing</p>
                    </div>
                  )}

                  {/* Negotiable */}
                  {post.pricing.mode === 'NEGOTIABLE' && post.pricing.price && (
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-brand-600">
                          ${post.pricing.price.toFixed(2)}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          Negotiable
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Open to offers</p>
                    </div>
                  )}

                  {/* Minimum Order */}
                  {post.minimumOrder && post.minimumOrder > 1 && (
                    <div className="mt-3 pt-3 border-t border-brand-100">
                      <p className="text-xs text-slate-600">
                        Minimum Order: <span className="font-medium">{post.minimumOrder} units</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Stock & Availability */}
              {post.stockQuantity !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  {post.stockQuantity > 0 ? (
                    <>
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium text-green-600">
                        In Stock ({post.stockQuantity} available)
                      </span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="font-medium text-red-600">Out of Stock</span>
                    </>
                  )}
                </div>
              )}

              {/* Dimensions */}
              {post.dimensions && (
                <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                  <p className="font-medium text-slate-700">Product Dimensions</p>
                  {post.dimensions.length && post.dimensions.width && post.dimensions.height && (
                    <p className="text-slate-600">
                      Size: {post.dimensions.length} × {post.dimensions.width} × {post.dimensions.height} {post.dimensions.unit}
                    </p>
                  )}
                  {post.dimensions.weight && (
                    <p className="text-slate-600">
                      Weight: {post.dimensions.weight} {post.dimensions.weightUnit}
                    </p>
                  )}
                </div>
              )}

              {/* Shipping */}
              {post.shipping && (
                <div className="p-3 bg-blue-50 rounded-lg text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                    <span className="font-medium text-blue-900">Shipping</span>
                  </div>
                  {post.shipping.freeShipping ? (
                    <p className="text-green-600 font-medium">Free Shipping</p>
                  ) : (
                    <p className="text-slate-700">
                      Cost: <span className="font-medium">${post.shipping.shippingCost?.toFixed(2)}</span>
                    </p>
                  )}
                  {post.shipping.estimatedDays && (
                    <p className="text-slate-600 text-xs mt-1">
                      Estimated delivery: {post.shipping.estimatedDays} days
                    </p>
                  )}
                </div>
              )}

              {/* Business Details */}
              {(post.warranty || post.returnPolicy || post.certifications) && (
                <div className="p-3 bg-slate-50 rounded-lg space-y-2 text-xs">
                  <p className="font-medium text-slate-700">Business Details</p>
                  {post.warranty && (
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-slate-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="text-slate-600">{post.warranty}</span>
                    </div>
                  )}
                  {post.returnPolicy && (
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-slate-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      <span className="text-slate-600">{post.returnPolicy}</span>
                    </div>
                  )}
                  {post.certifications && post.certifications.length > 0 && (
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-slate-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      <span className="text-slate-600">
                        Certified: {post.certifications.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Aggregate Rating */}
              {aggregateRating && aggregateRating.count > 0 && (
                <div className="p-4 bg-white rounded-lg border">
                  <AggregateRating rating={aggregateRating} />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button className="flex-1 px-6 py-3 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition">
                  Add to Cart
                </button>
                <button className="px-6 py-3 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition">
                  Watch
                </button>
                <button className="px-6 py-3 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition">
                  Follow Brand
                </button>
              </div>

              {/* Social Metrics */}
              <div className="flex items-center gap-6 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {post.metrics.views.toLocaleString()} views
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {post.metrics.comments.toLocaleString()} comments
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  {post.metrics.reviews.toLocaleString()} reviews
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          {reviews.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Customer Reviews</h2>
              <ReviewList reviews={reviews} />
            </div>
          )}

          {/* Comments Section (Placeholder) */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Comments</h2>
            <div className="bg-white rounded-xl border p-8 text-center text-slate-500">
              <p>No comments yet. Be the first to comment!</p>
              <button className="mt-4 px-6 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition">
                Add Comment
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
