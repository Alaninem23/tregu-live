"use client";

import Image from "next/image";
import type { MarketPost } from "@/types/market-feed";

type IconProps = {
  className?: string;
};

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function IconMessageCircle({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337c-.836.628-1.813 1.076-2.864 1.272-.331.062-.642-.195-.642-.531v-.318c0-.146.064-.284.175-.379a5.972 5.972 0 001.445-1.965C4.93 16.178 4 14.189 4 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconEye({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.1 12.322a1 1 0 010-.644C3.53 7.48 7.387 4.5 12 4.5s8.469 2.98 9.9 7.178a1 1 0 010 .644C20.47 16.52 16.613 19.5 12 19.5S3.53 16.52 2.1 12.322z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconStar({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M11.48 3.5a.562.562 0 011.04 0l2.124 5.111a.563.563 0 00.476.345l5.518.442c.498.04.7.663.32.988l-4.203 3.602a.563.563 0 00-.182.557l1.285 5.386a.562.562 0 01-.84.609l-4.724-2.884a.563.563 0 00-.586 0L6.98 20.54a.562.562 0 01-.84-.61l1.286-5.386a.563.563 0 00-.183-.557L3.04 10.386c-.38-.324-.177-.947.32-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

const TYPE_STYLE: Record<MarketPost["type"], { label: string; className: string }> = {
  NEW: { label: "New Listing", className: "bg-blue-50 text-blue-700" },
  PRICE_DROP: { label: "Price Drop", className: "bg-emerald-50 text-emerald-700" },
  RESTOCK: { label: "Restock", className: "bg-purple-50 text-purple-700" },
  CATALOG: { label: "Catalog Update", className: "bg-indigo-50 text-indigo-700" },
  AUCTION: { label: "Auction", className: "bg-amber-50 text-amber-700" },
};

const CURRENCY = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function resolveAvailability(post: MarketPost) {
  if (post.status === "SOLD") {
    return { label: "Sold", className: "bg-rose-50 text-rose-700" };
  }
  if (post.stockQuantity === 0) {
    return { label: "Out of stock", className: "bg-rose-50 text-rose-700" };
  }
  if (
    typeof post.stockQuantity === "number" &&
    typeof post.lowStockThreshold === "number" &&
    post.stockQuantity <= post.lowStockThreshold
  ) {
    return { label: "Low stock", className: "bg-amber-50 text-amber-700" };
  }
  if (post.status === "ACTIVE" || post.status === undefined) {
    return { label: "In stock", className: "bg-emerald-50 text-emerald-700" };
  }
  return { label: post.status.toLowerCase(), className: "bg-slate-100 text-slate-600" };
}

function resolvePrice(post: MarketPost) {
  const pricing = post.pricing;
  if (!pricing) return null;
  if (pricing.mode === "BIDDING" || pricing.mode === "REQUEST_QUOTE") {
    const current = pricing.currentBid ?? pricing.startingBid;
    if (!current) {
      return pricing.mode === "REQUEST_QUOTE"
        ? { primary: "Request a quote" }
        : null;
    }
    return {
      primary: `${CURRENCY.format(current)} bid`,
      compare: pricing.reservePrice ? `${CURRENCY.format(pricing.reservePrice)} reserve` : undefined,
    };
  }
  if (pricing.mode === "NEGOTIABLE") {
    return { primary: "Negotiable" };
  }
  if (pricing.price) {
    return {
      primary: CURRENCY.format(pricing.price),
      compare: pricing.compareAtPrice ? CURRENCY.format(pricing.compareAtPrice) : undefined,
    };
  }
  return null;
}

function LivePill({ createdAt }: { createdAt: string }) {
  const isLive = Date.now() - new Date(createdAt).getTime() < 5 * 60 * 1000;
  if (!isLive) return null;
  return (
    <span className="flex items-center gap-1 rounded-full bg-rose-500 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
      Live
    </span>
  );
}

type Props = {
  post: MarketPost;
  onSelect?: (post: MarketPost) => void;
};

export function MarketCard({ post, onSelect }: Props) {
  const badge = TYPE_STYLE[post.type];
  const availability = resolveAvailability(post);
  const price = resolvePrice(post);
  const primaryImage = post.primaryImage ?? post.images?.[0];

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(post)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.(post);
        }
      }}
      className="group flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {post.brandLogo ? (
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-200">
              <Image src={post.brandLogo} alt={`${post.brandName} logo`} fill className="object-cover" />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
              {post.brandName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              {post.brandName}
              {post.brandVerified && (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-600">
                  Verified
                </span>
              )}
            </span>
            {post.category && <span className="text-xs text-slate-500">{post.category}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 text-xs font-medium text-slate-600">
          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5", badge.className)}>
            {badge.label}
          </span>
          <LivePill createdAt={post.createdAt} />
        </div>
      </header>

      {primaryImage && (
        <div className="relative overflow-hidden rounded-xl bg-slate-100">
          <div className="aspect-[16/9]">
            <Image src={primaryImage} alt={post.headline} fill className="object-cover transition duration-300 group-hover:scale-105" />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="line-clamp-2 text-lg font-semibold text-slate-900">{post.headline}</h3>
        {post.description && <p className="line-clamp-3 text-sm text-slate-600">{post.description}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
        {price && (
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-slate-900">{price.primary}</span>
            {price.compare && <span className="text-sm text-slate-400 line-through">{price.compare}</span>}
          </div>
        )}
        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", availability.className)}>
          {availability.label}
        </span>
        {post.shipping?.shipsFrom && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Ships from {post.shipping.shipsFrom}</span>
        )}
      </div>

      <footer className="mt-auto flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1 text-slate-700">
            <IconMessageCircle className="h-4 w-4" />
            {post.metrics.comments ?? 0}
          </span>
          <span className="inline-flex items-center gap-1 text-slate-700">
            <IconEye className="h-4 w-4" />
            {post.metrics.views ?? 0}
          </span>
          <span className="inline-flex items-center gap-1 text-slate-700">
            <IconStar className="h-4 w-4 text-amber-500" />
            {post.metrics.reviews ?? 0}
            <span className="text-slate-400">reviews</span>
          </span>
        </div>
        <span className="text-xs text-slate-500">Updated {new Date(post.updatedAt ?? post.createdAt).toLocaleString()}</span>
      </footer>
    </article>
  );
}

export default MarketCard;
