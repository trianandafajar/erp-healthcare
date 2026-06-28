CREATE OR REPLACE FUNCTION fn_notify_low_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient_id uuid;
BEGIN
  -- Skip if already below minimum before this update
  IF OLD.quantity <= OLD.minimum_stock THEN RETURN NEW; END IF;
  -- Skip if still above minimum after this update
  IF NEW.quantity > NEW.minimum_stock THEN RETURN NEW; END IF;

  -- Notify all admins
  FOR v_recipient_id IN SELECT * FROM get_users_by_role('admin') LOOP
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      v_recipient_id,
      'low_stock',
      'Medicine stock low',
      NEW.medicine_name || ' ' || NEW.dosage || ' has only ' || NEW.quantity || ' ' || NEW.unit || ' remaining (minimum: ' || NEW.minimum_stock || ')',
      jsonb_build_object(
        'stock_id', NEW.id,
        'medicine_name', NEW.medicine_name,
        'quantity', NEW.quantity,
        'minimum_stock', NEW.minimum_stock
      )
    );
  END LOOP;

  -- Notify all pharmacists
  FOR v_recipient_id IN SELECT * FROM get_users_by_role('pharmacist') LOOP
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      v_recipient_id,
      'low_stock',
      'Medicine stock low',
      NEW.medicine_name || ' ' || NEW.dosage || ' has only ' || NEW.quantity || ' ' || NEW.unit || ' remaining.',
      jsonb_build_object(
        'stock_id', NEW.id,
        'medicine_name', NEW.medicine_name,
        'quantity', NEW.quantity
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_low_stock ON medicine_stocks;

CREATE TRIGGER trg_low_stock
AFTER UPDATE OF quantity ON medicine_stocks
FOR EACH ROW
EXECUTE FUNCTION fn_notify_low_stock();

-- ============================================================
-- Function: Notify medicines expiring within 30 days
-- ============================================================

CREATE OR REPLACE FUNCTION fn_notify_expiring_medicines()
RETURNS void
LANGUAGE plpgsql
AS $func$
DECLARE
    v_stock record;
    v_recipient_id uuid;
    v_days_left int;
BEGIN
    FOR v_stock IN
        SELECT *
        FROM medicine_stocks
        WHERE expired_date BETWEEN CURRENT_DATE
                              AND CURRENT_DATE + INTERVAL '30 days'
          AND quantity > 0
    LOOP
        v_days_left := v_stock.expired_date - CURRENT_DATE;

        FOR v_recipient_id IN
            SELECT ur.user_id
            FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE r.name IN ('admin', 'pharmacist')
        LOOP
            IF NOT EXISTS (
                SELECT 1
                FROM notifications
                WHERE type = 'medicine_expiring'
                  AND (data->>'stock_id')::uuid = v_stock.id
                  AND created_at::date = CURRENT_DATE
                  AND user_id = v_recipient_id
            ) THEN
                INSERT INTO notifications (
                    user_id,
                    type,
                    title,
                    body,
                    data
                )
                VALUES (
                    v_recipient_id,
                    'medicine_expiring',
                    'Medicine expiring soon',
                    v_stock.medicine_name || ' ' || v_stock.dosage ||
                    ' expires in ' || v_days_left || ' day(s) (' ||
                    TO_CHAR(v_stock.expired_date, 'DD Mon YYYY') || ')',
                    jsonb_build_object(
                        'stock_id', v_stock.id,
                        'medicine_name', v_stock.medicine_name,
                        'expired_date', v_stock.expired_date,
                        'days_left', v_days_left
                    )
                );
            END IF;
        END LOOP;
    END LOOP;
END;
$func$;

-- ============================================================
-- Schedule every day at 08:00
-- ============================================================

SELECT cron.schedule(
    'notify-expiring-medicines',
    '0 8 * * *',
    'SELECT fn_notify_expiring_medicines();'
);