-- Recreate handle_new_user with exception handling so a profile
-- insert failure never blocks auth user creation.
-- The seed script (scripts/seed.ts) upserts profiles explicitly,
-- so the trigger is a convenience for organic signups only.

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
exception
  when others then
    -- Log but do not fail — user creation must always succeed
    raise warning 'handle_new_user: could not create profile for %: %', new.id, sqlerrm;
    return new;
end;
$$;
