/**
 * Market Feed Ranking Algorithm
 * Scores posts based on recency, engagement, quality, and brand trust
 */

import type { FeedSort, MarketPost } from '@/types/market-feed';

// =========================================================================
// Scoring Weights Configuration
// =========================================================================

export const RANKING_WEIGHTS = {
  recency: 0.35, // 35% - Time decay importance
  engagement: 0.30, // 30% - User interaction signals
  quality: 0.25, // 25% - Review quality and ratings
  brandTrust: 0.10, // 10% - Brand reputation
};

export const ENGAGEMENT_WEIGHTS = {
  views: 1,
  clicks: 3,
  follows: 5,
  carts: 10,
  comments: 4,
  reviews: 8,
};

// Rising algorithm: posts gaining traction in last 15 minutes
export const RISING_WINDOW_MINUTES = 15;

// =========================================================================
// Recency Decay Function
// =========================================================================

/**
 * Calculate recency score with exponential decay
 * @param minutesSincePost - Minutes since post was created
 * @returns Score between 0 and 1
 */
export function recencyDecay(minutesSincePost: number): number {
  // Half-life of 6 hours (360 minutes)
  // After 6 hours, score is 0.5; after 12 hours, 0.25; etc.
  const halfLife = 360;
  return Math.exp(-Math.log(2) * minutesSincePost / halfLife);
}

// =========================================================================
// Engagement Score
// =========================================================================

/**
 * Calculate engagement score from user interactions
 * @param metrics - Post metrics object
 * @returns Normalized engagement score between 0 and 1
 */
export function engagementScore(metrics: MarketPost['metrics']): number {
  const rawScore =
    metrics.views * ENGAGEMENT_WEIGHTS.views +
    metrics.clicks * ENGAGEMENT_WEIGHTS.clicks +
    metrics.follows * ENGAGEMENT_WEIGHTS.follows +
    metrics.carts * ENGAGEMENT_WEIGHTS.carts +
    metrics.comments * ENGAGEMENT_WEIGHTS.comments +
    metrics.reviews * ENGAGEMENT_WEIGHTS.reviews;

  // Normalize using log scale (handles wide range of values)
  // Score of 1000 raw → ~0.5, 10000 raw → ~0.66, 100000 raw → ~0.83
  return Math.log10(rawScore + 1) / Math.log10(100000);
}

// =========================================================================
// Quality Score
// =========================================================================

export interface QualityMetrics {
  reviewAverage?: number; // 1-5 star average
  reviewCount?: number;
  verifiedPurchaseRatio?: number; // 0-1
  returnRate?: number; // 0-1 (lower is better)
}

/**
 * Calculate quality score from review and product metrics
 * @param quality - Quality metrics
 * @returns Score between 0 and 1
 */
export function qualityScore(quality: QualityMetrics): number {
  const {
    reviewAverage = 0,
    reviewCount = 0,
    verifiedPurchaseRatio = 0.5,
    returnRate = 0.05,
  } = quality;

  // If no reviews, use neutral score
  if (reviewCount === 0) return 0.5;

  // Review score normalized to 0-1 (5 stars = 1.0)
  const reviewScore = reviewAverage / 5;

  // Verified purchase bonus (0.5-1.0 range)
  const verifiedBonus = 0.5 + (verifiedPurchaseRatio * 0.5);

  // Return penalty (0.5-1.0 range, lower return rate = higher score)
  const returnPenalty = 1 - (returnRate * 0.5);

  // Confidence factor based on review count (more reviews = higher confidence)
  // Reaches ~0.95 at 100 reviews
  const confidence = 1 - Math.exp(-reviewCount / 50);

  // Weighted average with confidence
  const baseScore = (reviewScore * 0.6 + verifiedBonus * 0.25 + returnPenalty * 0.15);
  
  // Blend with neutral (0.5) based on confidence
  return baseScore * confidence + 0.5 * (1 - confidence);
}

// =========================================================================
// Brand Trust Score
// =========================================================================

export interface BrandMetrics {
  verified?: boolean;
  disputeRate?: number; // 0-1 (lower is better)
  fulfillmentRate?: number; // 0-1 (higher is better)
  responseTime?: number; // hours (lower is better)
  accountAge?: number; // days
}

/**
 * Calculate brand trust score
 * @param brand - Brand metrics
 * @returns Score between 0 and 1
 */
