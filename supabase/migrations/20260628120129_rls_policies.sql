ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "users_see_own_notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can only update their own notifications (e.g. mark as read)
CREATE POLICY "users_update_own_notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "service_role_insert_notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE VIEW my_unread_notification_count AS
  SELECT COUNT(*) AS unread_count
  FROM notifications
  WHERE user_id = auth.uid()
    AND is_read = false;