'use client';
import { useEffect, useState } from 'react';
import { getRole, isOnboarded } from './useAuth';

export default function AuthCta() {
  const [ready, setReady] = useState(false);
  const [onb, setOnb] = useState(false);
  const [role, setRole] = useState<ReturnType<typeof getRole>>();

  useEffect(() => {
    try {
      setOnb(isOnboarded());
      setRole(getRole());
    } finally {
      setReady(true);
    }
  }, []);

  // SSR-safe default so no hydration mismatch
  if (!ready) return <a className="btn" href="/join">Join</a>;

  if (onb && role === 'buyer') return <a className="btn" href="/posts/new">Create Post</a>;
  return <a className="btn" href="/join">Join</a>;
}

