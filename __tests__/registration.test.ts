import { createUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { hash } from 'bcrypt';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('Registration Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (query as jest.Mock).mockReset();
    (hash as jest.Mock).mockReset();
  });

  const validUserData = {
    email: 'test@example.com',
    password: 'password123',
    full_name: 'Test User',
    phone: '08012345678',
    school_name: 'Test School',
    school_address: '123 Test Street, Area',
    school_state: 'Lagos',
    napps_chapter: 'Ikeja Chapter'
  };

  describe('Email Validation', () => {
    const testCases = [
      { 
        email: '', 
        expectedError: 'Email is required' 
      },
      { 
        email: 'notanemail', 
        expectedError: 'Please enter a valid email address' 
      },
      { 
        email: 'test@.com', 
        expectedError: 'Please enter a valid email address' 
      },
      { 
        email: '@test.com', 
        expectedError: 'Please enter a valid email address' 
      }
    ];

    testCases.forEach(({ email, expectedError }) => {
      it(`should reject invalid email: "${email}"`, async () => {
        const data = { ...validUserData, email };
        await expect(createUser(data)).rejects.toThrow(expectedError);
      });
    });

    it('should accept valid email', async () => {
      const mockHash = 'hashedpassword123';
      const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
      
      (hash as jest.Mock).mockResolvedValue(mockHash);
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: mockUserId }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: mockUserId }] });

      const result = await createUser(validUserData);
      expect(result).toBe(mockUserId);
    });
  });

  describe('Phone Number Validation', () => {
    const validPhoneNumbers = [
      '08012345678',
      '09012345678',
      '07012345678',
      '+2348012345678',
      '+2349012345678',
      '+2347012345678'
    ];

    const invalidPhoneNumbers = [
      { phone: '12345678901', reason: 'non-Nigerian format' },
      { phone: '06012345678', reason: 'invalid prefix' },
      { phone: '0801234567', reason: 'too short' },
      { phone: '080123456789', reason: 'too long' },
      { phone: '0801234567a', reason: 'contains letters' },
      { phone: '+1234567890', reason: 'non-Nigerian country code' }
    ];

    validPhoneNumbers.forEach(phone => {
      it(`should accept valid Nigerian phone number: ${phone}`, async () => {
        const mockHash = 'hashedpassword123';
        const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
        
        (hash as jest.Mock).mockResolvedValue(mockHash);
        (query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: mockUserId }] });
        (query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: mockUserId }] });

        const data = { ...validUserData, phone };
        const result = await createUser(data);
        expect(result).toBe(mockUserId);
      });
    });

    invalidPhoneNumbers.forEach(({ phone, reason }) => {
      it(`should reject invalid phone number (${reason}): ${phone}`, async () => {
        const data = { ...validUserData, phone };
        await expect(createUser(data)).rejects.toThrow('Please enter a valid Nigerian phone number');
      });
    });
  });

  describe('Name Validation', () => {
    const invalidNames = [
      { name: '', error: 'Full name is required' },
      { name: 'A', error: 'Full name must be at least 2 characters' },
      { name: 'Test123', error: 'Full name can only contain letters, spaces, and basic punctuation' },
      { name: '@Test User', error: 'Full name can only contain letters, spaces, and basic punctuation' },
      { name: 'Test$User', error: 'Full name can only contain letters, spaces, and basic punctuation' }
    ];

    invalidNames.forEach(({ name, error }) => {
      it(`should reject invalid name: "${name}"`, async () => {
        const data = { ...validUserData, full_name: name };
        await expect(createUser(data)).rejects.toThrow(error);
      });
    });

    const validNames = [
      'John Doe',
      'Mary Jane-Smith',
      'O\'Connor',
      'Van der Waal',
      'José María'
    ];

    validNames.forEach(name => {
      it(`should accept valid name: "${name}"`, async () => {
        const mockHash = 'hashedpassword123';
        const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
        
        (hash as jest.Mock).mockResolvedValue(mockHash);
        (query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: mockUserId }] });
        (query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: mockUserId }] });

        const data = { ...validUserData, full_name: name };
        const result = await createUser(data);
        expect(result).toBe(mockUserId);
      });
    });
  });

  describe('School Information Validation', () => {
    it('should require school name with minimum length', async () => {
      const data = { ...validUserData, school_name: 'A' };
      await expect(createUser(data)).rejects.toThrow('School name must be at least 2 characters');
    });

    it('should require school address with minimum length', async () => {
      const data = { ...validUserData, school_address: '123' };
      await expect(createUser(data)).rejects.toThrow('School address must be at least 5 characters');
    });

    it('should require valid state selection', async () => {
      const data = { ...validUserData, school_state: '' };
      await expect(createUser(data)).rejects.toThrow('State is required');
    });

    it('should require NAPPS chapter with minimum length', async () => {
      const data = { ...validUserData, napps_chapter: 'A' };
      await expect(createUser(data)).rejects.toThrow('NAPPS chapter must be at least 2 characters');
    });
  });

  describe('Duplicate Entry Handling', () => {
    it('should handle duplicate email error', async () => {
      (query as jest.Mock).mockRejectedValue(new Error('duplicate key value violates unique constraint "idx_profiles_email"'));
      await expect(createUser(validUserData)).rejects.toThrow('This email is already registered');
    });

    it('should handle duplicate phone error', async () => {
      (query as jest.Mock).mockRejectedValue(new Error('duplicate key value violates unique constraint "idx_profiles_phone"'));
      await expect(createUser(validUserData)).rejects.toThrow('This phone number is already registered');
    });
  });
});