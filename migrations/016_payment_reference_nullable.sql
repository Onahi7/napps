-- Make payment_reference nullable since we're using phone numbers directly
ALTER TABLE profiles ALTER COLUMN payment_reference DROP NOT NULL;