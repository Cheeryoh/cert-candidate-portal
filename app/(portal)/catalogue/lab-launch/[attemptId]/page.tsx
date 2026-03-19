import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

/**
 * Server component that generates a Supabase magic link and issues an HTTP
 * redirect to the Performance Lab's auth callback.
 *
 * redirect() in a server component emits a real HTTP 307, which the browser
 * follows as a full navigation — including cross-origin URLs. This is the
 * correct pattern; redirect() in server *actions* only supports same-origin.
 */
export default async function LabLaunchPage({
  params,
}: {
  params: Promise<{ attemptId: string }>
}) {
  const { attemptId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const labUrl = process.env.PERFORMANCE_LAB_URL
  if (!labUrl) redirect('/catalogue')

  // Verify the attempt belongs to this user
  const { data: attempt } = await supabase
    .from('exam_attempts')
    .select('id')
    .eq('id', attemptId)
    .eq('candidate_id', user.id)
    .maybeSingle()

  if (!attempt) redirect('/catalogue')

  // Generate a single-use magic link for cross-domain auth handoff
  const admin = createAdminClient()
  const { data: linkData, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: user.email!,
  })

  if (!error && linkData?.properties?.hashed_token) {
    const next = encodeURIComponent(`/exam/launch/${attemptId}`)
    redirect(
      `${labUrl}/api/auth/callback?token_hash=${linkData.properties.hashed_token}&next=${next}`,
    )
  }

  // Fallback if magic link generation fails — lab will bounce back to
  // portal login if the candidate has no session on the lab domain
  redirect(`${labUrl}/exam/launch/${attemptId}`)
}
