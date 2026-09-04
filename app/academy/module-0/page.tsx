import { redirect } from 'next/navigation'
import { ACADEMY_ROUTES } from '@/lib/academy-routes'

export default function AcademyModuleZeroRedirectPage() {
  redirect(ACADEMY_ROUTES.module0)
}
