/**
 * Test setup
 */

import '@testing-library/jest-dom';

// Mock IndexedDB for tests
const mockIndexedDB = {
  open: () => Promise.resolve({}),
  delete: () => Promise.resolve({}),
};

if (typeof window !== 'undefined') {
  // @ts-ignore
  indexedDB = mockIndexedDB;
}

// Mock localStorage
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
}
