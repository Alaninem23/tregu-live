import Link from 'next/link'

export default function LogoHome() {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-sm">T</span>
      </div>
      <span className="font-semibold text-slate-900">Tregu</span>
    </Link>
  )
}