import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import ValidatorScan from '@/components/validator-scan';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn()
}));

jest.mock('@/components/auth-provider', () => ({
  useAuth: jest.fn()
}));

jest.mock('../lib/qrcode', () => ({
  validateQRCode: jest.fn().mockImplementation((code) => {
    if (code === 'valid-code') {
      return Promise.resolve({ success: true, message: 'Successfully validated' });
    } else if (code === 'already-validated') {
      return Promise.resolve({ success: false, message: 'Already been validated' });
    }
    return Promise.reject(new Error('Invalid QR code'));
  })
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

  it('renders all validator sections', () => {
    render(<ValidatorScan />);
    expect(screen.getByText('Breakfast')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(screen.getByText('Accreditation')).toBeInTheDocument();
  });

  it('handles successful validation', async () => {
    render(<ValidatorScan />);
    const input = screen.getByLabelText(/scan qr code/i);
    
    fireEvent.change(input, { target: { value: 'valid-code' } });
    
    await waitFor(() => {
      expect(screen.getByText(/successfully validated/i)).toBeInTheDocument();
    });
  });

  it('handles already validated codes', async () => {
    render(<ValidatorScan />);
    const input = screen.getByLabelText(/scan qr code/i);
    
    fireEvent.change(input, { target: { value: 'already-validated' } });
    
    await waitFor(() => {
      expect(screen.getByText(/already been validated/i)).toBeInTheDocument();
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