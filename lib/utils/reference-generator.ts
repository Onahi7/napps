import { customAlphabet } from 'nanoid';

const REFERENCE_PREFIX = 'NAPPS';
const REFERENCE_YEAR = '2025';

// Create nanoid with only numbers
const nanoid = customAlphabet('0123456789', 4);

export function generateParticipantReference(): string {
  const uniqueNumber = nanoid();
  return `${REFERENCE_PREFIX}-${REFERENCE_YEAR}-${uniqueNumber}`;
}

export function validateReferenceFormat(reference: string): boolean {
  const pattern = /^NAPPS-2025-\d{4}$/;
  return pattern.test(reference);
}
