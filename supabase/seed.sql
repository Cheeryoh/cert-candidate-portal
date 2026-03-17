-- ============================================================
-- SEED DATA — cert-candidate-portal demo
-- Run against a fresh Supabase project after migration 0001.
-- Creates auth users via Supabase dashboard or service-role API.
-- ============================================================

-- ── ORGANIZATIONS ─────────────────────────────────────────────────────────────
insert into organizations (id, name, slug) values
  ('00000000-0000-0000-0000-000000000001', 'Acme Corp',          'acme-corp'),
  ('00000000-0000-0000-0000-000000000002', 'TechBridge Solutions','techbridge-solutions'),
  ('00000000-0000-0000-0000-000000000003', 'Nexus Partners',      'nexus-partners'),
  ('00000000-0000-0000-0000-000000000004', 'Independent',         'independent');

-- ── CERTIFICATIONS ────────────────────────────────────────────────────────────
insert into certifications (id, code, name, category, passing_score, validity_months, time_limit_minutes, sort_order) values
  ('10000000-0000-0000-0000-000000000001', 'AIFC-F1',  'AI Fluency: Foundation',              'AI Fluency',            70, 24, 60,  1),
  ('10000000-0000-0000-0000-000000000002', 'AIFC-P1',  'AI Fluency: Practitioner',            'AI Fluency',            75, 24, 90,  2),
  ('10000000-0000-0000-0000-000000000003', 'AIFC-E1',  'AI Fluency: Expert',                  'AI Fluency',            80, 24, 120, 3),
  ('10000000-0000-0000-0000-000000000004', 'CCPA-101', 'Claude Code Proficiency: Associate',  'Claude Code',           70, 24, 90,  4),
  ('10000000-0000-0000-0000-000000000005', 'CCPA-201', 'Claude Code Proficiency: Professional','Claude Code',          78, 24, 120, 5);

-- ── PREREQUISITES ─────────────────────────────────────────────────────────────
insert into certification_prerequisites (certification_id, prerequisite_id) values
  ('10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001'), -- AIFC-P1 requires AIFC-F1
  ('10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002'), -- AIFC-E1 requires AIFC-P1
  ('10000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004'); -- CCPA-201 requires CCPA-101

-- ── PROFILES (seed candidates) ───────────────────────────────────────────────
-- NOTE: Before running this seed, create the following auth users in Supabase
-- (Authentication → Users → Add User), using password: SeedPass123!
--
--   alice@example.com   → id: 20000000-0000-0000-0000-000000000001
--   bob@example.com     → id: 20000000-0000-0000-0000-000000000002
--   carol@example.com   → id: 20000000-0000-0000-0000-000000000003
--   david@example.com   → id: 20000000-0000-0000-0000-000000000004
--   eve@example.com     → id: 20000000-0000-0000-0000-000000000005
--   frank@example.com   → id: 20000000-0000-0000-0000-000000000006
--
-- The trigger handle_new_user() will auto-insert profile rows.
-- Then run the UPDATE below to set org + full_name overrides.

update profiles set
  full_name = 'Alice Anderson',
  organization_id = '00000000-0000-0000-0000-000000000001'
where id = '20000000-0000-0000-0000-000000000001';

update profiles set
  full_name = 'Bob Butler',
  organization_id = '00000000-0000-0000-0000-000000000002'
where id = '20000000-0000-0000-0000-000000000002';

update profiles set
  full_name = 'Carol Chen',
  organization_id = '00000000-0000-0000-0000-000000000003'
where id = '20000000-0000-0000-0000-000000000003';

update profiles set
  full_name = 'David Diaz',
  organization_id = '00000000-0000-0000-0000-000000000001'
where id = '20000000-0000-0000-0000-000000000004';

update profiles set
  full_name = 'Eve Edwards',
  organization_id = '00000000-0000-0000-0000-000000000004'
where id = '20000000-0000-0000-0000-000000000005';

update profiles set
  full_name = 'Frank Foster',
  organization_id = '00000000-0000-0000-0000-000000000002'
where id = '20000000-0000-0000-0000-000000000006';

-- ── EXAM ATTEMPTS ─────────────────────────────────────────────────────────────
-- Alice: certified AIFC-F1 + AIFC-P1 (active), scheduled for AIFC-E1
insert into exam_attempts (candidate_id, certification_id, attempt_number, status, score, submitted_at, expiration_date) values
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',1,'passed',85.0,'2024-06-01','2026-06-01'),
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002',1,'passed',82.5,'2024-09-15','2026-09-15'),
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003',1,'scheduled',null,null,null);

-- Bob: passed AIFC-F1, failed AIFC-P1 twice (re-eligible in future)
insert into exam_attempts (candidate_id, certification_id, attempt_number, status, score, submitted_at, expiration_date, reeligibility_date) values
  ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001',1,'passed',73.0,'2024-03-10','2026-03-10',null),
  ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002',1,'failed',58.0,'2024-05-20',null,'2024-07-20'),
  ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002',2,'failed',64.0,'2024-08-10',null,'2024-10-10');

-- Carol: in-progress AIFC-F1, no history on others
insert into exam_attempts (candidate_id, certification_id, attempt_number, status, score, started_at) values
  ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001',1,'in_progress',null,'2026-03-17 10:00:00');

-- David: certified CCPA-101, passed CCPA-201, expired AIFC-F1
insert into exam_attempts (candidate_id, certification_id, attempt_number, status, score, submitted_at, expiration_date) values
  ('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000004',1,'passed',90.0,'2022-01-15','2024-01-15'),  -- expired
  ('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000004',2,'passed',95.0,'2024-02-20','2026-02-20'),  -- active
  ('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000005',1,'passed',88.0,'2024-06-01','2026-06-01');

-- Eve: no attempts at all (new candidate, no rows needed)

-- Frank: scheduled for CCPA-101, cancelled AIFC-F1
insert into exam_attempts (candidate_id, certification_id, attempt_number, status, score, submitted_at) values
  ('20000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000001',1,'cancelled',null,'2024-11-01'),
  ('20000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000004',1,'scheduled',null,null);
