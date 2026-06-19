import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import VerifyEmailPage from './VerifyEmailPage';
import { useAuthStore } from '../../../store/useAuthStore';
import { auth } from '../../../lib/firebase';
import { sendEmailVerification } from 'firebase/auth';

vi.mock('../../../store/useAuthStore');
vi.mock('firebase/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/auth')>();
  return {
    ...actual,
    sendEmailVerification: vi.fn(),
  };
});

// Mock auth.currentUser.reload
const mockReload = vi.fn();

vi.mock('../../../lib/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'user123',
      email: 'test@example.com',
      emailVerified: false,
      reload: () => mockReload(),
    }
  },
  db: {}
}));

describe('VerifyEmailPage', () => {
  const mockSetUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue({
      user: {
        uid: 'user123',
        email: 'test@example.com',
        emailVerified: false,
        displayName: 'Test User',
        school: null,
        province: null,
        district: null,
        isProfileComplete: false,
      },
      isLoading: false,
      setUser: mockSetUser,
      setLoading: vi.fn(),
      initializeAuthListener: vi.fn(),
    });
  });

  const renderComponent = () => {
    render(
      <BrowserRouter>
        <VerifyEmailPage />
      </BrowserRouter>
    );
  };

  it('renders correctly', () => {
    renderComponent();
    expect(screen.getByRole('heading', { name: /Verify your email/i })).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('handles resend email successfully', async () => {
    renderComponent();
    
    const resendBtn = screen.getByRole('button', { name: /Resend Verification Email/i });
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(sendEmailVerification).toHaveBeenCalledWith(auth.currentUser);
      expect(screen.getByText(/Verification email sent!/i)).toBeInTheDocument();
    });
  });

});
