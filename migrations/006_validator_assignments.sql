-- Create validator assignments table
CREATE TABLE validator_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  validator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meal_type VARCHAR(20) CHECK (meal_type IN ('breakfast', 'dinner', 'accreditation')),
  location VARCHAR(255) NOT NULL,
  schedule_date DATE NOT NULL,
  schedule_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create index on validator_id for faster lookups
CREATE INDEX idx_validator_assignments_validator ON validator_assignments(validator_id);

-- Create index on schedule_date for date-based queries
CREATE INDEX idx_validator_assignments_date ON validator_assignments(schedule_date);

-- Create index on status for filtering
CREATE INDEX idx_validator_assignments_status ON validator_assignments(status);