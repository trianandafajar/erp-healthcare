CREATE TABLE IF NOT EXISTS notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL,
  type          text NOT NULL,
  title         text NOT NULL,
  body          text,
  data          jsonb,
  is_read       bool NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Fast lookup index per user sorted by newest first
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON notifications (user_id, created_at DESC);

-- Partial index for unread count queries
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications (user_id, is_read)
  WHERE is_read = false;

-- Enable Supabase Realtime on this table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Optional: auto-delete notifications older than 90 days via pg_cron
SELECT cron.schedule('cleanup-notifications', '0 2 * * *',
  $$DELETE FROM notifications WHERE created_at < now() - INTERVAL '90 days'$$
);