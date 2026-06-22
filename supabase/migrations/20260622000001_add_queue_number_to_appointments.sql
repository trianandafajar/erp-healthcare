-- Add queue_number column
ALTER TABLE public.appointments 
ADD COLUMN queue_number text null;

-- Function generate queue number
CREATE OR REPLACE FUNCTION generate_queue_number()
RETURNS TRIGGER AS $$
DECLARE
  today_count integer;
  prefix text;
BEGIN
  SELECT COUNT(*) INTO today_count
  FROM appointments
  WHERE appointment_date = NEW.appointment_date
    AND id != NEW.id;

  prefix := CASE NEW.type
    WHEN 'appointment'  THEN 'A'
    WHEN 'walkin'       THEN 'W'
    WHEN 'referral'     THEN 'R'
    WHEN 'consultation' THEN 'C'
    WHEN 'follow_up'    THEN 'F'
    ELSE 'X'
  END;

  NEW.queue_number := prefix || LPAD((today_count + 1)::text, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER set_queue_number
BEFORE INSERT ON appointments
FOR EACH ROW
WHEN (NEW.queue_number IS NULL)
EXECUTE FUNCTION generate_queue_number();