import { NextRequest, NextResponse } from "next/server"
import { getProgress, markLessonComplete, saveQuizResult } from "@/lib/education-actions"
import { requireMemberAccess } from "@/lib/server/member-access"

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function mapAccessErrorToStatus(error: unknown): number {
  const message = error instanceof Error ? error.message : ""
  if (message.startsWith("Unauthorized:")) return 401
  if (message.startsWith("Forbidden:")) return 403
  return 500
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
    try {
      const access = await requireMemberAccess(req)
      privyUserId = access.auth.privyUserId
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

      await markLessonComplete(privyUserId, moduleIndex, lessonIndex)
      return NextResponse.json({ success: true })
    }

    if (payload.action === "quiz") {
      const moduleIndex = Number(payload.moduleIndex)
      const score = Number(payload.score)
      const passed = Boolean(payload.passed)

      if (!Number.isInteger(moduleIndex) || !Number.isInteger(score)) {
        return NextResponse.json({ error: "Invalid moduleIndex or score" }, { status: 400 })
      }

      await saveQuizResult(privyUserId, moduleIndex, score, passed)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process progress request"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
