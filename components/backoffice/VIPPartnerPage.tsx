"use client"

import { type FormEvent, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  Crown,
  Play,
  Rocket,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { fetchBackofficeJson, type BackofficeTicketCreateResponse } from '@/lib/backoffice-client'
import { useBackofficeAuth } from '@/hooks/useBackofficeAuth'

type OfferId = 'private-partner' | 'pumpcoin'

const nextSteps = [
  'Watch the briefing.',
  'Review the opportunity.',
  'Submit an application.',
  'Schedule a consultation.',
  'Receive a strategy review.',
]

const appreciationSchedule = [
  ['$10,000', '$50,000'],
  ['$20,000', '$100,000'],
  ['$30,000', '$150,000'],
  ['$40,000', '$200,000'],
  ['$50,000', '$250,000'],
  ['$60,000', '$300,000'],
  ['$70,000', '$350,000'],
  ['$80,000', '$400,000'],
  ['$90,000', '$450,000'],
  ['$100,000', '$500,000'],
  ['$200,000', '$1,000,000'],
  ['$300,000', '$1,500,000'],
  ['$400,000', '$2,000,000'],
  ['$500,000', '$2,500,000'],
  ['$600,000', '$3,000,000'],
  ['$700,000', '$3,500,000'],
  ['$800,000', '$4,000,000'],
  ['$900,000', '$4,500,000'],
  ['$1,000,000', '$5,000,000'],
]

const offers = [
  {
    id: 'private-partner' as const,
    label: 'Product 1',
    title: 'Private Partner Appreciation Agreement',
    pathTitle: 'Become A Private Partner',
    description: "Help accelerate Iron Vault's growth through a private appreciation agreement.",
    positionSize: '$10,000+',
    positionNote: 'Limited slots',
    href: '#private-partner-offer',
    formCta: 'Apply Now',
    primaryCta: 'Apply For Private Partner Review',
    icon: Crown,
    benefits: [
      'Private Partner Status',
      'Appreciation Agreement',
      'VIP Updates',
      'Strategy Calls',
      'Early Access Opportunities',
    ],
  },
  {
    id: 'pumpcoin' as const,
    label: 'Product 2',
    title: 'PumpCoin Launch Partnership',
    pathTitle: 'Launch Your Own Token',
    description: 'Work directly with Iron Vault to build, market, and launch your own token ecosystem.',
    positionSize: '$250,000',
    positionNote: 'Launch partnership',
    href: '#pumpcoin-offer',
    formCta: 'Book Consultation',
    primaryCta: 'Request PumpCoin Consultation',
    icon: Rocket,
    benefits: [
      'Token Creation',
      'Branding',
      'Website',
      'Lead Generation',
      'Community Building',
      'Marketing Campaigns',
      'Launch Support',
      'Strategy Team',
    ],
  },
]

function getOffer(id: OfferId) {
  return offers.find((offer) => offer.id === id) ?? offers[0]
}

export function VIPPartnerPage({ videoSrc }: { videoSrc?: string }) {
  const { profile } = useBackofficeAuth()
  const { getAccessToken } = usePrivy()
  const [selectedOffer, setSelectedOffer] = useState<OfferId>('private-partner')
  const [form, setForm] = useState({ name: '', phone: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submittedOffer, setSubmittedOffer] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const offer = getOffer(selectedOffer)
    const message = [
      `Selected opportunity: ${offer.title}`,
      form.phone.trim() ? `Phone: ${form.phone.trim()}` : null,
      profile?.email ? `Member email: ${profile.email}` : null,
      '',
      form.message.trim(),
    ].filter(Boolean).join('\n')

    try {
      setSubmitting(true)
      setError(null)
      const token = await getAccessToken()
      if (!token) throw new Error('Unable to verify your portal session.')
      await fetchBackofficeJson<BackofficeTicketCreateResponse>('/api/backoffice/tickets', token, {
        method: 'POST',
        body: {
          name: form.name,
          subject: offer.id === 'private-partner' ? 'Private Partner Review Application' : 'PumpCoin Consultation Request',
          message,
        },
      })
      setSubmittedOffer(offer.title)
      setForm({ name: '', phone: '', message: '' })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to submit your request right now.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="space-y-6">
      <div className="iv-panel iv-panel-lime p-4 sm:p-6 lg:p-8">
        <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1.38fr)_minmax(380px,0.92fr)]">
          <div className="flex min-w-0 flex-col">
            <div className="mb-5 flex min-h-[72px] flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="iv-label mb-3">VIP Partner Opportunities</p>
                <h1 className="iv-title text-5xl sm:text-6xl lg:text-7xl">VIP PARTNER ACCESS</h1>
              </div>
              <div className="iv-chip-lime inline-flex w-fit items-center gap-2 px-3 py-2 text-xs">
                <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                Private Portal
              </div>
            </div>

            <section className="border border-[#242424] bg-[#080808] p-5 sm:p-6">
              <p className="iv-label-muted mb-5 text-[#aaff00]">Why VIP Exists</p>
              <p className="text-sm leading-7 text-zinc-200">
                Iron Vault is currently focused on two initiatives:
              </p>
              <ul className="mt-5 grid gap-4 text-sm text-zinc-100 sm:grid-cols-2">
                <li className="flex gap-3">
                  <BadgeCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#aaff00]" />
                  Private Partner Appreciation Agreements
                </li>
                <li className="flex gap-3">
                  <BadgeCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#aaff00]" />
                  PumpCoin Launch Partnerships
                </li>
              </ul>
              <p className="mt-6 max-w-3xl text-sm leading-7 text-zinc-300">
                Qualified members can review opportunities, schedule consultations, and begin the application process directly from this portal.
              </p>
            </section>

            <div className="mt-5 flex-1">
              <PrivateAppreciationSchedule />
            </div>
          </div>

          <aside className="flex min-w-0 flex-col border border-[#242424] bg-[#080808] p-4 sm:p-5">
            <section className="flex min-h-full flex-col">
              <div className="mb-5 flex min-h-[72px] items-center justify-between gap-3 border-b border-[#1f1f1f] pb-4">
                <div>
                  <p className="iv-label-muted mb-2">VIP Video</p>
                  <h2 className="iv-card-title text-5xl sm:text-6xl">Briefing</h2>
                </div>
                <Play aria-hidden="true" className="h-5 w-5 text-[#aaff00]" />
              </div>
              {videoSrc ? (
                <video
                  className="mx-auto aspect-[9/16] w-full max-w-[390px] border border-[#1f1f1f] bg-black object-cover"
                  src={videoSrc}
                  controls
                  playsInline
                  preload="metadata"
                />
              ) : (
                <div className="mx-auto grid aspect-[9/16] w-full max-w-[390px] place-items-center border border-dashed border-[#2a2a2a] bg-black/70 px-6 text-center">
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
                    Set NEXT_PUBLIC_IRON_VAULT_VIP_VIDEO_SRC to show your VIP video here.
                  </p>
                </div>
              )}
              <div className="mt-5 border-t border-[#1f1f1f] pt-5">
                <p className="iv-label mb-4">Next Step</p>
                <ol className="space-y-3">
                  {nextSteps.map((step, index) => (
                    <li key={step} className="flex items-center gap-3 text-sm text-zinc-300">
                      <span className="grid h-6 w-6 shrink-0 place-items-center border border-[#2a2a2a] font-mono text-[10px] text-[#aaff00]">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-5 border-t border-[#1f1f1f] pt-5">
                <p className="iv-title mb-4 text-center text-4xl tracking-[0.18em] text-[#aaff00]">Choose Your Path</p>
                <div className="space-y-4">
                  {offers.map((offer, index) => {
                    const Icon = offer.icon
                    return (
                      <div key={offer.id}>
                        {index > 0 ? (
                          <div className="my-4 flex items-center gap-4">
                            <span className="h-px flex-1 bg-[#242424]" />
                            <span className="iv-title text-4xl tracking-[0.18em] text-[#aaff00]">Or</span>
                            <span className="h-px flex-1 bg-[#242424]" />
                          </div>
                        ) : null}
                        <article className="border border-[#242424] bg-[#0f0f0f] p-4">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="iv-label-muted mb-2">{offer.label}</p>
                              <h3 className="iv-card-title text-2xl">{offer.pathTitle}</h3>
                            </div>
                            <div className="grid h-9 w-9 shrink-0 place-items-center border border-[#aaff00]/25 bg-[#aaff00]/10 text-[#aaff00]">
                              <Icon aria-hidden="true" className="h-4 w-4" />
                            </div>
                          </div>
                          <p className="text-sm leading-6 text-zinc-300">{offer.description}</p>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <a href={offer.href} className="iv-button-ghost inline-flex min-h-11 items-center justify-center px-4 py-2 text-xs">
                              Learn More
                            </a>
                            <a
                              href="#vip-request"
                              onClick={() => setSelectedOffer(offer.id)}
                              className="iv-button inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 text-sm"
                            >
                              {offer.formCta}
                              <ArrowRight aria-hidden="true" className="h-4 w-4" />
                            </a>
                          </div>
                        </article>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>

      <section className="iv-panel p-6 sm:p-8">
        <div className="mb-6">
          <p className="iv-label mb-2">Offer Details</p>
          <h2 className="iv-card-title text-4xl">Review The Opportunity</h2>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {offers.map((offer) => {
            const Icon = offer.icon
            return (
              <article key={offer.id} id={offer.id === 'private-partner' ? 'private-partner-offer' : 'pumpcoin-offer'} className="border border-[#242424] bg-[#080808] p-5 sm:p-6">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="iv-label-muted mb-2">{offer.label}</p>
                    <h3 className="iv-card-title text-3xl">{offer.title}</h3>
                  </div>
                  <div className="grid h-11 w-11 shrink-0 place-items-center border border-[#aaff00]/25 bg-[#aaff00]/10 text-[#aaff00]">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </div>
                </div>

                <div className="mb-6 border border-[#242424] bg-[#0f0f0f] p-4">
                  <p className="iv-label-muted mb-2">Position Size</p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <p className="iv-title text-5xl">{offer.positionSize}</p>
                    <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#aaff00]">{offer.positionNote}</p>
                  </div>
                </div>

                <div>
                  <p className="iv-label-muted mb-4">What They Get</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {offer.benefits.map((benefit) => (
                      <div key={benefit} className="flex items-center gap-3 border border-[#1f1f1f] bg-[#0f0f0f] px-3 py-3">
                        <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-[#aaff00]" />
                        <p className="text-sm text-zinc-200">{benefit}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <a
                    href="#vip-request"
                    onClick={() => setSelectedOffer(offer.id)}
                    className="iv-button inline-flex min-h-12 w-full items-center justify-center gap-2 px-5 py-3 text-sm sm:w-auto"
                  >
                    {offer.primaryCta}
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </a>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section id="vip-request" className="iv-panel iv-panel-lime p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <p className="iv-label mb-2">Start The Review</p>
            <h2 className="iv-card-title text-4xl">{getOffer(selectedOffer).primaryCta}</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              Select the opportunity you want reviewed and send the Iron Vault team your preferred contact details.
            </p>
            <div className="mt-5 grid gap-3">
              {offers.map((offer) => (
                <button
                  key={offer.id}
                  type="button"
                  onClick={() => setSelectedOffer(offer.id)}
                  className={`flex items-center justify-between gap-3 border px-4 py-3 text-left transition ${
                    selectedOffer === offer.id
                      ? 'border-[#aaff00]/45 bg-[#aaff00]/10 text-zinc-50'
                      : 'border-[#242424] bg-[#080808] text-zinc-400 hover:border-[#7b2fbe]/60 hover:text-zinc-100'
                  }`}
                >
                  <span className="font-mono text-xs uppercase tracking-[0.16em]">{offer.title}</span>
                  {selectedOffer === offer.id ? <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-[#aaff00]" /> : null}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" id="vip-name" value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} />
              <Field label="Phone" id="vip-phone" type="tel" value={form.phone} onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))} />
            </div>
            <label htmlFor="vip-message" className="block">
              <span className="iv-label-muted mb-2 block">Application Notes</span>
              <textarea
                id="vip-message"
                name="message"
                className="iv-field min-h-36 w-full resize-y px-4 py-3 text-sm"
                placeholder="Share your desired timeline, available capital, business goals, or consultation questions."
                value={form.message}
                onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                required
              />
            </label>
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            {submittedOffer ? (
              <p className="iv-chip-lime inline-flex items-center gap-2 px-3 py-2 text-xs">
                <CalendarCheck aria-hidden="true" className="h-4 w-4" />
                {submittedOffer} request submitted.
              </p>
            ) : null}
            <button type="submit" disabled={submitting} className="iv-button inline-flex min-h-12 w-full items-center justify-center gap-2 px-5 py-3 text-sm sm:w-auto disabled:opacity-60">
              {submitting ? 'Submitting...' : getOffer(selectedOffer).primaryCta}
              {!submitting ? <Sparkles aria-hidden="true" className="h-4 w-4" /> : null}
            </button>
          </form>
        </div>
      </section>

      <section className="iv-panel p-6 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="iv-label mb-2">Partner Desk</p>
            <p className="iv-body max-w-3xl text-sm text-zinc-300">
              VIP access supports qualified opportunity review and strategy coordination. Submission does not create payment processing, acceptance, or financial guarantees.
            </p>
          </div>
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#aaff00]">Two Offers</div>
        </div>
      </section>
    </section>
  )
}

function PrivateAppreciationSchedule() {
  return (
    <section className="h-full border border-[#242424] bg-[#080808] p-5 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 border-b border-[#1f1f1f] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="iv-label-muted mb-2 text-[#aaff00]">Iron Vault</p>
          <h2 className="iv-card-title text-4xl sm:text-5xl">VIP Partner Appreciation Schedule</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Private Partner Appreciation Agreement • Illustrative payout targets based on contribution level
          </p>
        </div>
        <div className="iv-chip-lime inline-flex w-fit px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]">
          Limited Slots
        </div>
      </div>

      <div className="overflow-hidden border border-[#242424]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#aaff00] text-[#080808]">
              <th scope="col" className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] sm:px-5">
                Partner Contribution
              </th>
              <th scope="col" className="border-l border-[#080808]/20 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] sm:px-5">
                Appreciation Payout Target
              </th>
            </tr>
          </thead>
          <tbody>
            {appreciationSchedule.map(([contribution, target], index) => (
              <tr key={contribution} className={index % 2 === 0 ? 'bg-[#101010]' : 'bg-[#0b0b0b]'}>
                <td className="border-t border-[#1f1f1f] px-4 py-3 text-sm font-semibold text-zinc-100 sm:px-5">
                  {contribution}
                </td>
                <td className="border-l border-t border-[#1f1f1f] px-4 py-3 text-sm font-semibold text-[#aaff00] sm:px-5">
                  {target}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 border border-[#242424] bg-[#0f0f0f] p-4">
        <p className="iv-label-muted mb-2 text-[#aaff00]">Limited Private Partner Appreciation Agreement</p>
        <p className="text-xs leading-6 text-zinc-400">
          Iron Vault is opening a limited number of private partner positions for qualified supporters who believe in the company&apos;s education platform, lead generation model, and ecosystem expansion. Contributions are intended to support marketing, advertising, infrastructure, and member acquisition growth over the next 12 months.
        </p>
        <p className="mt-3 text-xs leading-6 text-zinc-500">
          Figures are illustrative targets only and are subject to written agreement terms, company performance, available revenue, and applicable law. No payout is guaranteed.
        </p>
      </div>
    </section>
  )
}

function Field({
  label,
  id,
  type = 'text',
  value,
  onChange,
}: {
  label: string
  id: string
  type?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="iv-label-muted mb-2 block">{label}</span>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="iv-field min-h-12 w-full px-4 py-3 text-sm"
        required
      />
    </label>
  )
}