export function brandTrustScore(brand: BrandMetrics): number {
  const {
    verified = false,
    disputeRate = 0.02,
    fulfillmentRate = 0.98,
    responseTime = 24,
    accountAge = 30,
  } = brand;

  // Verified badge gives instant boost
  const verifiedBonus = verified ? 0.2 : 0;

  // Dispute penalty (2% disputes = 0.96, 10% = 0.8)
  const disputeScore = Math.max(0, 1 - disputeRate * 2);

  // Fulfillment score (98% = 0.98, 90% = 0.9)
  const fulfillmentScore = fulfillmentRate;

  // Response time score (24h = 0.8, 12h = 0.9, 6h = 0.95, 1h = 0.99)
  const responseScore = Math.exp(-responseTime / 48);

  // Account age factor (new accounts penalized slightly)
  // 30 days = ~0.95, 90 days = ~0.99, 180 days = ~1.0
  const ageFactor = 1 - Math.exp(-accountAge / 60) * 0.2;

  // Combine all factors
  const baseScore = (
    disputeScore * 0.3 +
    fulfillmentScore * 0.3 +
    responseScore * 0.2 +
    ageFactor * 0.2
  );

  return Math.min(1, baseScore + verifiedBonus);
}

// =========================================================================
// Combined Ranking Score
// =========================================================================

export interface RankingInput {
  post: MarketPost;
  quality?: QualityMetrics;
  brand?: BrandMetrics;
}

export interface ScoreBreakdown {
  total: number;
  recency: number;
  engagement: number;
  quality: number;
  brandTrust: number;
  breakdown: {
    recencyMinutes: number;
    engagementRaw: number;
    qualityDetails?: QualityMetrics;
    brandDetails?: BrandMetrics;
  };
}

/**
 * Calculate overall ranking score for a post
 * @param input - Ranking input with post and optional quality/brand metrics
 * @returns Combined score between 0 and 1 with breakdown
 */
export function calculateRankingScore(input: RankingInput): ScoreBreakdown {
  const { post, quality = {}, brand = {} } = input;

  // Calculate time since post
  const minutesSincePost = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60);

  // Calculate component scores
  const recencyScore = recencyDecay(minutesSincePost);
  const engagementValue = engagementScore(post.metrics);
  const qualityValue = qualityScore(quality);
  const brandTrustValue = brandTrustScore({
    verified: post.brandVerified,
    ...brand,
  });

  // Combine with weights
  const totalScore =
    recencyScore * RANKING_WEIGHTS.recency +
    engagementValue * RANKING_WEIGHTS.engagement +
    qualityValue * RANKING_WEIGHTS.quality +
    brandTrustValue * RANKING_WEIGHTS.brandTrust;

  return {
    total: totalScore,
    recency: recencyScore,
    engagement: engagementValue,
    quality: qualityValue,
    brandTrust: brandTrustValue,
    breakdown: {
      recencyMinutes: minutesSincePost,
      engagementRaw: 
        post.metrics.views * ENGAGEMENT_WEIGHTS.views +
        post.metrics.clicks * ENGAGEMENT_WEIGHTS.clicks +
        post.metrics.follows * ENGAGEMENT_WEIGHTS.follows +
        post.metrics.carts * ENGAGEMENT_WEIGHTS.carts +
        post.metrics.comments * ENGAGEMENT_WEIGHTS.comments +
        post.metrics.reviews * ENGAGEMENT_WEIGHTS.reviews,
      qualityDetails: quality,
      brandDetails: brand,
    },
  };
}

// =========================================================================
// Rising Algorithm (Velocity-based)
// =========================================================================

export interface VelocityMetrics {
  viewsLast15Min: number;
  clicksLast15Min: number;
  cartsLast15Min: number;
}

/**
 * Calculate "Rising" score based on recent velocity
 * Posts with high velocity in last 15 minutes rank higher
 * @param velocity - Recent activity metrics
 * @param minutesSincePost - Age of post in minutes
 * @returns Rising score between 0 and 1
 */
export function risingScore(velocity: VelocityMetrics, minutesSincePost: number): number {
  // Only consider posts between 15 minutes and 24 hours old
  if (minutesSincePost < RISING_WINDOW_MINUTES || minutesSincePost > 1440) {
    return 0;
  }

  const {
    viewsLast15Min,
    clicksLast15Min,
    cartsLast15Min,
  } = velocity;

  // Calculate velocity score
  const velocityRaw =
    viewsLast15Min * 1 +
    clicksLast15Min * 5 +
    cartsLast15Min * 20;

  // Normalize (1000 velocity = 0.5, 10000 = 0.66, 100000 = 0.83)
  const velocityNormalized = Math.log10(velocityRaw + 1) / Math.log10(100000);

  // Age decay (peaks at 2 hours, then slowly decays)
  const peakHours = 2;
  const hoursFromPeak = Math.abs(minutesSincePost / 60 - peakHours);
  const ageMultiplier = Math.exp(-hoursFromPeak / 6);

  return velocityNormalized * ageMultiplier;
}

// =========================================================================
// Explanation Generator
// =========================================================================

/**
 * Generate human-readable explanation for "Why am I seeing this?"
 * @param breakdown - Score breakdown
 * @returns Explanation text
 */
