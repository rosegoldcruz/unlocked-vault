import { NextRequest, NextResponse } from "next/server"
import { getProgress, markLessonComplete, saveQuizResult } from "@/lib/education-actions"

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, userId } = body as { action?: string; userId?: string }

    if (!isNonEmptyString(userId)) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    if (action === "get") {
      const data = await getProgress(userId)
      return NextResponse.json(data)
    }

    if (action === "lesson") {
      const moduleIndex = Number(body?.moduleIndex)
      const lessonIndex = Number(body?.lessonIndex)

      if (!Number.isInteger(moduleIndex) || !Number.isInteger(lessonIndex)) {
        return NextResponse.json({ error: "Invalid moduleIndex or lessonIndex" }, { status: 400 })
      }

      await markLessonComplete(userId, moduleIndex, lessonIndex)
      return NextResponse.json({ success: true })
    }

    if (action === "quiz") {
      const moduleIndex = Number(body?.moduleIndex)
      const score = Number(body?.score)
      const passed = Boolean(body?.passed)

      if (!Number.isInteger(moduleIndex) || !Number.isInteger(score)) {
        return NextResponse.json({ error: "Invalid moduleIndex or score" }, { status: 400 })
      }

      await saveQuizResult(userId, moduleIndex, score, passed)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process progress request"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
