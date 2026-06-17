import { NextRequest, NextResponse } from "next/server"
import { getProgress, markLessonComplete, saveQuizResult } from "@/lib/education-actions"
import { ensureUserProfile } from "@/lib/backoffice-profile"
import { canAccessModule, requireMemberAccess, requireModuleAccess, type MemberAccessScope } from "@/lib/server/member-access"
import { getUserModuleCompletionStatus } from "@/lib/server/module-completion"
import { recordVerifiedModuleCompletion } from "@/lib/server/reward-milestones"

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function mapAccessErrorToStatus(error: unknown): number {
  const message = error instanceof Error ? error.message : ""
  if (message.startsWith("Unauthorized:")) return 401
  if (message.startsWith("Forbidden:")) return 403
  return 500
}

function getMetadataString(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = metadata?.[key]
  return typeof value === "string" ? value : undefined
}

async function syncRewardsForUser(privyUserId: string, scope: MemberAccessScope) {
  const completionStatuses = await getUserModuleCompletionStatus(privyUserId)
  const completedModules = completionStatuses
    .filter((status) => status.completed && canAccessModule(scope, status.moduleNumber))
    .map((status) => status.moduleNumber)

  const eligibleMilestoneSet = new Set<number>()
  const queuedMilestoneSet = new Set<number>()
  let walletMissing = false

  for (const moduleNumber of completedModules) {
    const result = await recordVerifiedModuleCompletion({
      privyUserId,
      moduleNumber,
      source: "academy",
      metadata: {
        trigger: "education-progress",
        reward_track: scope.rewardTrack ?? "full_academy",
        access_type: scope.accessType,
      },
      rewardTrack: scope.rewardTrack,
      entitlementId: scope.entitlementId,
    })

    for (const milestone of result.eligibleMilestones) {
      eligibleMilestoneSet.add(milestone)
    }

    for (const milestone of result.queuedMilestones) {
      queuedMilestoneSet.add(milestone)
    }

    walletMissing = walletMissing || result.walletMissing
  }

  return {
    completedModules,
    eligibleMilestones: Array.from(eligibleMilestoneSet).sort((a, b) => a - b),
    queuedMilestones: Array.from(queuedMilestoneSet).sort((a, b) => a - b),
    walletMissing,
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: unknown

    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
    }

    const payload = (body ?? {}) as {
      action?: string
      moduleIndex?: unknown
      lessonIndex?: unknown
      score?: unknown
      passed?: unknown
      userId?: unknown
    }

    if (!isNonEmptyString(payload.action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    let privyUserId: string
    let accessScope: MemberAccessScope
    try {
      const access = await requireMemberAccess(req)
      privyUserId = access.auth.privyUserId
      await ensureUserProfile(access.auth.privyUserId, {
        email: access.auth.email,
        walletAddress: access.auth.walletAddress,
        tier: getMetadataString(access.entitlement?.metadata, "tier"),
      })
      accessScope = {
        hasAccess: true,
        accessType: access.isAdmin ? "admin" : access.entitlement?.metadata?.access_type === "single_module" ? "single_module" : "all_modules",
        allowedModules: access.isAdmin
          ? [1, 2, 3, 4, 5, 6]
          : access.entitlement?.metadata?.access_type === "single_module"
            ? [Number(access.entitlement.metadata.module_number)]
            : [1, 2, 3, 4, 5, 6],
        entitlementId: access.entitlement?.id,
        rewardTrack: access.entitlement?.metadata?.reward_track === "single_module" ? "single_module" : "full_academy",
      }
    } catch (error: unknown) {
      const status = mapAccessErrorToStatus(error)
      const message = error instanceof Error ? error.message : "Failed to verify member access"
      return NextResponse.json({ error: message }, { status })
    }

    if (payload.action === "get") {
      const data = await getProgress(privyUserId)
      return NextResponse.json(data)
    }

    if (payload.action === "lesson") {
      const moduleIndex = Number(payload.moduleIndex)
      const lessonIndex = Number(payload.lessonIndex)

      if (!Number.isInteger(moduleIndex) || !Number.isInteger(lessonIndex)) {
        return NextResponse.json({ error: "Invalid moduleIndex or lessonIndex" }, { status: 400 })
      }

      const moduleNumber = moduleIndex + 1
      accessScope = await requireModuleAccess(req, moduleNumber)
      await markLessonComplete(privyUserId, moduleIndex, lessonIndex)
      const rewardSummary = await syncRewardsForUser(privyUserId, accessScope)
      return NextResponse.json({ success: true, ...rewardSummary })
    }

    if (payload.action === "quiz") {
      const moduleIndex = Number(payload.moduleIndex)
      const score = Number(payload.score)
      const passed = Boolean(payload.passed)

      if (!Number.isInteger(moduleIndex) || !Number.isInteger(score)) {
        return NextResponse.json({ error: "Invalid moduleIndex or score" }, { status: 400 })
      }

      const moduleNumber = moduleIndex + 1
      accessScope = await requireModuleAccess(req, moduleNumber)
      await saveQuizResult(privyUserId, moduleIndex, score, passed)
      const rewardSummary = await syncRewardsForUser(privyUserId, accessScope)
      return NextResponse.json({ success: true, ...rewardSummary })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process progress request"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
