CREATE OR REPLACE FUNCTION get_patient_profile_id(p_patient_id uuid)
RETURNS uuid AS $$
  SELECT profile_id FROM patients WHERE id = p_patient_id LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Helper: resolve doctor profile_id from doctor_id
-- Assumes doctors.id matches a profile that holds the 'doctor' role.
-- Adjust this join if your schema links doctors to profiles differently.
CREATE OR REPLACE FUNCTION get_doctor_profile_id(p_doctor_id uuid)
RETURNS uuid AS $$
  SELECT id FROM profiles
  WHERE id IN (
    SELECT ur.user_id FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE r.name = 'doctor'
  )
  AND id = p_doctor_id
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- ------------------------------------------------------------
-- Trigger 1: New appointment created → notify the assigned doctor
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_notify_appointment_created()
RETURNS TRIGGER AS $$
DECLARE
  v_patient_name      text;
  v_doctor_profile_id uuid;
BEGIN
  SELECT full_name INTO v_patient_name FROM patients WHERE id = NEW.patient_id;

  IF NEW.doctor_id IS NOT NULL THEN
    v_doctor_profile_id := get_doctor_profile_id(NEW.doctor_id);
    IF v_doctor_profile_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES (
        v_doctor_profile_id,
        'appointment_new',
        'New appointment',
        'Patient ' || COALESCE(v_patient_name, 'unknown') || ' booked an appointment on ' || TO_CHAR(NEW.appointment_date, 'DD Mon YYYY'),
        jsonb_build_object(
          'appointment_id',   NEW.id,
          'patient_id',       NEW.patient_id,
          'appointment_date', NEW.appointment_date
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_appointment_created
AFTER INSERT ON appointments
FOR EACH ROW EXECUTE FUNCTION fn_notify_appointment_created();

-- ------------------------------------------------------------
-- Trigger 2: Appointment status changed → notify the patient
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_notify_appointment_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  v_patient_profile_id uuid;
  v_title              text;
  v_body               text;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  v_patient_profile_id := get_patient_profile_id(NEW.patient_id);
  IF v_patient_profile_id IS NULL THEN RETURN NEW; END IF;

  CASE NEW.status
    WHEN 'confirmed' THEN
      v_title := 'Appointment confirmed';
      v_body  := 'Your appointment on ' || TO_CHAR(NEW.appointment_date, 'DD Mon YYYY') || ' has been confirmed.';
    WHEN 'cancelled' THEN
      v_title := 'Appointment cancelled';
      v_body  := 'Your appointment on ' || TO_CHAR(NEW.appointment_date, 'DD Mon YYYY') || ' has been cancelled.';
    WHEN 'done' THEN
      v_title := 'Visit completed';
      v_body  := 'Your visit has been completed. Thank you for coming.';
    ELSE
      RETURN NEW;
  END CASE;

  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    v_patient_profile_id,
    'appointment_' || NEW.status,
    v_title,
    v_body,
    jsonb_build_object('appointment_id', NEW.id, 'status', NEW.status)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_appointment_status_changed
AFTER UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION fn_notify_appointment_status_changed();

-- ------------------------------------------------------------
-- Trigger 3: Queue number assigned → notify the patient
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_notify_queue_assigned()
RETURNS TRIGGER AS $$
DECLARE
  v_patient_profile_id uuid;
BEGIN
  IF OLD.queue_number IS NOT DISTINCT FROM NEW.queue_number THEN RETURN NEW; END IF;
  IF NEW.queue_number IS NULL THEN RETURN NEW; END IF;

  v_patient_profile_id := get_patient_profile_id(NEW.patient_id);
  IF v_patient_profile_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    v_patient_profile_id,
    'queue_assigned',
    'Your queue number',
    'Your queue number is ' || NEW.queue_number || '. Please be ready when called.',
    jsonb_build_object('appointment_id', NEW.id, 'queue_number', NEW.queue_number)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_queue_assigned
AFTER UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION fn_notify_queue_assigned();