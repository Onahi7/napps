import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '';
  },
}));

// Mock Next Authentication
jest.mock('next-auth/react', () => ({
  useSession() {
    return { data: null, status: 'unauthenticated' };
  },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Suppress console errors during tests
console.error = jest.fn();