"use client"

import dynamic from 'next/dynamic'

const IronVaultAcademyUnlocked = dynamic(
  () => import('@/iron-vault-academy-unlocked'),
  { ssr: false, loading: () => (
    <div className="min-h-[400px] grid place-items-center">
      <p className="text-sm text-zinc-400">Loading Academy...</p>
    </div>
  )}
)

export default function AcademyPage() {
  return (
    <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-8">
      <IronVaultAcademyUnlocked />
    </div>
  )
}
