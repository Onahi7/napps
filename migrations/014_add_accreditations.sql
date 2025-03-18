CREATE TABLE IF NOT EXISTS accreditations (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id),
    status VARCHAR(50),
    accreditation_date DATE,
    accreditation_time TIME,
    validator VARCHAR(255),
    location VARCHAR(255),
    badge_collected BOOLEAN DEFAULT FALSE,
    badge_collection_time TIMESTAMP,
    materials_collected BOOLEAN DEFAULT FALSE,
    materials_collection_time TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);