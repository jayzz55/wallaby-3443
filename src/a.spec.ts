import { it, expect } from 'vitest';
import messages from './messages';

it('should pass', () => {
  expect(1).toBe(1);
  expect(messages).toBe('No results to display, check back later.')
});