"use server"

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

export async function getProgress(userId: string) {
  const [{ data: lessons, error: lessonsError }, { data: quizRows, error: quizError }] = await Promise.all([
    admin
      .from("progress")
      .select("module_index, lesson_index")
      .eq("user_id", userId),
    admin
      .from("quiz_results")
      .select("module_index, score, passed, attempted_at")
      .eq("user_id", userId)
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
  const { error } = await admin.from("progress").upsert(
    {
      user_id: userId,
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
  const { error } = await admin.from("quiz_results").insert({
    user_id: userId,
    module_index: moduleIndex,
    score,
    passed,
  })

  if (error) {
    throw new Error(error.message)
  }
}
