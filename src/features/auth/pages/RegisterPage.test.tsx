import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';
import { useAuthStore } from '../../../store/useAuthStore';
import { createUserWithEmailAndPassword, sendEmailVerification, UserCredential } from 'firebase/auth';

vi.mock('../../../store/useAuthStore');
vi.mock('firebase/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/auth')>();
  return {
    ...actual,
    createUserWithEmailAndPassword: vi.fn(),
    sendEmailVerification: vi.fn(),
  };
});

describe('RegisterPage', () => {
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
        <RegisterPage />
      </BrowserRouter>
    );
  };

  it('renders correctly', () => {
    renderComponent();
    expect(screen.getByRole('heading', { name: /Create an account/i })).toBeInTheDocument();
  });

  it('calls createUserWithEmailAndPassword and sendEmailVerification on submit', async () => {
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValueOnce({
      user: { email: 'test@university.edu' }
    } as unknown as UserCredential);
    
    renderComponent();
    
    fireEvent.change(screen.getByLabelText(/University Email/i), { target: { value: 'test@university.edu' } });
    fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Register/i }));

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalled();
      expect(sendEmailVerification).toHaveBeenCalled();
    });
  });
});
