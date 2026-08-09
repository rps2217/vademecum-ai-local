/**
 * Test setup for Vitest
 */

import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// jsdom no implementa scrollIntoView; los componentes que lo usan lo llaman
// opcionalmente (?.) pero el método debe existir en el prototype.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function () {};
}
