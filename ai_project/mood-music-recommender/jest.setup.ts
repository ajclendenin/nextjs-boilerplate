import '@testing-library/jest-dom';

// Ensure module-level env captures (e.g. const KEY = process.env.KEY) work in all test files
process.env.RAPID_API_KEY = 'test-key';
