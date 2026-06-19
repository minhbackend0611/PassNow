import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import TopNavBar from './TopNavBar';
import { useAuthStore } from '../../store/useAuthStore';

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: vi.fn()
}));

vi.mock('../../lib/firebase', () => ({
  auth: {
    signOut: vi.fn()
  }
}));

describe('TopNavBar', () => {
  const renderWithRouter = (component: React.ReactNode) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it('renders logo and navigation links', () => {
    (useAuthStore as any).mockReturnValue({ user: null });
    
    renderWithRouter(<TopNavBar />);
    
    expect(screen.getByText('PassNow')).toBeInTheDocument();
    expect(screen.getByText('Browse')).toBeInTheDocument();
    expect(screen.getByText('How it Works')).toBeInTheDocument();
  });

  it('shows Log In button when user is not authenticated', () => {
    (useAuthStore as any).mockReturnValue({ user: null });
    
    renderWithRouter(<TopNavBar />);
    
    expect(screen.getByText('Log In')).toBeInTheDocument();
    expect(screen.queryByTitle('Sign Out')).not.toBeInTheDocument();
  });

  it('shows profile avatar when user is authenticated', () => {
    (useAuthStore as any).mockReturnValue({
      user: {
        uid: '123',
        email: 'test@example.com',
        displayName: 'John Doe',
        isProfileComplete: true
      }
    });
    
    renderWithRouter(<TopNavBar />);
    
    expect(screen.queryByText('Log In')).not.toBeInTheDocument();
    expect(screen.getByTitle('Sign Out')).toBeInTheDocument();
    // It should render the first letter of display name 'J'
    expect(screen.getByText('J')).toBeInTheDocument();
  });
});
