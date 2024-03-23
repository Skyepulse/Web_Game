import { render, screen } from '@testing-library/react';
import App from './App';

test('renders button in main screen', () => {
  render(<App />);
  const button = screen.getByText(/Play!/i);
  expect(button).toBeInTheDocument();
});
