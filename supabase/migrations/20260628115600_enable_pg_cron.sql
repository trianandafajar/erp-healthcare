-- Enable pg_cron so later migrations can use cron.schedule()
-- No-op on remote Supabase where pg_cron is already available.
create extension if not exists pg_cron;
