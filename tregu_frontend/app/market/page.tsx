/**
 * Market Live Newsfeed Page
 * Real-time feed of catalog posts with SSE updates + Location Filters
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMarketFeed } from '@/hooks/useMarketFeed';
import { MarketCard } from '@/components/MarketCard';
import { PostDetail } from '@/components/market/PostDetail';
import type { FeedSort, FeedFilter, MarketPost } from '@/types/market-feed';

interface State {
  id: string;
  name: string;
}

interface City {
  id: string;
  name: string;
  state_id: string;
}

interface Zip {
  id: string;
  name: string;
  city_id: string;
}

export default function MarketPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams?.get('q') || '';

  const [sort, setSort] = useState<FeedSort>('top');
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [selectedPost, setSelectedPost] = useState<MarketPost | null>(null);
  
  // Location filters
  const [searchQuery, setSearchQuery] = useState(queryParam || '');
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [zips, setZips] = useState<Zip[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedZip, setSelectedZip] = useState('');

  const { posts, newPostCount, isLoading, error, hasMore, loadMore, showNewPosts, refresh } =
    useMarketFeed({ sort, filter, enabled: true });

  // Load location data
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const [statesRes, citiesRes, zipsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8010'}/api/locations/states`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8010'}/api/locations/cities`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8010'}/api/locations/zips`),
        ]);

        const [statesData, citiesData, zipsData] = await Promise.all([
          statesRes.json(),
          citiesRes.json(),
          zipsRes.json(),
        ]);

        setStates(Array.isArray(statesData) ? statesData : []);
        setCities(Array.isArray(citiesData) ? citiesData : []);
        setZips(Array.isArray(zipsData) ? zipsData : []);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    setSearchQuery(queryParam || '');
  }, [queryParam]);

  const filteredCities = selectedState
    ? cities.filter((city) => city.state_id === selectedState)
    : cities;
  const filteredZips = selectedCity
    ? zips.filter((zip) => zip.city_id === selectedCity)
    : zips;

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery) {
      router.push(`/market?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/market');
    }
    // TODO: Apply search query to feed filter
  };

  const handleLocationFilter = () => {
    // TODO: Apply location filters to feed
    refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Image */}
      <div className="relative h-48 bg-gradient-to-r from-indigo-600 to-slate-600 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-2">Tregu Market</h1>
            <p className="text-lg opacity-90">
              Live feed of trusted partners across finance, commerce and supply
            </p>
          </div>
        </div>
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="container py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Compact Search Bar */}
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <div className="relative">
                  <input
                    type="search"
                    placeholder="Search brands, products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                  <svg className="absolute left-2.5 top-2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </form>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/onboard?mode=business"
                className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-indigo-600 to-slate-600 hover:from-indigo-700 hover:to-slate-700 rounded-lg transition"
              >
                Become a Seller
              </Link>
              <button
                onClick={refresh}
                className="px-3 py-1.5 text-xs border rounded-lg hover:bg-slate-50"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Location Filters & Sort/Filter Controls */}
          <div className="space-y-3">
            {/* Location Filters Row */}
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-slate-700 mb-1">State</label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedCity('');
                    setSelectedZip('');
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                >
                  <option value="">All States</option>
                  {states.map((state) => (
                    <option key={state.id} value={state.id}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setSelectedZip('');
                  }}
                  disabled={!selectedState}
                  className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">All Cities</option>
                  {filteredCities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-slate-700 mb-1">Zip Code</label>
                <select
                  value={selectedZip}
                  onChange={(e) => setSelectedZip(e.target.value)}
                  disabled={!selectedCity}
                  className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">All Zip Codes</option>
                  {filteredZips.map((zip) => (
                    <option key={zip.id} value={zip.id}>
                      {zip.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleLocationFilter}
                className="px-3 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedState('');
                  setSelectedCity('');
                  setSelectedZip('');
                  setSearchQuery('');
                  router.push('/market');
                  refresh();
                }}
                className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition"
              >
                Clear
              </button>
            </div>

            {/* Sort & Filter Row */}
            <div className="flex items-center gap-4 pb-2 border-b">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-700">Sort:</label>
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value as FeedSort)}
                  className="px-2 py-1 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                >
                  <option value="top">Top</option>
                  <option value="new">New</option>
                  <option value="rising">Rising</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-700">Filter:</label>
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value as FeedFilter)}
                  className="px-2 py-1 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                >
                  <option value="all">All</option>
                  <option value="following">Following</option>
                  <option value="price_change">Price Changes</option>
                  <option value="new_products">New Products</option>
                  <option value="trending">Trending</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* New Posts Toast */}
      {newPostCount > 0 && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={showNewPosts}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition"
          >
            {newPostCount} new {newPostCount === 1 ? 'post' : 'posts'}
          </button>
        </div>
      )}

      {/* Feed Content */}
      <main className="container py-6">
        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {posts.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <MarketCard key={post.id} post={post} onSelect={setSelectedPost} />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {isLoading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}

        {isLoading && posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">Loading feed...</p>
          </div>
        )}
      </main>

      <PostDetail
        postId={selectedPost?.id ?? null}
        initialPost={selectedPost ?? undefined}
        open={Boolean(selectedPost)}
        onClose={() => setSelectedPost(null)}
      />
    </div>
  );
}