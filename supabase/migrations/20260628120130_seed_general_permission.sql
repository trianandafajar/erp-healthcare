INSERT INTO
    public.permissions (name, label, module)
VALUES
    ('general.access', 'General Access', 'general') ON CONFLICT (name) DO NOTHING;