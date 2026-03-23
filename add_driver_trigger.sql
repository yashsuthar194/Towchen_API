-- 1. Create the function
CREATE OR REPLACE FUNCTION set_driver_display_id()
RETURNS TRIGGER AS $$
BEGIN
  -- For autoincrementing columns, NEW.id is NULL in BEFORE INSERT.
  -- We fetch the next value from the sequence manually.
  IF NEW.id IS NULL THEN
    NEW.id := nextval('driver_id_seq');
  END IF;
  NEW.formated_id := 'DRI' || LPAD(NEW.id::text, 7, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS trg_set_driver_display_id ON "driver";
CREATE TRIGGER trg_set_driver_display_id
BEFORE INSERT ON "driver"
FOR EACH ROW EXECUTE FUNCTION set_driver_display_id();
