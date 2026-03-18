/**
 * seed.ts — Full idempotent seed for cert-candidate-portal
 *
 * Creates auth users via Supabase Admin API, then seeds all reference
 * and transactional data. Safe to re-run: existing records are skipped.
 *
 * Usage:  npm run seed
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg: string) { console.log(`  ${msg}`) }
function ok(msg: string)  { console.log(`  ✓ ${msg}`) }
function skip(msg: string){ console.log(`  – ${msg} (already exists, skipped)`) }

async function upsertRows(
  table: string,
  rows: Record<string, unknown>[],
  conflictCol: string,
) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict: conflictCol, ignoreDuplicates: true })
  if (error) throw new Error(`${table}: ${error.message}`)
}

// ── Organizations ─────────────────────────────────────────────────────────────

async function seedOrganizations() {
  log('Seeding organizations…')
  await upsertRows('organizations', [
    { id: '00000000-0000-0000-0000-000000000001', name: 'Acme Corp',           slug: 'acme-corp' },
    { id: '00000000-0000-0000-0000-000000000002', name: 'TechBridge Solutions', slug: 'techbridge-solutions' },
    { id: '00000000-0000-0000-0000-000000000003', name: 'Nexus Partners',       slug: 'nexus-partners' },
    { id: '00000000-0000-0000-0000-000000000004', name: 'Independent',          slug: 'independent' },
  ], 'slug')
  ok('4 organizations')
}

// ── Certifications ────────────────────────────────────────────────────────────

async function seedCertifications() {
  log('Seeding certifications…')
  await upsertRows('certifications', [
    { id: '10000000-0000-0000-0000-000000000001', code: 'AIFC-F1',  name: 'AI Fluency: Foundation',               category: 'AI Fluency',  passing_score: 70, validity_months: 24, time_limit_minutes: 60,  sort_order: 1 },
    { id: '10000000-0000-0000-0000-000000000002', code: 'AIFC-P1',  name: 'AI Fluency: Practitioner',             category: 'AI Fluency',  passing_score: 75, validity_months: 24, time_limit_minutes: 90,  sort_order: 2 },
    { id: '10000000-0000-0000-0000-000000000003', code: 'AIFC-E1',  name: 'AI Fluency: Expert',                   category: 'AI Fluency',  passing_score: 80, validity_months: 24, time_limit_minutes: 120, sort_order: 3 },
    { id: '10000000-0000-0000-0000-000000000004', code: 'CCPA-101', name: 'Claude Code Proficiency: Associate',   category: 'Claude Code', passing_score: 70, validity_months: 24, time_limit_minutes: 90,  sort_order: 4 },
    { id: '10000000-0000-0000-0000-000000000005', code: 'CCPA-201', name: 'Claude Code Proficiency: Professional',category: 'Claude Code', passing_score: 78, validity_months: 24, time_limit_minutes: 120, sort_order: 5 },
  ], 'code')
  ok('5 certifications')
}

// ── Prerequisites ─────────────────────────────────────────────────────────────

async function seedPrerequisites() {
  log('Seeding prerequisites…')
  await upsertRows('certification_prerequisites', [
    { certification_id: '10000000-0000-0000-0000-000000000002', prerequisite_id: '10000000-0000-0000-0000-000000000001' }, // AIFC-P1 → AIFC-F1
    { certification_id: '10000000-0000-0000-0000-000000000003', prerequisite_id: '10000000-0000-0000-0000-000000000002' }, // AIFC-E1 → AIFC-P1
    { certification_id: '10000000-0000-0000-0000-000000000005', prerequisite_id: '10000000-0000-0000-0000-000000000004' }, // CCPA-201 → CCPA-101
  ], 'certification_id,prerequisite_id')
  ok('3 prerequisites')
}

// ── Auth users + profiles ─────────────────────────────────────────────────────

const CANDIDATES = [
  { email: 'alice@example.com',  fullName: 'Alice Anderson', orgSlug: 'acme-corp',             orgId: '00000000-0000-0000-0000-000000000001' },
  { email: 'bob@example.com',    fullName: 'Bob Butler',     orgSlug: 'techbridge-solutions',   orgId: '00000000-0000-0000-0000-000000000002' },
  { email: 'carol@example.com',  fullName: 'Carol Chen',     orgSlug: 'nexus-partners',         orgId: '00000000-0000-0000-0000-000000000003' },
  { email: 'david@example.com',  fullName: 'David Diaz',     orgSlug: 'acme-corp',             orgId: '00000000-0000-0000-0000-000000000001' },
  { email: 'eve@example.com',    fullName: 'Eve Edwards',    orgSlug: 'independent',            orgId: '00000000-0000-0000-0000-000000000004' },
  { email: 'frank@example.com',  fullName: 'Frank Foster',   orgSlug: 'techbridge-solutions',   orgId: '00000000-0000-0000-0000-000000000002' },
]

// Returns a map of email → user UUID
async function seedAuthUsers(): Promise<Record<string, string>> {
  log('Seeding auth users…')
  const idMap: Record<string, string> = {}

  // Fetch all existing auth users once
  const { data: existing, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 200 })
  if (listErr) throw new Error(`listUsers: ${listErr.message}`)
  const existingByEmail = new Map((existing?.users ?? []).map(u => [u.email, u.id]))

  for (const candidate of CANDIDATES) {
    if (existingByEmail.has(candidate.email)) {
      skip(candidate.email)
      idMap[candidate.email] = existingByEmail.get(candidate.email)!
      continue
    }

    // SEED_PASSWORD must be set in .env.local before running.
    // Never commit real passwords — rotate after each demo cycle.
    const seedPassword = process.env.SEED_PASSWORD
    if (!seedPassword) {
      throw new Error(
        'SEED_PASSWORD is not set in .env.local. ' +
        'Add a strong password (min 12 chars) and rerun.',
      )
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: candidate.email,
      password: seedPassword,
      email_confirm: true,
      user_metadata: { full_name: candidate.fullName },
    })

    if (error) throw new Error(`createUser ${candidate.email}: ${error.message}`)
    idMap[candidate.email] = data.user.id
    ok(`Created ${candidate.email}`)
  }

  return idMap
}

async function seedProfiles(idMap: Record<string, string>) {
  log('Upserting profiles (bypasses trigger dependency)…')
  for (const candidate of CANDIDATES) {
    const userId = idMap[candidate.email]
    const { error } = await supabase
      .from('profiles')
      .upsert(
        { id: userId, full_name: candidate.fullName, organization_id: candidate.orgId },
        { onConflict: 'id' },
      )
    if (error) throw new Error(`profile ${candidate.email}: ${error.message}`)
    ok(`${candidate.fullName} → ${candidate.orgSlug}`)
  }
}

// ── Exam attempts ─────────────────────────────────────────────────────────────

async function seedAttempts(idMap: Record<string, string>) {
  log('Seeding exam attempts…')

  const alice  = idMap['alice@example.com']
  const bob    = idMap['bob@example.com']
  const carol  = idMap['carol@example.com']
  const david  = idMap['david@example.com']
  // eve has no attempts
  const frank  = idMap['frank@example.com']

  const C = {
    AIFC_F1:  '10000000-0000-0000-0000-000000000001',
    AIFC_P1:  '10000000-0000-0000-0000-000000000002',
    AIFC_E1:  '10000000-0000-0000-0000-000000000003',
    CCPA_101: '10000000-0000-0000-0000-000000000004',
    CCPA_201: '10000000-0000-0000-0000-000000000005',
  }

  const attempts = [
    // Alice: certified AIFC-F1 + AIFC-P1 (active), scheduled for AIFC-E1
    { candidate_id: alice, certification_id: C.AIFC_F1,  attempt_number: 1, status: 'passed',      score: 85.0, submitted_at: '2024-06-01T00:00:00Z', expiration_date: '2026-06-01' },
    { candidate_id: alice, certification_id: C.AIFC_P1,  attempt_number: 1, status: 'passed',      score: 82.5, submitted_at: '2024-09-15T00:00:00Z', expiration_date: '2026-09-15' },
    { candidate_id: alice, certification_id: C.AIFC_E1,  attempt_number: 1, status: 'scheduled',   score: null, started_at: null },

    // Bob: passed AIFC-F1, failed AIFC-P1 twice
    { candidate_id: bob, certification_id: C.AIFC_F1,  attempt_number: 1, status: 'passed', score: 73.0, submitted_at: '2024-03-10T00:00:00Z', expiration_date: '2026-03-10' },
    { candidate_id: bob, certification_id: C.AIFC_P1,  attempt_number: 1, status: 'failed', score: 58.0, submitted_at: '2024-05-20T00:00:00Z', reeligibility_date: '2024-07-20' },
    { candidate_id: bob, certification_id: C.AIFC_P1,  attempt_number: 2, status: 'failed', score: 64.0, submitted_at: '2024-08-10T00:00:00Z', reeligibility_date: '2024-10-10' },

    // Carol: in-progress AIFC-F1
    { candidate_id: carol, certification_id: C.AIFC_F1, attempt_number: 1, status: 'in_progress', score: null, started_at: '2026-03-17T10:00:00Z' },

    // David: CCPA-101 expired + renewed, CCPA-201 passed
    { candidate_id: david, certification_id: C.CCPA_101, attempt_number: 1, status: 'passed', score: 90.0, submitted_at: '2022-01-15T00:00:00Z', expiration_date: '2024-01-15' },
    { candidate_id: david, certification_id: C.CCPA_101, attempt_number: 2, status: 'passed', score: 95.0, submitted_at: '2024-02-20T00:00:00Z', expiration_date: '2026-02-20' },
    { candidate_id: david, certification_id: C.CCPA_201, attempt_number: 1, status: 'passed', score: 88.0, submitted_at: '2024-06-01T00:00:00Z', expiration_date: '2026-06-01' },

    // Frank: cancelled AIFC-F1, scheduled CCPA-101
    { candidate_id: frank, certification_id: C.AIFC_F1,  attempt_number: 1, status: 'cancelled', score: null, submitted_at: '2024-11-01T00:00:00Z' },
    { candidate_id: frank, certification_id: C.CCPA_101, attempt_number: 1, status: 'scheduled', score: null },
  ]

  // Insert ignoring duplicates on (candidate_id, certification_id, attempt_number)
  for (const attempt of attempts) {
    const { error } = await supabase.from('exam_attempts').upsert(attempt, {
      onConflict: 'candidate_id,certification_id,attempt_number',
      ignoreDuplicates: true,
    })
    if (error) throw new Error(`attempt insert: ${error.message}`)
  }
  ok(`${attempts.length} exam attempts`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 cert-candidate-portal seed\n')

  await seedOrganizations()
  await seedCertifications()
  await seedPrerequisites()
  const idMap = await seedAuthUsers()
  await seedProfiles(idMap)
  await seedAttempts(idMap)

  console.log('\n✅ Seed complete.\n')
  console.log(`  ${CANDIDATES.length} candidate accounts ready.`)
  console.log('  Password: value of SEED_PASSWORD in .env.local')
  console.log('  Keep this secret — do not log or share CI output.\n')
}

main().catch(err => {
  console.error('\n❌ Seed failed:', err.message)
  process.exit(1)
})
