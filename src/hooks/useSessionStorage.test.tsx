import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSessionStorage } from './useSessionStorage';

afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); });
describe('session recovery', () => {
  const isText = (value: unknown): value is string => typeof value === 'string';
  it.each(['null', '123', '{"broken":true}', '{'])('recovers invalid stored content %s', stored => {
    sessionStorage.setItem('draft', stored);
    const { result } = renderHook(() => useSessionStorage('draft', 'sample', isText));
    expect(result.current[0]).toBe('sample');
  });
  it('keeps edits usable when storage is full or blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); });
    const { result } = renderHook(() => useSessionStorage('draft', 'sample', isText));
    act(() => result.current[1]('my document'));
    expect(result.current[0]).toBe('my document');
  });
  it('retains edits across a reload and functional updates', () => {
    const first = renderHook(() => useSessionStorage('draft', 'sample', isText));
    act(() => first.result.current[1](old => old + ' edited'));
    first.unmount();
    const second = renderHook(() => useSessionStorage('draft', 'sample', isText));
    expect(second.result.current[0]).toBe('sample edited');
  });
});
