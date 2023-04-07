import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders filters', () => {
  render(<App />);
  const linkElement = screen.getByText(/Opening Term/i);
  expect(linkElement).toBeInTheDocument();
});


