import { NextRequest, NextResponse } from 'next/server'
import { requirePrivyUser } from '@/lib/server/privy-auth'
import { ensureUserProfile } from '@/lib/backoffice-profile'
import {
  IVT_TOKEN_MINT,
  getCanonicalSolanaWalletForUser,
  getIvtTokenBalance,
  getSolanaExplorerTokenMintUrl,
  getSolanaExplorerWalletUrl,
} from '@/lib/server/ivt-solana-wallet'

function isEvmWallet(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value)
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message
  return 'Failed to load profile'
}

function logProfileError(error: unknown) {
  const maybeError = error as { name?: unknown; message?: unknown; stack?: unknown }
  console.error('[backoffice/profile] error', {
    name: typeof maybeError?.name === 'string' ? maybeError.name : undefined,
    message: typeof maybeError?.message === 'string' ? maybeError.message : undefined,
    stack: typeof maybeError?.stack === 'string' ? maybeError.stack : undefined,
  })
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePrivyUser(req)
    const evmWalletAddress = isEvmWallet(auth.walletAddress) ? auth.walletAddress : null
    const profile = await ensureUserProfile(auth.privyUserId, {
      email: auth.email,
      walletAddress: evmWalletAddress ? null : auth.walletAddress,
    })
    const solanaWallet = await getCanonicalSolanaWalletForUser(auth.privyUserId)
    const balance = await getIvtTokenBalance(solanaWallet.walletAddress)

    return NextResponse.json({
      profile: {
        ...profile,
        evm_wallet_address: evmWalletAddress,
        solana_ivt_wallet_address: solanaWallet.walletAddress,
        solana_ivt_wallet_source: solanaWallet.source,
        solana_explorer_wallet_url: getSolanaExplorerWalletUrl(solanaWallet.walletAddress),
        ivt_token_mint: IVT_TOKEN_MINT,
        ivt_token_mint_explorer_url: getSolanaExplorerTokenMintUrl(),
        ivt_token_balance: balance,
      },
    })
  } catch (error: unknown) {
    const message = getErrorMessage(error)
    const status = message.startsWith('Unauthorized') ? 401 : 500
    if (status === 500) logProfileError(error)
    return NextResponse.json({ error: message }, { status })
  }
}
