import React from 'react';
import { render } from '@testing-library/react';
import ValidatorDashboard from '../components/validator-dashboard';

test('renders ValidatorDashboard with correct props', () => {
    const { getByText } = render(<ValidatorDashboard heading="Test Heading" text="Test Text" />);
    expect(getByText(/Test Heading/i)).toBeInTheDocument();
    expect(getByText(/Test Text/i)).toBeInTheDocument();
});