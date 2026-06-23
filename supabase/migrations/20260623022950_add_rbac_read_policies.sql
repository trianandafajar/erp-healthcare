-- user_roles: user hanya bisa lihat data miliknya
CREATE POLICY "user can view own role"
ON user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- roles: semua authenticated user boleh baca
CREATE POLICY "authenticated can view roles"
ON roles FOR SELECT
TO authenticated
USING (true);

-- role_permissions: semua authenticated user boleh baca
CREATE POLICY "authenticated can view role_permissions"
ON role_permissions FOR SELECT
TO authenticated
USING (true);

-- permissions: semua authenticated user boleh baca
CREATE POLICY "authenticated can view permissions"
ON permissions FOR SELECT
TO authenticated
USING (true);