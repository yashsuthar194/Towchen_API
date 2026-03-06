-- 1. Create the function
CREATE OR REPLACE FUNCTION set_customer_display_id()
RETURNS TRIGGER AS $$
BEGIN
  -- We set the formated_id to 'CUST' followed by 7 digit padded id
  NEW.formated_id := 'CUST' || LPAD(NEW.id::text, 7, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS trg_set_customer_display_id ON "customer";
CREATE TRIGGER trg_set_customer_display_id
BEFORE INSERT ON "customer"
FOR EACH ROW EXECUTE FUNCTION set_customer_display_id();
