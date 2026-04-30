import { describe, it, expect } from 'vitest';
import { hexToHslTriplet } from './hex-to-hsl';

describe('hexToHslTriplet', () => {
  it('converts pure red', () => {
    expect(hexToHslTriplet('#ff0000')).toBe('0 100% 50%');
  });
  it('converts pure green', () => {
    expect(hexToHslTriplet('#00ff00')).toBe('120 100% 50%');
  });
  it('converts pure blue', () => {
    expect(hexToHslTriplet('#0000ff')).toBe('240 100% 50%');
  });
  it('converts white and black', () => {
    expect(hexToHslTriplet('#ffffff')).toBe('0 0% 100%');
    expect(hexToHslTriplet('#000000')).toBe('0 0% 0%');
  });
  it('expands 3-digit shorthand', () => {
    expect(hexToHslTriplet('#f00')).toBe('0 100% 50%');
    expect(hexToHslTriplet('f00')).toBe('0 100% 50%');
  });
  it('handles indigo-600 (#1e40af)', () => {
    // Hue ~225, sat ~70%, lightness ~40% — sanity check
    const out = hexToHslTriplet('#1e40af');
    expect(out).toMatch(/^22[3-7] (6[0-9]|7[0-2])% 4[0-2]%$/);
  });
  it('returns null on garbage input', () => {
    expect(hexToHslTriplet('red')).toBeNull();
    expect(hexToHslTriplet('#xyzabc')).toBeNull();
    expect(hexToHslTriplet('')).toBeNull();
  });
  it('accepts uppercase + leading #', () => {
    expect(hexToHslTriplet('#FF0000')).toBe('0 100% 50%');
  });
});
