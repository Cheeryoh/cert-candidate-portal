-- ORGANIZATIONS
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz default now()
);

-- PROFILES (extends auth.users)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  organization_id uuid references organizations,
  avatar_url text,
  created_at timestamptz default now()
);

-- CERTIFICATIONS
create table certifications (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  category text not null,
  passing_score int not null default 70,
  validity_months int not null default 24,
  time_limit_minutes int not null default 90,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- PREREQUISITES (junction)
create table certification_prerequisites (
  certification_id uuid references certifications on delete cascade,
  prerequisite_id  uuid references certifications on delete cascade,
  primary key (certification_id, prerequisite_id)
);

-- EXAM ATTEMPTS
create table exam_attempts (
  id uuid primary key default gen_random_uuid(),
  candidate_id       uuid not null references profiles on delete cascade,
  certification_id   uuid not null references certifications,
  attempt_number     int not null default 1,
  status             text not null check (status in
                       ('scheduled','in_progress','passed','failed','cancelled')),
  score              numeric(5,2),
  started_at         timestamptz,
  submitted_at       timestamptz,
  expiration_date    date,
  reeligibility_date date,
  created_at         timestamptz default now(),
  unique (candidate_id, certification_id, attempt_number)
);

-- ── FUTURE TABLES (stubbed, not active) ──────────────────────────────────────
-- exam_sessions        (provisioned GitHub repo environment per attempt)
-- exam_tasks           (individual tasks within an exam definition)
-- task_validations     (deterministic check results per task per attempt)
-- audit_reviews        (4D rubric qualitative assessment, one per attempt)
-- provisioned_envs     (temp account/env lifecycle records)
-- ─────────────────────────────────────────────────────────────────────────────

-- ELIGIBILITY VIEW
create view candidate_eligibility as
select
  p.id                                          as candidate_id,
  c.id                                          as certification_id,
  c.code,
  c.name,
  c.category,
  c.passing_score,
  c.validity_months,
  c.sort_order,
  not exists (
    select 1 from certification_prerequisites cp
    where cp.certification_id = c.id
      and not exists (
        select 1 from exam_attempts ea
        where ea.candidate_id = p.id
          and ea.certification_id = cp.prerequisite_id
          and ea.status = 'passed'
      )
  )                                             as prerequisites_met,
  exists (
    select 1 from exam_attempts ea
    where ea.candidate_id = p.id
      and ea.certification_id = c.id
      and ea.status = 'passed'
      and (ea.expiration_date is null or ea.expiration_date > current_date)
  )                                             as is_certified,
  (
    select row_to_json(a) from (
      select status, score, submitted_at, expiration_date,
             reeligibility_date, attempt_number
      from exam_attempts
      where candidate_id = p.id and certification_id = c.id
      order by attempt_number desc limit 1
    ) a
  )                                             as latest_attempt
from profiles p
cross join certifications c;

-- RLS
alter table organizations              enable row level security;
alter table profiles                   enable row level security;
alter table certifications             enable row level security;
alter table certification_prerequisites enable row level security;
alter table exam_attempts              enable row level security;

-- Policies
create policy "orgs: authenticated read"
  on organizations for select to authenticated using (true);

create policy "certs: authenticated read"
  on certifications for select to authenticated using (true);

create policy "prereqs: authenticated read"
  on certification_prerequisites for select to authenticated using (true);

create policy "profiles: own read/update"
  on profiles for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "attempts: own read"
  on exam_attempts for select to authenticated
  using (candidate_id = auth.uid());

-- Auto-create profile on signup
create function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
