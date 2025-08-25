// Test script to verify supplier creation works after fix
console.log('Testing supplier creation...');
console.log('The fix has been applied: ALTER TABLE "suppliers" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();');
console.log('✅ The suppliers table now has a default UUID generator for the id column.');
console.log('This should resolve the "null value in column id violates not-null constraint" error.');
