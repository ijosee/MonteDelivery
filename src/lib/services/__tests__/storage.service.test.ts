import { describe, it, expect } from 'vitest';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '../storage.service';

describe('StorageService constants', () => {
  it('allows JPEG, PNG, and WebP mime types', () => {
    expect(ALLOWED_MIME_TYPES.has('image/jpeg')).toBe(true);
    expect(ALLOWED_MIME_TYPES.has('image/png')).toBe(true);
    expect(ALLOWED_MIME_TYPES.has('image/webp')).toBe(true);
  });

  it('rejects other mime types', () => {
    expect(ALLOWED_MIME_TYPES.has('image/gif')).toBe(false);
    expect(ALLOWED_MIME_TYPES.has('image/svg+xml')).toBe(false);
    expect(ALLOWED_MIME_TYPES.has('application/pdf')).toBe(false);
    expect(ALLOWED_MIME_TYPES.has('text/plain')).toBe(false);
  });

  it('has a max file size of 5 MB', () => {
    expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
  });
});
