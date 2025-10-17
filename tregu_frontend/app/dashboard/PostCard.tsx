'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, Card } from '../_components/ui'
import { addPost } from '../_components/storage'

export default function CreatePost() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [seller, setSeller] = useState('')
  const [isAuction, setIsAuction] = useState(false)
  const [startingBid, setStartingBid] = useState('')
  const [price, setPrice] = useState('')

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const priceCents = price ? Math.round(parseFloat(price)*100) : undefined
    const startingBidCents = startingBid ? Math.round(parseFloat(startingBid)*100) : undefined
    addPost({
      title, description, imageUrl, seller,
      isAuction,
      priceCents: isAuction ? undefined : priceCents,
      startingBidCents: isAuction ? (startingBidCents||0) : undefined,
      currentBidCents: isAuction ? (startingBidCents||0) : undefined
    })
    router.push('/dashboard')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create Post</h1>
        <Link href="/dashboard" className="btn">Back to Dashboard</Link>
      </div>

      <Card>
        <form className="grid md:grid-cols-2 gap-4" onSubmit={onSubmit}>
          <div className="md:col-span-2">
            <label>Title</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Vintage Jacket" required />
          </div>

          <div className="md:col-span-2">
            <label>Description</label>
            <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Size M, barely used…" />
          </div>

          <div className="md:col-span-2">
            <label>Image URL</label>
            <input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="https://example.com/photo.jpg" />
            <p className="text-xs text-slate-500 mt-1">(For now, paste a public image URL. We can add file uploads next.)</p>
          </div>

          <div>
            <label>Your Display Name (Seller)</label>
            <input value={seller} onChange={e=>setSeller(e.target.value)} placeholder="Alani" />
          </div>

          <div className="md:col-span-2 flex items-center gap-2 mt-2">
            <input id="auction" type="checkbox" checked={isAuction} onChange={e=>setIsAuction(e.target.checked)} />
            <label htmlFor="auction" className="select-none">Enable Auction (bidding)</label>
          </div>

          {!isAuction ? (
            <div>
              <label>Price (USD)</label>
              <input value={price} onChange={e=>setPrice(e.target.value)} placeholder="25.00" />
            </div>
          ) : (
            <div>
              <label>Starting Bid (USD)</label>
              <input value={startingBid} onChange={e=>setStartingBid(e.target.value)} placeholder="10.00" />
            </div>
          )}

          <div className="md:col-span-2">
            <Button type="submit" className="btn-primary">Post</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

