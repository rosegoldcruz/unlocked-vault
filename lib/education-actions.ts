"use server"

import { createHash } from "node:crypto"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL")
}

if (!supabaseServiceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY")
}

const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

type LessonProgressRow = {
  module_index: number
  lesson_index: number
}

type QuizResultRow = {
  module_index: number
  score: number
  passed: boolean
  attempted_at: string
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizeUserId(userId: string) {
  if (UUID_REGEX.test(userId)) {
    return userId
  }

  const namespace = "iron-vault-progress"
  const hash = createHash("sha1").update(`${namespace}:${userId}`).digest("hex")
  const raw = hash.slice(0, 32).split("")

  raw[12] = "5"
  raw[16] = ((parseInt(raw[16], 16) & 0x3) | 0x8).toString(16)

  return `${raw.slice(0, 8).join("")}-${raw.slice(8, 12).join("")}-${raw.slice(12, 16).join("")}-${raw.slice(16, 20).join("")}-${raw.slice(20, 32).join("")}`
}

export async function getProgress(userId: string) {
  const normalizedUserId = normalizeUserId(userId)

  const [{ data: lessons, error: lessonsError }, { data: quizRows, error: quizError }] = await Promise.all([
    admin
      .from("progress")
      .select("module_index, lesson_index")
      .eq("user_id", normalizedUserId),
    admin
      .from("quiz_results")
      .select("module_index, score, passed, attempted_at")
      .eq("user_id", normalizedUserId)
      .order("attempted_at", { ascending: false }),
  ])

  if (lessonsError) {
    throw new Error(lessonsError.message)
  }

  if (quizError) {
    throw new Error(quizError.message)
  }

  const latestQuizByModule = new Map<number, Omit<QuizResultRow, "attempted_at">>()

  for (const row of (quizRows ?? []) as QuizResultRow[]) {
    if (!latestQuizByModule.has(row.module_index)) {
      latestQuizByModule.set(row.module_index, {
        module_index: row.module_index,
        score: row.score,
        passed: row.passed,
      })
    }
  }

  return {
    lessons: (lessons ?? []) as LessonProgressRow[],
    quizResults: Array.from(latestQuizByModule.values()),
  }
}

export async function markLessonComplete(userId: string, moduleIndex: number, lessonIndex: number) {
  const normalizedUserId = normalizeUserId(userId)

  const { error } = await admin.from("progress").upsert(
    {
      user_id: normalizedUserId,
      module_index: moduleIndex,
      lesson_index: lessonIndex,
    },
    {
      onConflict: "user_id,module_index,lesson_index",
      ignoreDuplicates: true,
    },
  )

  if (error) {
    throw new Error(error.message)
  }
}

export async function saveQuizResult(userId: string, moduleIndex: number, score: number, passed: boolean) {
  const normalizedUserId = normalizeUserId(userId)

  const { error } = await admin.from("quiz_results").insert({
    user_id: normalizedUserId,
    module_index: moduleIndex,
    score,
    passed,
  })

  if (error) {
    throw new Error(error.message)
  }
}
