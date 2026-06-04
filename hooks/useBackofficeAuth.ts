"use client"

import { useContext } from 'react'
import { BackofficeContext } from '@/components/backoffice/BackofficeProvider'

export function useBackofficeAuth() {
  const context = useContext(BackofficeContext)
  if (!context) throw new Error('useBackofficeAuth must be used within BackofficeProvider')
  return context
}
