const sessionId = process.argv[2]

if (!sessionId) {
  console.error('BLOCKER: Usage: npm run repair:stripe-session -- <stripe_checkout_session_id>')
  process.exit(1)
}

console.log('REPAIR_STRIPE_SESSION_SUPPORTED=no')
console.log('BLOCKER: Stripe fulfillment repair belongs to the payment site fulfillment module. Use the payment repo with this exact session ID.')
process.exit(1)