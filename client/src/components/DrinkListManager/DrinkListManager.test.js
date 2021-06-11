import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import DrinkListManager from './DrinkListManager';

describe('<DrinkListManager />', () => {
  test('it should mount', () => {
    render(<DrinkListManager />);
    
    const drinkListManager = screen.getByTestId('DrinkListManager');

    expect(drinkListManager).toBeInTheDocument();
  });
});