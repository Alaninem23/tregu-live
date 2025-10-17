'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Card } from '../_components/ui'
import PostCard from '../_components/PostCard'
import { Post, loadFeed } from '../_components/storage'

export default function Dashboard() {
  const [feed, setFeed] = useState<Post[]>([])

  useEffect(() => { setFeed(loadFeed()) }, [])

  const onChanged = (updated: Post) => {
    setFeed(prev => prev.map(p => p.id === updated.id ? updated : p))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tregu Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/create" className="btn btn-primary">Create Post</Link>
          <Link href="/dashboard/profile" className="btn">User Profile</Link>
          <Link href="/dashboard/settings" className="btn">Customize</Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card title="What is this?">
          <p className="text-sm text-slate-600">
            This is Tregu's foundation. Everyone can see a shared feed of buyer posts - photos, products, and auctions - and drill into details.
            Use <span className="font-medium">Create Post</span> to add yours.
          </p>
        </Card>
        <Card title="Tips">
          <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
            <li>Use a public image URL (e.g. https://example.com/photo.jpg) for now.</li>
            <li>Enable <em>Auction</em> to accept bids on your item.</li>
            <li>Set up your <a className="underline" href="/dashboard/profile">User Profile</a> so people know who you are.</li>
          </ul>
        </Card>
        <Card title="Next">
          <p className="text-sm text-slate-600">We can wire this to your API for real storage, file uploads, and moderation.</p>
        </Card>
      </div>

      <h2 className="text-xl font-semibold">Latest Posts</h2>
      <div className="grid gap-3">
        {feed.length === 0
          ? <div className="text-slate-600 text-sm">No posts yet. Click <a className="underline" href="/dashboard/create">Create Post</a>.</div>
          : feed.map(p => <PostCard key={p.id} p={p} onChanged={onChanged} />)}
      </div>
    </div>
  )
}


