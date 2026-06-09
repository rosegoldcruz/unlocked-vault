import { NextResponse } from 'next/server'

type NewsSource = {
  name: string
  url: string
  focus: string
}

type FeedItem = {
  title: string
  url: string
  source: string
  publishedAt: string | null
  summary: string
  score: number
  positiveLens: string
}

const NEWS_SOURCES: NewsSource[] = [
  {
    name: 'The Defiant',
    url: 'https://thedefiant.io/api/feed',
    focus: 'DeFi protocols, onchain markets, and builder activity',
  },
  {
    name: 'Cointelegraph DeFi',
    url: 'https://cointelegraph.com/rss/tag/defi',
    focus: 'DeFi market news and crypto adoption coverage',
  },
  {
    name: 'CoinDesk',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    focus: 'Digital asset markets, institutions, and policy',
  },
  {
    name: 'Decrypt',
    url: 'https://decrypt.co/feed',
    focus: 'Crypto, Web3, and protocol ecosystem updates',
  },
]

const DEFI_KEYWORDS = [
  'defi',
  'decentralized finance',
  'dex',
  'dao',
  'staking',
  'liquid staking',
  'yield',
  'lending',
  'borrow',
  'liquidity',
  'stablecoin',
  'tokenized',
  'rwa',
  'protocol',
  'onchain',
  'on-chain',
  'ethereum',
  'solana',
  'layer 2',
  'l2',
  'rollup',
]

const POSITIVE_KEYWORDS = [
  'adoption',
  'launch',
  'growth',
  'surge',
  'record',
  'expands',
  'partnership',
  'integrates',
  'upgrade',
  'raises',
  'funding',
  'approved',
  'breakthrough',
  'rally',
  'inflow',
  'institutional',
  'mainstream',
  'scales',
  'improves',
]

function decodeEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

function cleanText(value: string): string {
  return decodeEntities(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getTagValue(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match ? cleanText(match[1]) : null
}

function getLinkValue(itemXml: string): string | null {
  const explicitLink = getTagValue(itemXml, 'link')
  if (explicitLink?.startsWith('http')) return explicitLink

  const hrefMatch = itemXml.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i)
  if (hrefMatch?.[1]?.startsWith('http')) return cleanText(hrefMatch[1])

  const guid = getTagValue(itemXml, 'guid')
  return guid?.startsWith('http') ? guid : null
}

function countMatches(text: string, keywords: string[]): number {
  return keywords.reduce((count, keyword) => (text.includes(keyword) ? count + 1 : count), 0)
}

function getPositiveLens(text: string): string {
  if (/(adoption|institutional|mainstream|approved|inflow)/i.test(text)) {
    return 'Adoption signal: more traditional capital and users are finding routes into crypto markets.'
  }
  if (/(launch|upgrade|integrates|scales|improves|partnership)/i.test(text)) {
    return 'Builder signal: protocols and platforms are still shipping infrastructure for the next cycle.'
  }
  if (/(liquidity|stablecoin|tokenized|rwa|yield|staking)/i.test(text)) {
    return 'DeFi signal: onchain finance keeps adding practical ways to move, save, and deploy capital.'
  }
  return 'Market signal: useful context for members tracking crypto and DeFi momentum today.'
}

function scoreItem(title: string, summary: string, publishedAt: string | null): number {
  const text = `${title} ${summary}`.toLowerCase()
  const defiScore = countMatches(text, DEFI_KEYWORDS) * 4
  const positiveScore = countMatches(text, POSITIVE_KEYWORDS) * 2
  const publishedTime = publishedAt ? Date.parse(publishedAt) : Number.NaN
  const ageHours = Number.isFinite(publishedTime) ? (Date.now() - publishedTime) / 3_600_000 : 72
  const recencyScore = ageHours <= 24 ? 8 : ageHours <= 72 ? 4 : 0

  return defiScore + positiveScore + recencyScore
}

function parseFeed(xml: string, source: NewsSource): FeedItem[] {
  const blocks = [...xml.matchAll(/<(item|entry)[\s\S]*?<\/\1>/gi)].map((match) => match[0])

  return blocks
    .map((itemXml) => {
      const title = getTagValue(itemXml, 'title')
      const url = getLinkValue(itemXml)
      const publishedAt =
        getTagValue(itemXml, 'pubDate') ??
        getTagValue(itemXml, 'published') ??
        getTagValue(itemXml, 'updated')
      const summary =
        getTagValue(itemXml, 'description') ??
        getTagValue(itemXml, 'summary') ??
        getTagValue(itemXml, 'content:encoded') ??
        ''

      if (!title || !url) return null

      return {
        title,
        url,
        source: source.name,
        publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
        summary: summary.slice(0, 220),
        score: scoreItem(title, summary, publishedAt),
        positiveLens: getPositiveLens(`${title} ${summary}`),
      }
    })
    .filter((item): item is FeedItem => Boolean(item))
}

async function fetchSource(source: NewsSource): Promise<FeedItem[]> {
  try {
    const response = await fetch(source.url, {
      headers: {
        Accept: 'application/rss+xml, application/xml, text/xml',
        'User-Agent': 'IronVaultMemberPortal/1.0',
      },
      next: { revalidate: 900 },
    })

    if (!response.ok) return []

    return parseFeed(await response.text(), source)
  } catch {
    return []
  }
}

export async function GET() {
  const feedResults = await Promise.all(NEWS_SOURCES.map(fetchSource))
  const seenUrls = new Set<string>()
  const items = feedResults
    .flat()
    .filter((item) => {
      if (seenUrls.has(item.url)) return false
      seenUrls.add(item.url)
      return item.score >= 4
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return Date.parse(b.publishedAt ?? '') - Date.parse(a.publishedAt ?? '')
    })
    .slice(0, 5)

  return NextResponse.json({
    asOf: new Date().toISOString(),
    items,
    sources: NEWS_SOURCES.map(({ name, url, focus }) => ({ name, url, focus })),
  })
}
