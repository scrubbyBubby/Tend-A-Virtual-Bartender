import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import DrinkScore from './DrinkScore';

describe('<DrinkScore />', () => {
  test('it should mount', () => {
    render(<DrinkScore />);
    
    const drinkScore = screen.getByTestId('DrinkScore');

    expect(drinkScore).toBeInTheDocument();
  });
});