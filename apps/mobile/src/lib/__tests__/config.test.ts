import { validateApiUrl } from '../config';
import { describe, it, expect } from '@jest/globals';
describe('API configuration', () => {
  it('allows an unconfigured app shell and normalizes the API URL', () => {
    expect(validateApiUrl(undefined)).toBeUndefined();
    expect(validateApiUrl('http://10.0.2.2:8080/')).toBe('http://10.0.2.2:8080');
  });
  it.each([
    'file:///private',
    'https://user:secret@example.com',
    'https://example.com?token=secret',
  ])('rejects unsafe configuration: %s', (url) => {
    expect(() => validateApiUrl(url)).toThrow();
  });
});
