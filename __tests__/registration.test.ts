import { createUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { hash } from 'bcrypt';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('Registration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new user successfully', async () => {
    const mockHash = 'hashedpassword123';
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    
    (hash as jest.Mock).mockResolvedValue(mockHash);
    (query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: mockUserId }] });
    (query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: mockUserId }] });

    const userData = {
      email: 'test@example.com',
      password: '',  // Empty password as per your registration flow
      full_name: 'Test User',
      phone: '1234567890'
    };

    const result = await createUser(userData);

    expect(result).toBe(mockUserId);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('should handle duplicate email error', async () => {
    (query as jest.Mock).mockRejectedValue(new Error('duplicate key value violates unique constraint'));

    const userData = {
      email: 'existing@example.com',
      password: '',
      full_name: 'Test User',
      phone: '1234567890'
    };

    await expect(createUser(userData)).rejects.toThrow();
  });
});