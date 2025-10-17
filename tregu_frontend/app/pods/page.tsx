'use client';
export const dynamic = 'force-dynamic';


import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

const heroSrc = '/tregu_mockup.png'

export default function PodsPage() {
  const router = useRouter()
  const sp = useSearchParams()
  const [q, setQ] = useState(sp?.get('q') || '')
  const [showLocationFilter, setShowLocationFilter] = useState(false)
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedZip, setSelectedZip] = useState('')
  const [states, setStates] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch states on mount
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await fetch('/api/locations?type=states')
        if (response.ok) {
          const data = await response.json()
          setStates(data.states || [])
        }
      } catch (error) {
        console.error('Failed to fetch states:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStates()
  }, [])

  // Fetch cities when state changes
  useEffect(() => {
    if (!selectedState) {
      setCities([])
      return
    }

    const fetchCities = async () => {
      try {
        const response = await fetch(`/api/locations?type=cities&state=${selectedState}`)
        if (response.ok) {
          const data = await response.json()
          setCities(data.cities || [])
        }
      } catch (error) {
        console.error('Failed to fetch cities:', error)
        setCities([])
      }
    }
    fetchCities()
  }, [selectedState])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const base = '/pods'
    const next = q.trim() ? `${base}?q=${encodeURIComponent(q.trim())}` : base
    router.push(next)
  }

  const availableCities = cities
  const availableZips: string[] = [] // ZIP codes not yet implemented

  return (
    <div className="space-y-8">
      <div className="rounded-3xl ring-1 ring-slate-200 bg-white p-5 md:p-6">
        <div className="grid md:grid-cols-[1fr,360px] gap-6 items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">Workspace Pods</h1>
            <p className="text-slate-600 mt-2">
              Flexible workspace solutions for businesses. Rent operational space with premium amenities on flexible 30-day terms.
            </p>
            <form onSubmit={onSubmit} className="mt-4 max-w-xl">
              <div className="flex rounded-2xl bg-white shadow ring-1 ring-slate-200">
                <input
                  value={q}
                  onChange={(e)=>setQ(e.target.value)}
                  placeholder="Search locations, sizes, or amenities"
                  className="flex-1 rounded-l-2xl px-4 py-2.5 outline-none"
                />
                <button
                  className="rounded-r-2xl px-5 py-2.5 text-white bg-gradient-to-r from-indigo-700 to-slate-700 hover:from-indigo-800 hover:to-slate-800 transition"
                >
                  Search
                </button>
              </div>
            </form>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowLocationFilter(!showLocationFilter)}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {showLocationFilter ? 'Hide Location Filter' : 'Filter by Location'}
              </button>
              <Link href="/join?mode=business" className="btn btn-primary">Create Business Account</Link>
            </div>

            {/* Location Filter */}
            {showLocationFilter && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                    <select
                      value={selectedState}
                      onChange={(e) => {
                        setSelectedState(e.target.value)
                        setSelectedCity('')
                        setSelectedZip('')
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select State</option>
                      {states.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                    <select
                      value={selectedCity}
                      onChange={(e) => {
                        setSelectedCity(e.target.value)
                        setSelectedZip('')
                      }}
                      disabled={!selectedState}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select City</option>
                      {availableCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Zip Code</label>
                    <select
                      value={selectedZip}
                      onChange={(e) => setSelectedZip(e.target.value)}
                      disabled={!selectedCity}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select ZIP Code</option>
                      {availableZips.map((zip: string) => (
                        <option key={zip} value={zip}>{zip}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative h-[140px] md:h-[180px]">
            <div className="absolute inset-0 rounded-2xl overflow-hidden ring-1 ring-slate-200 bg-white">
              <Image
                src={heroSrc}
                alt="Tregu Pods"
                fill
                sizes="40vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <strong>Note:</strong> The pod listings below are sample data. Location filters and search are not yet connected to a live database. This functionality will be implemented in a future update.
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sample Pod Listings - In a real app, this would come from API */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">Downtown Business Pod</h3>
              <p className="text-sm text-slate-500">Downtown Business District</p>
            </div>
            <span className="text-lg font-bold text-indigo-600">$750/mo</span>
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              200 sq ft workspace
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              High-speed Wi-Fi
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              24/7 access
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Secure storage
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <Link href="/systems" className="text-indigo-600 hover:text-indigo-800 underline">Business Systems Access</Link>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">Barcode Scanning</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Inventory Management</span>
            </div>
          </div>
          <button className="w-full mt-4 btn btn-primary">Reserve Pod</button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">Professional Hub Pod</h3>
              <p className="text-sm text-slate-500">Midtown Professional Center</p>
            </div>
            <span className="text-lg font-bold text-indigo-600">$550/mo</span>
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              150 sq ft workspace
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Meeting room access
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Business hours access
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Mail handling
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <Link href="/systems" className="text-indigo-600 hover:text-indigo-800 underline">Business Systems Access</Link>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">Barcode Scanning</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Inventory Management</span>
            </div>
          </div>
          <button className="w-full mt-4 btn btn-primary">Reserve Pod</button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">Creative Studio Pod</h3>
              <p className="text-sm text-slate-500">Creative Quarter</p>
            </div>
            <span className="text-lg font-bold text-indigo-600">$650/mo</span>
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              180 sq ft creative space
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Natural lighting
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Equipment storage
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Flexible hours
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <Link href="/systems" className="text-indigo-600 hover:text-indigo-800 underline">Business Systems Access</Link>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">Barcode Scanning</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Inventory Management</span>
            </div>
          </div>
          <button className="w-full mt-4 btn btn-primary">Reserve Pod</button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
        <h3 className="text-lg font-medium text-slate-900 mb-2">Need a Custom Pod Solution?</h3>
        <p className="text-slate-600 mb-4">Contact us to discuss custom workspace requirements for your business.</p>
        <Link href="/join?mode=business" className="btn btn-primary">Get Started</Link>
      </div>
    </div>
  )
}

