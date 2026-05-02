import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import App from '../App';

// Mock the auth context
const mockAuth = {
  user: { uid: 'test-user', email: 'test@example.com' },
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signInWithGoogle: vi.fn(),
  logout: vi.fn(),
  resetPassword: vi.fn(),
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock other dependencies
vi.mock('../services/geminiService', () => ({
  curateLocalEvents: vi.fn().mockResolvedValue([]),
}));

vi.mock('../components/MapOverlay', () => ({
  MapOverlay: () => <div>Map</div>,
}));

describe('App Integration', () => {
  it('renders main app when authenticated', async () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );

    // Wait for app to load
    await screen.findByText('FOCO');
    expect(screen.getByText('FOCO')).toBeInTheDocument();
  });

  it('shows logout button when authenticated', async () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );

    const logoutButton = await screen.findByLabelText('Sign out');
    expect(logoutButton).toBeInTheDocument();
  });
});