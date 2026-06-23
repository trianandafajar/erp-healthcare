CREATE TABLE public.billing (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    medical_record_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    service_name TEXT NOT NULL,
    department TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending', 'Paid', 'Overdue')),
    payment_method TEXT NULL,
    service_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    paid_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL,
    CONSTRAINT billing_pkey PRIMARY KEY (id),
    CONSTRAINT billing_medical_record_id_fkey FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE CASCADE,
    CONSTRAINT billing_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id)
);

ALTER TABLE public.billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON public.billing
TO service_role
USING (true)
WITH CHECK (true);

GRANT ALL ON public.billing TO postgres, authenticated, service_role, anon;