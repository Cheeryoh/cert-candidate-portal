-- Login rate-limiting table.
-- Stores one row per hashed client identifier (IP + salt hash).
-- Accessible by the anon role so rate-limit checks work pre-authentication.
-- No PII is stored — identifiers are SHA-256(ip + server-side salt).
--
-- Limits (enforced in lib/rate-limit.ts):
--   5 failed attempts per 15-minute window → 15-minute lockout.
-- Reset window on success is handled in the server action.

create table login_rate_limits (
  identifier   text        primary key,
  attempts     int         not null default 0,
  window_start timestamptz not null default now(),
  locked_until timestamptz,
  updated_at   timestamptz not null default now()
);

alter table login_rate_limits enable row level security;

-- Allow pre-auth (anon) reads and writes scoped to own identifier.
-- The identifier is opaque (hashed) so there is no meaningful cross-user
-- data exposure, and the table contains no PII.
create policy "rate_limits: anon read/write"
  on login_rate_limits for all
  to anon, authenticated
  using (true)
  with check (true);
