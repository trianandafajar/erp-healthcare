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
                INSERT INTO notifications (user_id, type, title, body, data)
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

SELECT cron.schedule(
    'notify-expiring-medicines',
    '0 8 * * *',
    'SELECT fn_notify_expiring_medicines();'
);