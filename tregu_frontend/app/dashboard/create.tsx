export type Post = {
  id: string
  title: string
  description?: string
  imageUrl?: string
  priceCents?: number
  isAuction?: boolean
  currentBidCents?: number
  startingBidCents?: number
  seller?: string
  createdAt: string
}

const KEY = 'tregu:feed';

export function loadFeed(): Post[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveFeed(posts: Post[]) {
  localStorage.setItem(KEY, JSON.stringify(posts));
}

export function addPost(post: Omit<Post,'id'|'createdAt'>): Post {
  const now = new Date().toISOString();
  const p: Post = { ...post, id: cryptoRandom(), createdAt: now };
  const list = loadFeed();
  list.unshift(p);
  saveFeed(list);
  return p;
}

export function placeBid(postId: string, bidCents: number): Post | null {
  const list = loadFeed();
  const idx = list.findIndex(p => p.id === postId);
  if (idx < 0) return null;
  const p = { ...list[idx] };
  if (!p.isAuction) return null;
  const min = p.currentBidCents && p.currentBidCents > 0 ? p.currentBidCents : (p.startingBidCents||0);
  if (bidCents <= min) return null;
  p.currentBidCents = bidCents;
  list[idx] = p;
  saveFeed(list);
  return p;
}

export function cryptoRandom() {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const arr = new Uint32Array(2);
    crypto.getRandomValues(arr);
    return 'P' + arr[0].toString(16) + arr[1].toString(16);
  } else {
    return 'P' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
  }
}
