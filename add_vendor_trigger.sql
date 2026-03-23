-- 1. Create the function
CREATE OR REPLACE FUNCTION set_vendor_display_id()
RETURNS TRIGGER AS $$
BEGIN
  -- For autoincrementing columns, NEW.id is NULL in BEFORE INSERT.
  -- We fetch the next value from the sequence manually.
  IF NEW.id IS NULL THEN
    NEW.id := nextval('vendor_id_seq');
  END IF;
  NEW.formated_id := 'VEN' || LPAD(NEW.id::text, 7, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS trg_set_vendor_display_id ON "vendor";
CREATE TRIGGER trg_set_vendor_display_id
BEFORE INSERT ON "vendor"
FOR EACH ROW EXECUTE FUNCTION set_vendor_display_id();
