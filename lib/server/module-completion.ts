import { getSupabaseAdmin } from '@/lib/server/supabase-admin'
import { resolveEducationAuthUserId } from '@/lib/education-actions'

const TOTAL_MODULES = 6

type LatestQuizRow = {
  module_index: number
  passed: boolean
  attempted_at: string
}

export type ModuleCompletionStatus = {
  moduleNumber: number
  completed: boolean
  completedAt?: string | null
  reason?: string
}

function validateModuleNumber(moduleNumber: number): void {
  if (!Number.isInteger(moduleNumber) || moduleNumber < 1 || moduleNumber > TOTAL_MODULES) {
    throw new Error('Invalid moduleNumber: expected integer between 1 and 6')
  }
}

async function getLatestQuizByModule(privyUserId: string): Promise<Map<number, LatestQuizRow>> {
  const resolvedUserId = await resolveEducationAuthUserId(privyUserId)

  const { data, error } = await getSupabaseAdmin()
    .from('quiz_results')
    .select('module_index, passed, attempted_at')
    .eq('user_id', resolvedUserId)
    .order('attempted_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const latestByModule = new Map<number, LatestQuizRow>()

  for (const row of (data ?? []) as LatestQuizRow[]) {
    const moduleNumber = Number(row.module_index) + 1
    if (!Number.isInteger(moduleNumber) || moduleNumber < 1 || moduleNumber > TOTAL_MODULES) continue
    if (!latestByModule.has(moduleNumber)) {
      latestByModule.set(moduleNumber, row)
    }
  }

  return latestByModule
}

export async function getUserModuleCompletionStatus(
  privyUserId: string,
): Promise<ModuleCompletionStatus[]> {
  const latestByModule = await getLatestQuizByModule(privyUserId)

  const statuses: ModuleCompletionStatus[] = []

  for (let moduleNumber = 1; moduleNumber <= TOTAL_MODULES; moduleNumber += 1) {
    const latestQuiz = latestByModule.get(moduleNumber)

    if (!latestQuiz) {
      statuses.push({
        moduleNumber,
        completed: false,
        completedAt: null,
        reason: 'No quiz attempt recorded for module',
      })
      continue
    }

    if (!latestQuiz.passed) {
      statuses.push({
        moduleNumber,
        completed: false,
        completedAt: null,
        reason: 'Latest quiz attempt is not passed',
      })
      continue
    }

    statuses.push({
      moduleNumber,
      completed: true,
      completedAt: latestQuiz.attempted_at,
      reason: 'Latest quiz attempt is passed',
    })
  }

  return statuses
}

export async function isModuleComplete(
  privyUserId: string,
  moduleNumber: number,
): Promise<boolean> {
  validateModuleNumber(moduleNumber)

  const statuses = await getUserModuleCompletionStatus(privyUserId)
  const status = statuses.find((entry) => entry.moduleNumber === moduleNumber)

  return status?.completed === true
}
