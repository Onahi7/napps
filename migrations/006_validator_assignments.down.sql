-- Drop indexes first
DROP INDEX IF EXISTS idx_validator_assignments_validator;
DROP INDEX IF EXISTS idx_validator_assignments_date;
DROP INDEX IF EXISTS idx_validator_assignments_status;

-- Drop validator assignments table
DROP TABLE IF EXISTS validator_assignments;