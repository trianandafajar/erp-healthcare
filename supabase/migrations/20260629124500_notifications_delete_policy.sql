CREATE POLICY "users_delete_own_notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());
