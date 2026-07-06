CREATE TABLE contact_inquiries (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL,
    email      text NOT NULL,
    subject    text,
    message    text NOT NULL,
    replied    bool NOT NULL DEFAULT false,
    replied_at timestamptz,
    reply_body text,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all_contact_inquiries"
    ON contact_inquiries
    FOR ALL
    USING (public.is_superadmin())
    WITH CHECK (public.is_superadmin());


grant select, insert, update, delete, references on table public.contact_inquiries to authenticated;
grant select, insert, update, delete, references on table public.contact_inquiries to service_role;
grant select, insert, update, delete, references on table public.contact_inquiries to anon;