"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type {
  AggregateRating,
  Comment,
  MarketPost,
  Review,
} from "@/types/market-feed";
import { toProductSchema, toReviewSchema } from "@/types/market-feed";

interface PostDetailProps {
  postId: string | null;
  open: boolean;
  onClose: () => void;
  initialPost?: MarketPost;
}

type IconProps = {
  className?: string;
};

function IconX({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 6L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconArrowUpRight({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7 17L17 7M17 7H9M17 7V15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconShieldCheck({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 3l7 3v6c0 4.2-3.1 8.2-7 9-3.9-.8-7-4.8-7-9V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTruck({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 7h11v10H3zM14 10h4l3 4v3h-2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="17" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="17.5" cy="17" r="1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function IconPackage({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 7.5L12 3l9 4.5-9 4.5-9-4.5zM3 7.5V17l9 4 9-4V7.5M12 12v9.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

interface DetailState {
  post: MarketPost | null;
  reviews: Review[];
  aggregateRating: AggregateRating | null;
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
}

const availabilityCopy: Record<string, { label: string; tone: string }> = {
  ACTIVE: { label: "Available", tone: "text-emerald-600 bg-emerald-50" },
  SOLD: { label: "Sold", tone: "text-rose-600 bg-rose-50" },
  EXPIRED: { label: "Expired", tone: "text-slate-600 bg-slate-100" },
  DRAFT: { label: "Draft", tone: "text-amber-600 bg-amber-50" },
};

function formatCurrency(value?: number, currency?: string) {
  if (typeof value !== "number" || !currency) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (error) {
    console.warn("Failed to format currency", error);
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function PostDetail({ postId, open, onClose, initialPost }: PostDetailProps) {
  const [state, setState] = useState<DetailState>({
    post: initialPost ?? null,
    reviews: [],
    aggregateRating: null,
    comments: [],
    isLoading: false,
    error: null,
  });
  const [activeImage, setActiveImage] = useState<string | null>(initialPost?.primaryImage ?? null);

  // Sync initial post when selected
  useEffect(() => {
    if (!initialPost) return;
    setState((prev) => ({
      ...prev,
      post: initialPost,
      error: null,
    }));
    setActiveImage(initialPost.primaryImage ?? initialPost.images?.[0] ?? null);
  }, [initialPost]);

  // Lock background scrolling
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Fetch detail payload
  useEffect(() => {
    if (!open || !postId) return;

    const controller = new AbortController();
    let cancelled = false;

    const load = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const baseUrl = `/api/market/posts/${postId}`;
        const [postRes, reviewsRes, aggregateRes, commentsRes] = await Promise.all([
          fetch(baseUrl, { signal: controller.signal }),
          fetch(`${baseUrl}/reviews`, { signal: controller.signal }),
          fetch(`${baseUrl}/aggregate-rating`, { signal: controller.signal }),
          fetch(`${baseUrl}/comments`, { signal: controller.signal }).catch(() => null),
        ]);

        if (cancelled) return;

        const payload: DetailState = {
          post: postRes.ok ? await postRes.json() : initialPost ?? null,
          reviews: reviewsRes.ok ? await reviewsRes.json() : [],
          aggregateRating: aggregateRes.ok ? await aggregateRes.json() : null,
          comments: commentsRes && commentsRes.ok ? await commentsRes.json() : [],
          isLoading: false,
          error: null,
        };

  setState(payload);
  setActiveImage((prev) => payload.post?.primaryImage ?? payload.post?.images?.[0] ?? prev);
      } catch (error) {
        if (cancelled || controller.signal.aborted) return;
        console.warn(`Failed to load market post ${postId}`, error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "This listing detail is temporarily unavailable.",
        }));
      }
    };

    void load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [open, postId, initialPost]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const productSchema = useMemo(() => {
    if (!state.post?.pricing?.currency || !state.post?.pricing?.price) return null;
    return toProductSchema(
      {
        id: state.post.id,
        name: state.post.headline,
        sku: state.post.sku || state.post.productIds[0] || "",
        currency: state.post.pricing.currency,
        price: state.post.pricing.price,
        image: state.post.primaryImage ?? state.post.images?.[0],
        availability: state.post.stockQuantity && state.post.stockQuantity > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
      },
      state.aggregateRating ?? undefined,
      state.post.brandName
    );
  }, [state.post, state.aggregateRating]);

  const reviewSchema = useMemo(() => {
    if (state.reviews.length === 0) return null;
    return state.reviews.slice(0, 5).map(toReviewSchema);
  }, [state.reviews]);

  if (!open || !postId) {
    return null;
  }

  const { post, reviews, aggregateRating, comments, isLoading, error } = state;
  const gallery = post?.images && post.images.length > 0 ? post.images : post?.primaryImage ? [post.primaryImage] : [];
  const availability = post?.status ? availabilityCopy[post.status] ?? availabilityCopy.ACTIVE : availabilityCopy.ACTIVE;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <section
        className="relative ml-auto flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-none bg-white shadow-2xl sm:rounded-l-3xl"
        role="dialog"
        aria-modal="true"
        aria-label="Listing detail"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Listing detail</p>
            <h2 className="text-lg font-semibold text-slate-900">{post?.headline ?? "Loading"}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            aria-label="Close detail view"
          >
            <IconX className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {isLoading && !post && (
            <div className="flex h-full w-full items-center justify-center p-12 text-sm text-slate-500">
              Loading listing details...
            </div>
          )}

          {!isLoading && error && (
            <div className="p-6 text-sm text-rose-600">{error}</div>
          )}

          {post && (
            <div className="space-y-8 px-6 py-6">
              {/* Image gallery */}
              {gallery.length > 0 && (
                <div>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
                    <Image
                      src={activeImage ?? gallery[0]}
                      alt={post.headline}
                      fill
                      sizes="(min-width: 1024px) 640px, 100vw"
                      className="object-cover"
                    />
                  </div>
                  {gallery.length > 1 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                      {gallery.map((image, index) => (
                        <button
                          key={image}
                          type="button"
                          onClick={() => setActiveImage(image)}
                          className={cn(
                            "relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border",
                            activeImage === image ? "border-blue-500" : "border-transparent"
                          )}
                          aria-label={`View image ${index + 1}`}
                        >
                          <Image src={image} alt="Thumbnail" fill className="object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Pricing & status */}
              <div className="space-y-4 rounded-2xl border border-slate-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{post.brandName}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      {post.brandVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-blue-600">
                          <IconShieldCheck className="h-3.5 w-3.5" /> Verified partner
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">
                          <IconShieldCheck className="h-3.5 w-3.5" /> Unverified listing
                        </span>
                      )}
                      <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500">
                        {post.category ?? "General catalog"}
                      </span>
                    </div>
                  </div>
                  <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", availability.tone)}>
                    {availability.label}
                  </span>
                </div>

                {post.pricing && (
                  <div className="space-y-2">
                    <p className="text-2xl font-semibold text-slate-900">
                      {formatCurrency(post.pricing.price, post.pricing.currency) ?? "Contact for pricing"}
                    </p>
                    {post.pricing.compareAtPrice && post.pricing.price && post.pricing.compareAtPrice > post.pricing.price && (
                      <p className="text-sm text-emerald-600">
                        Save {formatCurrency(post.pricing.compareAtPrice - post.pricing.price, post.pricing.currency)} compared to list price
                      </p>
                    )}
                    {post.pricing.mode !== "FIXED" && (
                      <div className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                        <p className="font-semibold uppercase tracking-wide text-slate-500">Pricing mode: {post.pricing.mode.replace("_", " ")}</p>
                        {post.pricing.mode === "BIDDING" && post.pricing.currentBid && (
                          <p className="mt-1">Current bid: {formatCurrency(post.pricing.currentBid, post.pricing.currency)}</p>
                        )}
                        {post.pricing.mode === "REQUEST_QUOTE" && <p className="mt-1">Request a quote to see negotiated pricing.</p>}
                        {post.pricing.mode === "NEGOTIABLE" && <p className="mt-1">Pricing negotiable based on volume and contract terms.</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Key facts */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    <IconPackage className="h-4 w-4" /> Product details
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {post.sku && <li><span className="font-medium text-slate-800">SKU:</span> {post.sku}</li>}
                    {post.barcode && <li><span className="font-medium text-slate-800">Barcode:</span> {post.barcode}</li>}
                    {post.minimumOrder && <li><span className="font-medium text-slate-800">Minimum order:</span> {post.minimumOrder} units</li>}
                    {post.leadTime && <li><span className="font-medium text-slate-800">Lead time:</span> {post.leadTime} days</li>}
                    {post.returnPolicy && <li><span className="font-medium text-slate-800">Returns:</span> {post.returnPolicy}</li>}
                    {post.warranty && <li><span className="font-medium text-slate-800">Warranty:</span> {post.warranty}</li>}
                    {post.certifications && post.certifications.length > 0 && (
                      <li>
                        <span className="font-medium text-slate-800">Certifications:</span>
                        <span className="ml-1 text-slate-600">{post.certifications.join(", ")}</span>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    <IconTruck className="h-4 w-4" /> Shipping & availability
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {typeof post.stockQuantity === "number" && (
                      <li>
                        <span className="font-medium text-slate-800">Inventory:</span> {post.stockQuantity} units
                        {post.lowStockThreshold && post.stockQuantity <= post.lowStockThreshold && (
                          <span className="ml-2 text-amber-600">(Low stock)</span>
                        )}
                      </li>
                    )}
                    {post.shipping?.shipsFrom && (
                      <li><span className="font-medium text-slate-800">Ships from:</span> {post.shipping.shipsFrom}</li>
                    )}
                    {typeof post.shipping?.shippingCost === "number" && post.pricing?.currency && (
                      <li><span className="font-medium text-slate-800">Shipping cost:</span> {formatCurrency(post.shipping.shippingCost, post.pricing.currency)}</li>
                    )}
                    {typeof post.shipping?.estimatedDays === "number" && (
                      <li><span className="font-medium text-slate-800">Delivery estimate:</span> {post.shipping.estimatedDays} days</li>
                    )}
                    {post.shipping?.freeShipping && <li>Free shipping available</li>}
                    {post.shipping?.restrictions && post.shipping.restrictions.length > 0 && (
                      <li className="text-xs leading-relaxed text-slate-500">
                        Restricted regions: {post.shipping.restrictions.join(", ")}
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Metrics */}
              <div className="rounded-2xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Engagement metrics</h3>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600 sm:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Views</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{post.metrics.views.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Clicks</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{post.metrics.clicks.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Follows</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{post.metrics.follows.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Carts</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{post.metrics.carts.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Reviews */}
              <div className="rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Reviews</h3>
                    {aggregateRating ? (
                      <p className="mt-1 text-sm text-slate-600">
                        Average rating <span className="font-semibold text-slate-900">{aggregateRating.average.toFixed(1)}</span> · {aggregateRating.count} total reviews
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-slate-500">No reviews yet. Be the first to review this listing.</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
                  >
                    Write a review
                    <IconArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  {reviews.slice(0, 3).map((review) => (
                    <article key={review.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center text-amber-500">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <span key={idx} className={cn("h-2.5 w-2.5 rounded-full", idx < review.rating ? "bg-amber-500" : "bg-slate-200")} />
                            ))}
                          </div>
                          <span className="font-semibold text-slate-900">{review.userName ?? "Anonymous"}</span>
                          {review.verifiedPurchase && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-emerald-600">
                              Verified
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      {review.title && <h4 className="mt-2 text-sm font-semibold text-slate-900">{review.title}</h4>}
                      <p className="mt-2 text-sm text-slate-600">{review.body}</p>
                    </article>
                  ))}

                  {reviews.length === 0 && (
                    <p className="text-sm text-slate-500">Reviews will appear here once published.</p>
                  )}
                </div>
              </div>

              {/* Comments */}
              <div className="rounded-2xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Comments</h3>
                <div className="mt-4 space-y-3">
                  {comments.slice(0, 5).map((comment) => (
                    <div key={comment.id} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{comment.userName ?? "Buyer"}</span>
                        <span>{new Date(comment.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="mt-2 leading-relaxed">{comment.body}</p>
                    </div>
                  ))}

                  {comments.length === 0 && (
                    <p className="text-sm text-slate-500">No comments yet. Discussions will show up here.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {productSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(
                reviewSchema ? { ...productSchema, review: reviewSchema } : productSchema,
                null,
                2
              ),
            }}
          />
        )}
      </section>
    </div>
  );
}

export default PostDetail;
