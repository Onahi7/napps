import React from 'react';
import { render, screen } from '@testing-library/react';
import ValidatorDashboard from '../components/validator-dashboard';

describe('ValidatorDashboard', () => {
  it('renders validator dashboard', () => {
    render(<ValidatorDashboard />);
    
    expect(screen.getByText(/Validator Dashboard/i)).toBeInTheDocument();
  });
});