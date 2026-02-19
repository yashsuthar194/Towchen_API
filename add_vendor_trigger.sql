-- 1. Create the function
CREATE OR REPLACE FUNCTION set_vendor_display_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.formated_id := 'VEN' || LPAD(NEW.id::text, 7, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger
CREATE TRIGGER trg_set_vendor_display_id
BEFORE INSERT ON "vendor"
FOR EACH ROW EXECUTE FUNCTION set_vendor_display_id();
