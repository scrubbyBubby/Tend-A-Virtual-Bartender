import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import DrinkSearch from './DrinkSearch';

describe('<DrinkSearch />', () => {
  test('it should mount', () => {
    render(<DrinkSearch />);
    
    const drinkSearch = screen.getByTestId('DrinkSearch');

    expect(drinkSearch).toBeInTheDocument();
  });
});