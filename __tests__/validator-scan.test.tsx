import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { waitFor } from '@testing-library/dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import ValidatorScan from '@/components/validator-scan';
import { validateParticipant } from '@/actions/scan-actions';

jest.mock('@/hooks/use-toast');
jest.mock('@/hooks/use-auth');
jest.mock('@/actions/scan-actions');

// Mock implementations
(validateParticipant as jest.Mock).mockImplementation(async (code) => {
  if (code === 'already-validated') {
    throw new Error('Already validated');
  }
  return { success: true };
});

describe('ValidatorScan', () => {
  const mockToast = jest.fn();
  const mockUser = {
    id: 'validator-123',
    role: 'validator'
  };

  beforeEach(() => {
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
  });

  it('renders scanner sections', () => {
    render(<ValidatorScan />);
    expect(screen.getByText(/scan qr code/i)).toBeInTheDocument();
    expect(screen.getByText(/manual entry/i)).toBeInTheDocument();
  });

  it('handles successful validation', async () => {
    render(<ValidatorScan />);
    const input = screen.getByLabelText(/scan qr code/i);
    
    userEvent.type(input, 'valid-code');
    
    await waitFor(() => {
      expect(screen.getByText(/successfully validated/i)).toBeInTheDocument();
    });
  });

  it('handles already validated codes', async () => {
    render(<ValidatorScan />);
    const input = screen.getByLabelText(/scan qr code/i);
    
    userEvent.type(input, 'already-validated');
    
    await waitFor(() => {
      expect(screen.getByText(/already been validated/i)).toBeInTheDocument();
    });
  });

  it('shows error for invalid phone number', async () => {
    render(<ValidatorScan />);
    
    const phoneInput = screen.getByPlaceholderText(/enter phone number/i);
    const validateButton = screen.getByText(/validate/i);

    userEvent.type(phoneInput, '12345');
    userEvent.click(validateButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error',
        variant: 'destructive'
      }));
    });
  });

  it('prevents duplicate validations', async () => {
    render(<ValidatorScan />);
    
    // First validation
    const phoneInput = screen.getByPlaceholderText(/enter phone number/i);
    const validateButton = screen.getByText(/validate/i);

    userEvent.type(phoneInput, '08012345678');
    userEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByText(/successfully validated/i)).toBeInTheDocument();
    });

    // Try to validate again
    userEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByText(/already been validated/i)).toBeInTheDocument();
    });
  });
});