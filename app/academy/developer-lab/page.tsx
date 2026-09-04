import Link from 'next/link'
import { requireMemberAccess } from '@/lib/server/member-access'

export default async function DeveloperLabPage() {
  let access
  try {
    access = await requireMemberAccess()
  } catch {
    access = null
  }

  if (!access?.developerLabAccess) {
    return (
      <main className="min-h-screen bg-[#080808] px-6 py-20 text-zinc-100">
        <div className="iv-panel mx-auto max-w-2xl p-8">
          <p className="iv-label mb-3">Elite Developer Lab</p>
          <h1 className="iv-title text-5xl">Elite access required</h1>
          <p className="iv-body mt-4">Developer Lab access is included with Elite enrollment. Full Vaulted Academy access is available through Intermediate, Advanced, and Elite.</p>
          <Link href="https://ironvaulttoken.com/learn/pay" className="iv-button mt-7 inline-flex px-5 py-3 text-sm">View Elite</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#080808] px-6 py-20 text-zinc-100">
      <div className="iv-panel iv-panel-lime mx-auto max-w-2xl p-8">
        <p className="iv-label mb-3">Elite Developer Lab</p>
        <h1 className="iv-title text-5xl">Builder track access active</h1>
        <p className="iv-body mt-4">This Elite-only technical track is the boundary for Web3 development, AI-assisted development, automation, software systems, and builder workflows. Curriculum will appear here as it is released.</p>
      </div>
    </main>
  )
}