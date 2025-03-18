-- Drop indexes first
DROP INDEX IF EXISTS idx_meal_validations_unique;
DROP INDEX IF EXISTS idx_meal_validations_participant;
DROP INDEX IF EXISTS idx_meal_validations_validator;
DROP INDEX IF EXISTS idx_meal_validations_date;
DROP INDEX IF EXISTS idx_meal_validations_status;

-- Drop meal validations table
DROP TABLE IF EXISTS meal_validations;