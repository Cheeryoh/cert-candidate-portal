/**
 * sync-demo-password.ts
 *
 * One-shot utility that updates the demo candidate's Supabase auth password
 * to match NEXT_PUBLIC_DEMO_PASSWORD in .env.local.
 *
 * Run once whenever you change SEED_PASSWORD / NEXT_PUBLIC_DEMO_PASSWORD:
 *   npm run sync-demo-password
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *           NEXT_PUBLIC_DEMO_EMAIL, NEXT_PUBLIC_DEMO_PASSWORD in .env.local
 */

import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DEMO_EMAIL       = process.env.NEXT_PUBLIC_DEMO_EMAIL
const DEMO_PASSWORD    = process.env.NEXT_PUBLIC_DEMO_PASSWORD

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
if (!DEMO_EMAIL || !DEMO_PASSWORD) {
  console.error('Missing NEXT_PUBLIC_DEMO_EMAIL or NEXT_PUBLIC_DEMO_PASSWORD')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log(`\nSyncing password for demo account: ${DEMO_EMAIL}\n`)

  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 200 })
  if (listErr) throw new Error(`listUsers: ${listErr.message}`)

  const user = users.find(u => u.email === DEMO_EMAIL)
  if (!user) {
    console.error(`  ✗ No auth user found for ${DEMO_EMAIL}`)
    console.error('    Run npm run seed first to create the account.')
    process.exit(1)
  }

  const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
    password: DEMO_PASSWORD,
  })
  if (updateErr) throw new Error(`updateUserById: ${updateErr.message}`)

  console.log(`  ✓ Password updated for ${DEMO_EMAIL}`)
  console.log('  Restart the dev server for the change to take effect.\n')
}

main().catch(err => {
  console.error('\n✗ Failed:', err.message)
  process.exit(1)
})
