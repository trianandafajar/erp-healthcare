ALTER TABLE prescriptions
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Pending' CHECK (
    status IN ('Pending', 'Verified', 'Rejected', 'Dispensed')
);