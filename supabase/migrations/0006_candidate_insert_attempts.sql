-- Allow candidates to insert their own exam attempts.
-- Required for the "Register & Start Exam" self-service flow.
-- The candidate_id is enforced to equal auth.uid() so a candidate
-- cannot create attempts on behalf of others.
create policy "attempts: own insert"
  on exam_attempts for insert to authenticated
  with check (candidate_id = auth.uid());
