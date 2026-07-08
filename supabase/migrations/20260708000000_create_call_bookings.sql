CREATE TABLE call_bookings (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL,
    email      text NOT NULL,
    phone      text,
    message    text,
    booking_date date NOT NULL,
    booking_time time without time zone NOT NULL,
    status     text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE call_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all_call_bookings"
    ON call_bookings
    FOR ALL
    USING (public.is_superadmin())
    WITH CHECK (public.is_superadmin());

grant select, insert, update, delete, references on table public.call_bookings to authenticated;
grant select, insert, update, delete, references on table public.call_bookings to service_role;
grant insert on table public.call_bookings to anon;
