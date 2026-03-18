-- Enforce prerequisite eligibility at the database layer.
-- Runs as SECURITY DEFINER so it can read all exam_attempts
-- regardless of the caller's RLS context.
--
-- Fires BEFORE INSERT on exam_attempts.  Raises an exception if the
-- candidate has not passed every prerequisite for the target certification.
-- Certifications with no prerequisites are always allowed.
--
-- Note: The seed script inserts attempts sequentially in dependency order,
-- so this trigger does not break idempotent re-seeding.

create or replace function enforce_attempt_eligibility()
returns trigger language plpgsql security definer as $$
declare
  prereqs_unmet int;
begin
  select count(*)
  into   prereqs_unmet
  from   certification_prerequisites cp
  where  cp.certification_id = new.certification_id
    and  not exists (
           select 1
           from   exam_attempts ea
           where  ea.candidate_id       = new.candidate_id
             and  ea.certification_id   = cp.prerequisite_id
             and  ea.status             = 'passed'
         );

  if prereqs_unmet > 0 then
    raise exception
      'prerequisites_not_met: candidate % has % unmet prerequisite(s) for certification %',
      new.candidate_id, prereqs_unmet, new.certification_id
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

-- Drop first in case migration is re-run
drop trigger if exists check_attempt_eligibility on exam_attempts;

create trigger check_attempt_eligibility
  before insert on exam_attempts
  for each row execute function enforce_attempt_eligibility();
