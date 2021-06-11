import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import LiquorShelfManager from './LiquorShelfManager';

describe('<LiquorShelfManager />', () => {
  test('it should mount', () => {
    render(<LiquorShelfManager />);
    
    const liquorShelfManager = screen.getByTestId('LiquorShelfManager');

    expect(liquorShelfManager).toBeInTheDocument();
  });
});