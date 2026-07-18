import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement scrolling; the quest page scrolls to top on
// navigation, so stub it to keep test output clean.
Object.defineProperty(window, 'scrollTo', { value: () => undefined, writable: true });
