import { redirect } from 'next/navigation'
import { ACADEMY_ROUTES } from '@/lib/academy-routes'

export default function LearnFreeRedirectPage() {
  redirect(ACADEMY_ROUTES.module0)
}
