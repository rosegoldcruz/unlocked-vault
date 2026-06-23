import { NextRequest, NextResponse } from 'next/server'

const WEBHOOK_ENV_KEYS = [
  'GHL_ORIENTATION_WEBHOOK_URL',
  'GHL_PRESALE_WEBHOOK_URL',
  'GHL_WEBHOOK_URL',
] as const

function getOrientationWebhookUrl() {
  for (const key of WEBHOOK_ENV_KEYS) {
    const value = process.env[key]
    if (value && value.trim().length > 0) {
      return { key, url: value.trim() }
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  let payload: unknown

  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 })
  }

  const webhook = getOrientationWebhookUrl()
  const body = {
    ...(typeof payload === 'object' && payload !== null ? payload : {}),
    tags: ['presale-qualified', 'orientation-passed'],
    source: 'iron-vault-academy-orientation',
  }

  if (!webhook) {
    console.warn('[academy:orientation-qualified] GHL webhook URL is not configured; skipping presale qualification webhook.')
    return NextResponse.json({ success: true, sent: false, reason: 'webhook_not_configured' })
  }

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      console.warn('[academy:orientation-qualified] GHL webhook returned a non-2xx response.', {
        envKey: webhook.key,
        status: response.status,
      })
      return NextResponse.json({ success: true, sent: false, reason: 'webhook_non_2xx', status: response.status })
    }

    return NextResponse.json({ success: true, sent: true })
  } catch (error: unknown) {
    console.warn('[academy:orientation-qualified] Failed to send GHL webhook.', {
      envKey: webhook.key,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json({ success: true, sent: false, reason: 'webhook_send_failed' })
  }
}