INSERT INTO plan_features (plan, feature_key, feature_label, feature_category, is_available, limit_value, sort_order)
VALUES
    ('starter', 'healthcare_branding', 'Healthcare Branding (Name & Logo)', 'feature', true, null, 5),
    ('basic', 'healthcare_branding', 'Healthcare Branding (Name & Logo)', 'feature', true, null, 9),
    ('professional', 'healthcare_branding', 'Healthcare Branding (Name & Logo)', 'feature', true, null, 15),
    ('enterprise', 'healthcare_branding', 'Healthcare Branding (Name & Logo)', 'feature', true, null, 5)
ON CONFLICT (plan, feature_key) DO NOTHING;
