import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import DrinkList from './DrinkList';

describe('<DrinkList />', () => {
  test('it should mount', () => {
    render(<DrinkList />);
    
    const drinkList = screen.getByTestId('DrinkList');

    expect(drinkList).toBeInTheDocument();
  });
});