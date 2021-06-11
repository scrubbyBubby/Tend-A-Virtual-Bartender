import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import DrinkView from './DrinkView';

describe('<DrinkView />', () => {
  test('it should mount', () => {
    render(<DrinkView />);
    
    const drinkView = screen.getByTestId('DrinkView');

    expect(drinkView).toBeInTheDocument();
  });
});