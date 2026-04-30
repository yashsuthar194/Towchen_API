-- Create the function to generate formatted IDs
CREATE OR REPLACE FUNCTION generate_formatted_id()
RETURNS TRIGGER AS $$
DECLARE
    prefix TEXT;
BEGIN
    -- Determine the prefix based on the table name
    CASE TG_TABLE_NAME
        WHEN 'vendor' THEN prefix := 'VND';
        WHEN 'driver' THEN prefix := 'DRV';
        WHEN 'customer' THEN prefix := 'CST';
        WHEN 'order' THEN prefix := 'ORD';
        ELSE prefix := 'UNK';
    END CASE;

    -- Ensure the ID is populated (if using SERIAL/SEQUENCE)
    IF NEW.id IS NULL THEN
        NEW.id := nextval(pg_get_serial_sequence(TG_TABLE_NAME, 'id'));
    END IF;

    -- Generate the formatted ID: Prefix + 7 digits (padded with zeros)
    NEW.formated_id := prefix || LPAD(NEW.id::text, 7, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if they already exist (to avoid errors on re-run)
DROP TRIGGER IF EXISTS trg_vendor_formatted_id ON "vendor";
DROP TRIGGER IF EXISTS trg_driver_formatted_id ON "driver";
DROP TRIGGER IF EXISTS trg_customer_formatted_id ON "customer";
DROP TRIGGER IF EXISTS trg_order_formatted_id ON "order";

-- Create triggers
CREATE TRIGGER trg_vendor_formatted_id
BEFORE INSERT ON "vendor"
FOR EACH ROW
EXECUTE FUNCTION generate_formatted_id();

CREATE TRIGGER trg_driver_formatted_id
BEFORE INSERT ON "driver"
FOR EACH ROW
EXECUTE FUNCTION generate_formatted_id();

CREATE TRIGGER trg_customer_formatted_id
BEFORE INSERT ON "customer"
FOR EACH ROW
EXECUTE FUNCTION generate_formatted_id();

CREATE TRIGGER trg_order_formatted_id
BEFORE INSERT ON "order"
FOR EACH ROW
EXECUTE FUNCTION generate_formatted_id();
