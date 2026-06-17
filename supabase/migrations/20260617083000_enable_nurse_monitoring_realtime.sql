do $$
begin
    alter publication supabase_realtime add table public.patients;
exception
    when duplicate_object then null;
end $$;

do $$
begin
    alter publication supabase_realtime add table public.nurse_vital_signs;
exception
    when duplicate_object then null;
end $$;

do $$
begin
    alter publication supabase_realtime add table public.nurse_care_notes;
exception
    when duplicate_object then null;
end $$;

do $$
begin
    alter publication supabase_realtime add table public.nurse_procedures;
exception
    when duplicate_object then null;
end $$;
