import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import ValidatorScan from '@/components/validator-scan';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';

// Mock the hooks
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn()
}));

jest.mock('@/components/auth-provider', () => ({
  useAuth: jest.fn()
}));

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

  it('renders all validation type options', () => {
    render(<ValidatorScan />);
    
    expect(screen.getByText('Breakfast')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(screen.getByText('Accreditation')).toBeInTheDocument();
  });

  it('handles manual phone validation', async () => {
    render(<ValidatorScan />);
    
    const phoneInput = screen.getByPlaceholderText(/enter phone number/i);
    const validateButton = screen.getByText(/validate/i);

    fireEvent.change(phoneInput, { target: { value: '08012345678' } });
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByText(/successfully validated/i)).toBeInTheDocument();
    });
  });

  it('shows error for invalid phone number', async () => {
    render(<ValidatorScan />);
    
    const phoneInput = screen.getByPlaceholderText(/enter phone number/i);
    const validateButton = screen.getByText(/validate/i);

    fireEvent.change(phoneInput, { target: { value: '12345' } });
    fireEvent.click(validateButton);

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

    fireEvent.change(phoneInput, { target: { value: '08012345678' } });
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByText(/successfully validated/i)).toBeInTheDocument();
    });

    // Try to validate again
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByText(/already been validated/i)).toBeInTheDocument();
    });
  });
});