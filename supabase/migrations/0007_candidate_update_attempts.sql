create policy "attempts: own update"
  on exam_attempts for update to authenticated
  using (candidate_id = auth.uid())
  with check (candidate_id = auth.uid());
