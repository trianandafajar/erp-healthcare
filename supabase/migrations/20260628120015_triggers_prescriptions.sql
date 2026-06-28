CREATE OR REPLACE FUNCTION get_users_by_role(p_role_name text)
RETURNS SETOF uuid AS $$
  SELECT ur.user_id
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE r.name = p_role_name;
$$ LANGUAGE sql STABLE;

-- ------------------------------------------------------------
-- Trigger 1: New prescription created → notify all pharmacists
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_notify_prescription_new()
RETURNS TRIGGER AS $$
DECLARE
  v_patient_name  text;
  v_pharmacist_id uuid;
BEGIN
  SELECT full_name INTO v_patient_name FROM patients WHERE id = NEW.patient_id;

  FOR v_pharmacist_id IN SELECT * FROM get_users_by_role('pharmacist') LOOP
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      v_pharmacist_id,
      'prescription_new',
      'New prescription received',
      'Prescription for ' || COALESCE(v_patient_name, 'patient') || ': ' || NEW.medication_name,
      jsonb_build_object(
        'prescription_id', NEW.id,
        'patient_id',      NEW.patient_id,
        'medication_name', NEW.medication_name
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prescription_new
AFTER INSERT ON prescriptions
FOR EACH ROW EXECUTE FUNCTION fn_notify_prescription_new();

-- ------------------------------------------------------------
-- Trigger 2: Prescription status changed → notify patient or doctor
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_notify_prescription_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  v_patient_profile_id uuid;
  v_doctor_profile_id  uuid;
  v_title              text;
  v_body               text;
  v_type               text;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  v_patient_profile_id := get_patient_profile_id(NEW.patient_id);
  v_doctor_profile_id  := get_doctor_profile_id(NEW.doctor_id);

  CASE NEW.status

    WHEN 'verified' THEN
      v_type  := 'prescription_verified';
      v_title := 'Prescription verified';
      v_body  := 'Your prescription for ' || NEW.medication_name || ' has been verified by the pharmacist.';
      IF v_patient_profile_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, body, data)
        VALUES (v_patient_profile_id, v_type, v_title, v_body,
          jsonb_build_object('prescription_id', NEW.id));
      END IF;

    WHEN 'dispensed' THEN
      v_type  := 'prescription_ready';
      v_title := 'Medication ready for pickup';
      v_body  := NEW.medication_name || ' is ready to be picked up at the pharmacy.';
      IF v_patient_profile_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, body, data)
        VALUES (v_patient_profile_id, v_type, v_title, v_body,
          jsonb_build_object('prescription_id', NEW.id));
      END IF;

    WHEN 'rejected' THEN
      -- Notify the prescribing doctor when a prescription is rejected
      v_type  := 'prescription_rejected';
      v_title := 'Prescription rejected by pharmacist';
      v_body  := 'Prescription for ' || NEW.medication_name || ' was rejected.' ||
                 CASE WHEN NEW.rejection_note IS NOT NULL
                      THEN ' Reason: ' || NEW.rejection_note
                      ELSE '' END;
      IF v_doctor_profile_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, body, data)
        VALUES (v_doctor_profile_id, v_type, v_title, v_body,
          jsonb_build_object('prescription_id', NEW.id, 'rejection_note', NEW.rejection_note));
      END IF;

    ELSE NULL;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prescription_status_changed
AFTER UPDATE ON prescriptions
FOR EACH ROW EXECUTE FUNCTION fn_notify_prescription_status_changed();