ALTER TABLE "order_location" ADD COLUMN     "contact_name" VARCHAR(255),
ADD COLUMN     "contact_number" VARCHAR(20);

-- 1. Create the function to set order display ID
CREATE OR REPLACE FUNCTION set_order_display_id()
RETURNS TRIGGER AS $$
BEGIN
  -- We set the formated_id to 'ORD' followed by 7 digit padded id
  NEW.formated_id := 'ORD' || LPAD(NEW.id::text, 7, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger to auto-generate formated_id on order insert
DROP TRIGGER IF EXISTS trg_set_order_display_id ON "order";
CREATE TRIGGER trg_set_order_display_id
BEFORE INSERT ON "order"
FOR EACH ROW EXECUTE FUNCTION set_order_display_id();
