/**
 * Auth Forms Client Component Tests
 * Tests signup/login form rendering and behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock auth-client
vi.mock('@/lib/auth-client', () => ({
  setUserSession: vi.fn(),
}));

import { AuthForms } from '@/app/auth/_components/auth-forms';

describe('Auth Forms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should show login form when signup is not allowed', () => {
      render(<AuthForms signupAllowed={false} />);

      expect(screen.getByRole('button', { name: /let me in/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter the secret sauce/i)).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/you@example.com/i)).not.toBeInTheDocument();
    });

    it('should show signup form when signup is allowed', () => {
      render(<AuthForms signupAllowed={true} />);

      expect(screen.getByRole('button', { name: /create my account/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/min 8 characters/i)).toBeInTheDocument();
    });

    it('should not show signup toggle when signup is disabled', () => {
      render(<AuthForms signupAllowed={false} />);

      expect(screen.queryByText(/need to create an account/i)).not.toBeInTheDocument();
    });

    it('should show signup toggle when signup is allowed', () => {
      render(<AuthForms signupAllowed={true} />);

      // Initially in signup mode, so should show login toggle
      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    });
  });

  describe('Guest Login', () => {
    it('should show guest login button on login form', () => {
      render(<AuthForms signupAllowed={false} />);

      expect(screen.getByRole('button', { name: /see what I'm cooking/i })).toBeInTheDocument();
    });

    it('should show guest login button on signup form', () => {
      render(<AuthForms signupAllowed={true} />);

      expect(screen.getByRole('button', { name: /see what I'm cooking/i })).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should have all signup form fields', () => {
      render(<AuthForms signupAllowed={true} />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText('passphrase')).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm passphrase/i)).toBeInTheDocument();
    });

    it('should have login form field', () => {
      render(<AuthForms signupAllowed={false} />);

      expect(screen.getByLabelText(/passphrase/i)).toBeInTheDocument();
    });
  });
});
