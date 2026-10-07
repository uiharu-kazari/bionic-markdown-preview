import { useState, useCallback, useEffect } from 'react';

export function useSessionStorage<T>(key: string, initialValue: T, validate?: (value: unknown) => value is T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      if (!item) return initialValue;
      const parsed: unknown = JSON.parse(item);
      return validate && !validate(parsed) ? initialValue : parsed as T;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // Keep editing available when browser storage is blocked or full.
    }
  }, [key, storedValue]);

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      return valueToStore;
    });
  }, []);

  return [storedValue, setValue];
}
