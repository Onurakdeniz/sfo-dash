-- Remove order-related database objects since orders module will not be implemented
-- This migration removes all order-related tables, enums, and constraints

-- Drop order-related enums
DROP TYPE IF EXISTS "order_status";
DROP TYPE IF EXISTS "order_type";
DROP TYPE IF EXISTS "order_priority";
DROP TYPE IF EXISTS "payment_status";
DROP TYPE IF EXISTS "delivery_status";
DROP TYPE IF EXISTS "order_source";

-- Drop orders table (if it exists)
DROP TABLE IF EXISTS "orders";

-- Remove order-related columns from suppliers table (if they exist)
ALTER TABLE "suppliers" DROP COLUMN IF EXISTS "total_orders";
ALTER TABLE "suppliers" DROP COLUMN IF EXISTS "total_order_value";
ALTER TABLE "suppliers" DROP COLUMN IF EXISTS "average_order_value";
ALTER TABLE "suppliers" DROP COLUMN IF EXISTS "order_fulfillment_rate";

-- Remove order-related columns from business_entity_activities table (if they exist)
ALTER TABLE "business_entity_activities" DROP COLUMN IF EXISTS "related_order_id";

-- Update order_source references in talep table (if any)
-- Note: This assumes talep table still exists and may need to be updated when talep is also removed
