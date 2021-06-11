import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import LoginSignUp from './LoginSignUp';

describe('<LoginSignUp />', () => {
  test('it should mount', () => {
    render(<LoginSignUp />);
    
    const loginSignUp = screen.getByTestId('LoginSignUp');

    expect(loginSignUp).toBeInTheDocument();
  });
});