import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn utility', () => {
  it('merges simple class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('handles conditional classes', () => {
    expect(cn('base', true && 'is-true', false && 'is-false')).toBe('base is-true');
  });

  it('handles arrays and objects', () => {
    expect(cn(['arr1', 'arr2'], { obj1: true, obj2: false })).toBe('arr1 arr2 obj1');
  });

  it('resolves tailwind conflicts (tailwind-merge logic)', () => {
    // p-2 and p-4 conflict; p-4 should win as it's later in the arguments
    expect(cn('p-2', 'p-4')).toBe('p-4');
    
    // text-red-500 and text-blue-500 conflict
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    
    // Complex case: mixed classes with one conflict
    expect(cn('flex items-center p-2', 'p-4 rounded-md')).toBe('flex items-center p-4 rounded-md');
  });

  it('removes null, undefined, and boolean values from the output', () => {
    // @ts-ignore - testing runtime behavior for non-TS-compliant inputs
    expect(cn('base', null, undefined, true, false)).toBe('base');
  });
});
