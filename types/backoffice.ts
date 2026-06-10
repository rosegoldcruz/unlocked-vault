export type BackofficeProfile = {
  id: string
  privy_user_id: string
  email: string | null
  role: 'MEMBER' | 'VIP' | 'ADMIN'
  current_tier: string | null
  referral_code: string
  referred_by_privy_user_id: string | null
  vault_xp: number
  wallet_address: string | null
  evm_wallet_address?: string | null
  solana_ivt_wallet_address?: string | null
  solana_ivt_wallet_source?: 'profile' | 'privy' | 'payout_job' | 'transaction' | 'none'
  solana_explorer_wallet_url?: string | null
  ivt_token_mint?: string
  ivt_token_mint_explorer_url?: string
  ivt_token_balance?: {
    amountRaw: string
    decimals: number
    uiAmount: string
  } | null
  created_at: string
  updated_at: string
}

export type ReferralLead = {
  id: string
  privy_user_id: string
  name: string
  phone: string
  relationship: string | null
  best_time_to_call: string | null
  profession: string | null
  link_sent: boolean
  status: string
  created_at: string
  updated_at: string
}

export type UserPosition = {
  id: string
  privy_user_id: string
  investment_total: number
  advance_amount: number
  royalty_spent: number
  token_balance: number
  dividends_total: number
  royalty_2_percent_status: 'YES' | 'NO' | 'DISCONTINUED'
  royalty_1_percent_status: 'YES' | 'NO' | 'DISCONTINUED'
  ownership_position_status: 'YES' | 'NO' | 'DISCONTINUED'
  equity_status: 'YES' | 'NO' | 'DISCONTINUED'
  winning_portfolio_status: 'YES' | 'NO' | 'DISCONTINUED'
  created_at: string
  updated_at: string
}

export type StatusTicket = {
  id: string
  privy_user_id: string
  name: string | null
  email: string | null
  subject: string
  message: string
  admin_response: string | null
  status: 'PENDING' | 'RESPONDED' | 'CLOSED'
  last_update: string | null
  created_at: string
  updated_at: string
}
