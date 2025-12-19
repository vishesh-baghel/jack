import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach } from 'vitest';

// Mock environment variables for tests
beforeAll(() => {
  process.env.PRISMA_DATABASE_URL = 'postgresql://test:test@localhost:5432/jack_test';
  process.env.POSTGRES_URL = 'postgresql://test:test@localhost:5432/jack_test';
  process.env.OPENAI_API_KEY = 'test-key';
  process.env.APIFY_API_TOKEN = 'test-token';
  process.env.LANGFUSE_PUBLIC_KEY = 'pk-lf-test';
  process.env.LANGFUSE_SECRET_KEY = 'sk-lf-test';
  process.env.LANGFUSE_HOST = 'https://cloud.langfuse.com';
});

afterEach(() => {
  // Clear mocks after each test
});

afterAll(() => {
  // Cleanup
});