export function generateScoreExplanation(breakdown: ScoreBreakdown): string[] {
  const reasons: string[] = [];

  // Recency reason
  const hours = Math.floor(breakdown.breakdown.recencyMinutes / 60);
  const minutes = Math.floor(breakdown.breakdown.recencyMinutes % 60);
  if (hours < 1) {
    reasons.push(`📅 Posted ${minutes} minute${minutes !== 1 ? 's' : ''} ago (Fresh content)`);
  } else if (hours < 24) {
    reasons.push(`📅 Posted ${hours} hour${hours !== 1 ? 's' : ''} ago`);
  } else {
    const days = Math.floor(hours / 24);
    reasons.push(`📅 Posted ${days} day${days !== 1 ? 's' : ''} ago`);
  }

  // Engagement reason
  if (breakdown.engagement > 0.7) {
    reasons.push(`🔥 High engagement (${breakdown.breakdown.engagementRaw.toLocaleString()} interactions)`);
  } else if (breakdown.engagement > 0.4) {
    reasons.push(`👥 Moderate engagement (${breakdown.breakdown.engagementRaw.toLocaleString()} interactions)`);
  }

  // Quality reason
  if (breakdown.breakdown.qualityDetails?.reviewAverage) {
    const avg = breakdown.breakdown.qualityDetails.reviewAverage;
    if (avg >= 4.5) {
      reasons.push(`⭐ Highly rated (${avg.toFixed(1)}/5.0 stars)`);
    } else if (avg >= 3.5) {
      reasons.push(`⭐ Well rated (${avg.toFixed(1)}/5.0 stars)`);
    }
  }

  // Brand trust reason
  if (breakdown.brandTrust > 0.8) {
    reasons.push(`✓ Verified brand with excellent reputation`);
  } else if (breakdown.brandTrust > 0.6) {
    reasons.push(`✓ Trusted brand`);
  }

  // Overall score
  if (breakdown.total > 0.8) {
    reasons.push(`🎯 Overall score: ${(breakdown.total * 100).toFixed(0)}% (Top content)`);
  } else {
    reasons.push(`🎯 Overall score: ${(breakdown.total * 100).toFixed(0)}%`);
  }

  return reasons;
}

// =========================================================================
// Sort Helpers
// =========================================================================

/**
 * Sort posts by ranking score (Top)
 */
export function sortByTop(posts: MarketPost[]): MarketPost[] {
  return [...posts].sort((a, b) => b.score - a.score);
}

/**
 * Sort posts by recency (New)
 */
export function sortByNew(posts: MarketPost[]): MarketPost[] {
  return [...posts].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Sort posts by rising score (Rising)
 * Note: Requires velocity data from backend
 */
export function sortByRising(
  posts: Array<MarketPost & { velocity?: VelocityMetrics }>
): MarketPost[] {
  return [...posts].sort((a, b) => {
    const aMinutes = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60);
    const bMinutes = (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60);
    
    const aRising = a.velocity ? risingScore(a.velocity, aMinutes) : 0;
    const bRising = b.velocity ? risingScore(b.velocity, bMinutes) : 0;
    
    return bRising - aRising;
  });
}

// =========================================================================
// Helpers for deriving metrics from MarketPost payloads
// =========================================================================

/**
 * Convert optional rating summary on a post into quality metrics
 */
export function buildQualityMetricsFromPost(post: MarketPost): QualityMetrics {
  const summary = post.ratingSummary;

  return {
    reviewAverage: summary?.average,
    reviewCount: summary?.count,
    verifiedPurchaseRatio: summary?.verifiedPurchaseRatio,
    returnRate: summary?.returnRate,
  };
}

/**
 * Convert optional brand reputation data into brand trust metrics
 */
export function buildBrandMetricsFromPost(post: MarketPost): BrandMetrics {
  const reputation = post.brandReputation;

  return {
    verified: post.brandVerified,
    disputeRate: reputation?.disputeRate,
    fulfillmentRate: reputation?.fulfillmentRate,
    responseTime: reputation?.responseTime,
    accountAge: reputation?.accountAge,
  };
}

/**
 * Convenience helper to generate a score breakdown for a single post
 */
export function computeScoreBreakdown(post: MarketPost): ScoreBreakdown {
  return calculateRankingScore({
    post,
    quality: buildQualityMetricsFromPost(post),
    brand: buildBrandMetricsFromPost(post),
  });
}

/**
 * Utility to sort posts based on the currently selected sort option.
 */
export function sortPostsByStrategy(posts: MarketPost[], sort: FeedSort): MarketPost[] {
  switch (sort) {
    case 'top':
      return sortByTop(posts);
    case 'rising':
      return sortByRising(posts);
    case 'new':
    default:
      return sortByNew(posts);
  }
}
