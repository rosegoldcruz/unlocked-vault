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

function getStableMemberEmail(userId: string) {
  const digest = createHash("sha1").update(`iron-vault-member:${userId}`).digest("hex")
  return `privy_${digest.slice(0, 24)}@member.ironvault.local`
}

async function resolveProgressUserId(userId: string) {
  const memberEmail = getStableMemberEmail(userId)

  const { data: createdUserData, error: createUserError } = await admin.auth.admin.createUser({
    email: memberEmail,
    email_confirm: true,
    user_metadata: {
      external_user_id: userId,
      provider: "privy",
    },
  })

  let resolvedUserId = createdUserData?.user?.id

  if (!resolvedUserId) {
    const alreadyExists = createUserError?.message?.toLowerCase().includes("already")

    if (!alreadyExists) {
      throw new Error(createUserError?.message ?? "Failed to resolve member identity")
    }

    const { data: usersData, error: listUsersError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })

    if (listUsersError) {
      throw new Error(listUsersError.message)
    }

    const existingUser = usersData?.users.find((user) => user.email === memberEmail)
    if (!existingUser?.id) {
      throw new Error("Failed to find existing member auth user")
    }

    resolvedUserId = existingUser.id
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    { id: resolvedUserId },
    { onConflict: "id", ignoreDuplicates: true },
  )

  if (profileError) {
    throw new Error(profileError.message)
  }

  return resolvedUserId
}

export async function getProgress(userId: string) {
  const resolvedUserId = await resolveProgressUserId(userId)

  const [{ data: lessons, error: lessonsError }, { data: quizRows, error: quizError }] = await Promise.all([
    admin
      .from("progress")
      .select("module_index, lesson_index")
      .eq("user_id", resolvedUserId),
    admin
      .from("quiz_results")
      .select("module_index, score, passed, attempted_at")
      .eq("user_id", resolvedUserId)
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
  const resolvedUserId = await resolveProgressUserId(userId)

  const { error } = await admin.from("progress").upsert(
    {
      user_id: resolvedUserId,
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
  const resolvedUserId = await resolveProgressUserId(userId)

  const { error } = await admin.from("quiz_results").insert({
    user_id: resolvedUserId,
    module_index: moduleIndex,
    score,
    passed,
  })

  if (error) {
    throw new Error(error.message)
  }
}
