'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/config';

type PublicProfile = {
  username: string;
  display_name?: string;
  bio?: string | null;
  location?: string | null;
  website_url?: string | null;
  twitter_url?: string | null;
  linkedin_url?: string | null;
  is_public: boolean;
  avatar_full?: string | null;
  avatar_medium?: string | null;
  avatar_thumb?: string | null;
};

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params?.username;
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!username) return;
      try {
        const res = await fetch(`${getApiBaseUrl()}/profile/by-username/${encodeURIComponent(username)}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setProfile(data?.profile ?? null);
      } catch (e: any) {
        setError(e?.message || 'Not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  if (loading) return <div className="container py-10">Loading…</div>;
  if (error || !profile) return <div className="container py-10">Profile not found.</div>;

  const avatar = profile.avatar_medium || profile.avatar_thumb || profile.avatar_full || '';
  return (
    <div className="container py-10 max-w-3xl">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={profile.username} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">No Avatar</div>
          )}
        </div>
        <div>
          <div className="text-2xl font-semibold">{profile.display_name || profile.username}</div>
          <div className="text-gray-600">@{profile.username}</div>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        {profile.bio && <p className="text-lg leading-relaxed">{profile.bio}</p>}
        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
          {profile.location && <span>📍 {profile.location}</span>}
          {profile.website_url && (
            <a className="text-blue-600 hover:underline" href={profile.website_url} target="_blank" rel="noreferrer">Website</a>
          )}
          {profile.twitter_url && (
            <a className="text-blue-600 hover:underline" href={profile.twitter_url} target="_blank" rel="noreferrer">Twitter</a>
          )}
          {profile.linkedin_url && (
            <a className="text-blue-600 hover:underline" href={profile.linkedin_url} target="_blank" rel="noreferrer">LinkedIn</a>
          )}
        </div>
        {!profile.is_public && (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-yellow-800 text-sm">
            This user’s profile is private. Only limited information is visible.
          </div>
        )}
      </div>
    </div>
  );
}
