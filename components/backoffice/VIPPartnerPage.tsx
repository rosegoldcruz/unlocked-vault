"use client"

import { type FormEvent, useState } from 'react'
import { BellRing, Building2, CheckCircle2, Compass, Layers3, Megaphone, Rocket, ShieldCheck } from 'lucide-react'

const projectTypes = ['Real Estate', 'Business Acquisition', 'Digital Asset Launch', 'Strategic Partnership', 'Other']
const projectValues = ['$50K–$100K', '$100K–$250K', '$250K–$500K', '$500K+']
const capitalStatuses = ['Ready Now', 'Raising Capital', 'Seeking Partners', 'Exploring Options']

const pipelineStages = ['Submitted', 'Review', 'Strategy Call', 'Partner Decision']

const benefitCards = [
  { title: 'Priority Strategy Review', icon: Compass },
  { title: 'Tokenization Planning', icon: Layers3 },
  { title: 'Real-World Asset Evaluation', icon: Building2 },
  { title: 'Private Ecosystem Updates', icon: BellRing },
  { title: 'Partner Launch Support', icon: Rocket },
  { title: 'Community Distribution Pathways', icon: Megaphone },
]

const activityFeed = [
  'Partner request received',
  'Project value verified',
  'Strategy review pending',
  'Ecosystem access unlocked',
]

export function VIPPartnerPage() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    event.currentTarget.reset()
  }

  return (
    <section className="space-y-6">
      <div className="iv-panel p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="iv-label mb-3 text-purple-400">VIP Access. Strategic Partnership.</p>
            <h1 className="iv-title text-5xl sm:text-6xl lg:text-7xl">VIP PARTNER ACCESS</h1>
            <p className="iv-body mt-5 max-w-3xl text-base text-zinc-300">
              Strategic ecosystem access for qualified members, contributors, and project partners.
            </p>
          </div>

          <aside className="border border-purple-500/30 bg-[#080808] p-5 shadow-[0_0_34px_rgba(123,47,190,0.12)]">
            <p className="iv-label-muted mb-3 text-purple-300">PARTNER SIGNAL</p>
            <p className="text-sm leading-7 text-zinc-200">
              Qualified members can request review for high-value project opportunities, real-world assets, and ecosystem collaborations.
            </p>
          </aside>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <form onSubmit={handleSubmit} className="iv-panel space-y-5 p-6 sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="iv-label mb-2">VIP Partnership Request</p>
              <h2 className="iv-card-title text-4xl">Project Intake</h2>
            </div>
            {submitted ? (
              <div className="iv-chip-lime inline-flex items-center gap-2 px-3 py-2 text-xs">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                Request submitted for review
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full Name" id="vip-name" />
            <Field label="Email" id="vip-email" type="email" />
            <Field label="Phone" id="vip-phone" type="tel" />
            <SelectField label="Project Type" id="vip-project-type" options={projectTypes} />
            <SelectField label="Estimated Project Value" id="vip-project-value" options={projectValues} />
            <SelectField label="Capital Status" id="vip-capital-status" options={capitalStatuses} />
          </div>

          <label htmlFor="vip-summary" className="block">
            <span className="iv-label-muted mb-2 block">Short Project Summary</span>
            <textarea
              id="vip-summary"
              name="summary"
              className="iv-field min-h-36 w-full resize-y px-4 py-3 text-sm"
              placeholder="Briefly describe the opportunity, partner goal, timeline, and review needs."
              required
            />
          </label>

          <button type="submit" className="iv-button inline-flex min-h-12 w-full items-center justify-center px-5 py-3 text-sm sm:w-auto">
            SUBMIT PARTNER REQUEST
          </button>
        </form>

        <div className="space-y-6">
          <section className="iv-panel p-6">
            <p className="iv-label mb-2">Current Status</p>
            <h2 className="iv-card-title text-3xl">Review Pending</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {pipelineStages.map((stage, index) => (
                <div key={stage} className={`border bg-[#080808] p-3 ${index <= 1 ? 'border-[#aaff00]/30' : 'border-[#2a2a2a]'}`}>
                  <div className={`mb-3 grid h-8 w-8 place-items-center border text-xs ${index <= 1 ? 'iv-chip-lime' : 'border-[#2a2a2a] text-zinc-500'}`}>
                    {index + 1}
                  </div>
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-200">{stage}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="iv-panel p-6">
            <p className="iv-label mb-4">Demo Activity Feed</p>
            <div className="space-y-3">
              {activityFeed.map((entry) => (
                <div key={entry} className="flex items-center gap-3 border border-[#1f1f1f] bg-[#080808] px-3 py-3">
                  <span className="h-2 w-2 bg-[#aaff00]" />
                  <p className="text-sm text-zinc-300">{entry}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section className="iv-panel p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="iv-label mb-2">VIP Benefits</p>
            <h2 className="iv-card-title text-4xl">Ecosystem Access Grid</h2>
          </div>
          <div className="iv-chip-purple inline-flex items-center gap-2 px-3 py-2 text-xs">
            <ShieldCheck aria-hidden="true" className="h-4 w-4" />
            Qualified Members
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {benefitCards.map(({ title, icon: Icon }) => (
            <article key={title} className="iv-panel iv-panel-hover p-5">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center border border-purple-500/30 bg-[#080808] text-purple-300">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </div>
              <h3 className="iv-card-title text-2xl">{title}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="iv-panel iv-panel-lime p-6 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="iv-label mb-2">Partner Desk</p>
            <p className="iv-body max-w-3xl text-sm text-zinc-300">
              VIP access supports qualified partnership review, project strategy, and ecosystem coordination without creating payment processing or financial guarantees.
            </p>
          </div>
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#aaff00]">Demo Ready</div>
        </div>
      </section>
    </section>
  )
}

function Field({ label, id, type = 'text' }: { label: string; id: string; type?: string }) {
  return (
    <label htmlFor={id} className="block">
      <span className="iv-label-muted mb-2 block">{label}</span>
      <input id={id} name={id} type={type} className="iv-field min-h-12 w-full px-4 py-3 text-sm" required />
    </label>
  )
}

function SelectField({ label, id, options }: { label: string; id: string; options: string[] }) {
  return (
    <label htmlFor={id} className="block">
      <span className="iv-label-muted mb-2 block">{label}</span>
      <select id={id} name={id} className="iv-field min-h-12 w-full px-4 py-3 text-sm" required defaultValue="">
        <option value="" disabled>Select option</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}
