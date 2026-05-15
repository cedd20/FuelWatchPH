-- Canonical fuel_type labels: UL91, PR95, PR97, DSL, PDSL, Kerosene
-- Replaces longer names used in 001_initial_schema.sql

DO $$
DECLARE
  con_name text;
BEGIN
  SELECT c.conname INTO con_name
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  WHERE t.relname = 'price_reports'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) LIKE '%fuel_type%';

  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE price_reports DROP CONSTRAINT %I', con_name);
  END IF;
END $$;

UPDATE price_reports SET fuel_type = 'UL91' WHERE fuel_type = 'Unleaded 91';
UPDATE price_reports SET fuel_type = 'PR95' WHERE fuel_type = 'Unleaded 95';
UPDATE price_reports SET fuel_type = 'PR97' WHERE fuel_type = 'Unleaded 98';
UPDATE price_reports SET fuel_type = 'DSL' WHERE fuel_type = 'Diesel';
UPDATE price_reports SET fuel_type = 'PDSL' WHERE fuel_type = 'Premium Diesel';

ALTER TABLE price_reports ADD CONSTRAINT price_reports_fuel_type_check CHECK (
  fuel_type IN ('UL91', 'PR95', 'PR97', 'DSL', 'PDSL', 'Kerosene')
);
