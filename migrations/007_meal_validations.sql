-- Create meal validations table
CREATE TABLE meal_validations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  validator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meal_type VARCHAR(20) CHECK (meal_type IN ('breakfast', 'dinner')),
  date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'expired')),
  validated_at TIMESTAMP WITH TIME ZONE,
  validator_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for faster lookups
CREATE INDEX idx_meal_validations_participant ON meal_validations(participant_id);
CREATE INDEX idx_meal_validations_validator ON meal_validations(validator_id);
CREATE INDEX idx_meal_validations_date ON meal_validations(date);
CREATE INDEX idx_meal_validations_status ON meal_validations(status);

-- Create unique constraint to prevent duplicate validations for same meal/date/participant
CREATE UNIQUE INDEX idx_meal_validations_unique ON meal_validations(participant_id, meal_type, date) 
WHERE deleted_at IS NULL;