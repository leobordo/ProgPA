CREATE OR REPLACE FUNCTION notify_job_change() RETURNS TRIGGER AS $$
DECLARE
    payload JSON;
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.state IS DISTINCT FROM NEW.state) OR TG_OP = 'INSERT' THEN
        payload := json_build_object(
            'job_id', NEW.job_id,
            'state', NEW.state,
            'operation', TG_OP  -- 'INSERT' o 'UPDATE'
        );
        PERFORM pg_notify('job_notifications', payload::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_change_trigger
AFTER INSERT OR UPDATE OF state ON results
FOR EACH ROW
EXECUTE FUNCTION notify_job_change();
