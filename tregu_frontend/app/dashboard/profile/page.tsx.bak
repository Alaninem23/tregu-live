'use client'
import AvatarUploader from '../../../components/AvatarUploader'

export default function ProfilePage(){
  return (
    <main className="space-y-6 p-6" style={{ background: 'linear-gradient(180deg,#fff7ed,transparent)' }}>
      <h1 className="text-2xl font-semibold">Profile</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border bg-white/70 p-4">
          <h2 className="font-semibold">Your profile</h2>
          <div className="mt-4 grid gap-3">
            <AvatarUploader label="Profile picture" name="avatar" kind="user" />
            <div className="grid gap-2">
              <label className="text-sm">Display name</label>
              <input className="rounded-xl border px-3 py-2" defaultValue="" placeholder="Your name"/>
            </div>
          </div>
        </section>
        <section className="rounded-2xl border bg-white/70 p-4">
          <h2 className="font-semibold">Business</h2>
          <div className="mt-4 grid gap-3">
            <AvatarUploader label="Business logo" name="logo" kind="business" />
            <div className="grid gap-2">
              <label className="text-sm">Business / Organization</label>
              <input className="rounded-xl border px-3 py-2" placeholder="Acme Co."/>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}