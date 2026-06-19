import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import { useAuthStore } from '../../../store/useAuthStore';
import { signInWithEmailAndPassword, UserCredential } from 'firebase/auth';

vi.mock('../../../store/useAuthStore');
vi.mock('firebase/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/auth')>();
  return {
    ...actual,
    signInWithEmailAndPassword: vi.fn(),
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      isLoading: false,
      setUser: vi.fn(),
      setLoading: vi.fn(),
      initializeAuthListener: vi.fn(),
    });
  });

  const renderComponent = () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
  };

  it('renders correctly', () => {
    renderComponent();
    expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeInTheDocument();
  });

  it('calls signInWithEmailAndPassword on submit', async () => {
    vi.mocked(signInWithEmailAndPassword).mockResolvedValueOnce({
      user: { email: 'test@university.edu' }
    } as unknown as UserCredential);
    
    renderComponent();
    
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@university.edu' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@university.edu',
        'password123'
      );
    });
  });
});
