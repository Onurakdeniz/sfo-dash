-- Fix suppliers table id column to include UUID default
ALTER TABLE "suppliers" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
