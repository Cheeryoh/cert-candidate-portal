create or replace view candidate_eligibility as
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
      select id, status, score, submitted_at, expiration_date,
             reeligibility_date, attempt_number
      from exam_attempts
      where candidate_id = p.id and certification_id = c.id
      order by attempt_number desc limit 1
    ) a
  )                                             as latest_attempt
from profiles p
cross join certifications c;

alter view candidate_eligibility set (security_invoker = on);
