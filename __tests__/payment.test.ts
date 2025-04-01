import { verifyPayment } from '@/lib/paystack';
import { verifyRegistrationPayment, verifyHotelBookingPayment } from '@/actions/payment-actions';
import { query, withTransaction } from '@/lib/db';
import { getServerSession } from 'next-auth';

jest.mock('@/lib/paystack');
jest.mock('@/lib/db');
jest.mock('next-auth');

describe('Payment Verification', () => {
  const mockSession = {
    user: { id: 'test-user-id' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('Registration Payment', () => {
    it('should verify registration payment successfully', async () => {
      const mockPaystackResponse = {
        status: 'success',
        reference: 'test-ref',
        amount: 15000,
        paid_at: '2024-01-01',
        metadata: { userId: 'test-user-id' }
      };

      (verifyPayment as jest.Mock).mockResolvedValue(mockPaystackResponse);
      (query as jest.Mock).mockResolvedValue({ rows: [{ id: 'test-user-id' }] });

      const result = await verifyRegistrationPayment();

      expect(result.verified).toBe(true);
      expect(query).toHaveBeenCalled();
    });

    it('should handle failed registration payment verification', async () => {
      (verifyPayment as jest.Mock).mockRejectedValue(new Error('Payment verification failed'));

      await expect(verifyRegistrationPayment()).rejects.toThrow();
    });
  });

  describe('Hotel Booking Payment', () => {
    it('should verify hotel booking payment successfully', async () => {
      const mockPaystackResponse = {
        status: 'success',
        reference: 'test-ref',
        amount: 25000,
        paid_at: '2024-01-01',
        metadata: { bookingId: 'test-booking-id' }
      };

      (verifyPayment as jest.Mock).mockResolvedValue(mockPaystackResponse);
      (withTransaction as jest.Mock).mockImplementation(callback => callback({ 
        query: jest.fn().mockResolvedValue({ rows: [{ id: 'test-booking-id' }] })
      }));

      const result = await verifyHotelBookingPayment('test-ref', 'test-booking-id');

      expect(result.verified).toBe(true);
    });

    it('should handle unauthorized hotel booking payment verification', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      await expect(verifyHotelBookingPayment('test-ref', 'test-booking-id'))
        .rejects.toThrow('Unauthorized');
    });
  });
});