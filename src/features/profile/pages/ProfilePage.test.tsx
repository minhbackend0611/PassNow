import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ProfilePage from './ProfilePage';
import { useAuthStore } from '../../../store/useAuthStore';
import { auth } from '../../../lib/firebase';
import { updateProfile } from 'firebase/auth';
import { setDoc } from 'firebase/firestore';

// Mock dependencies
vi.mock('../../../store/useAuthStore');
vi.mock('firebase/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/auth')>();
  return {
    ...actual,
    updateProfile: vi.fn(),
  };
});
vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    doc: vi.fn(),
    setDoc: vi.fn(),
  };
});
vi.mock('../../../lib/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'user123',
      email: 'test@example.com',
      displayName: 'Old Name'
    }
  },
  db: {}
}));

// Mock fetch for APIs
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const mockUser = {
  uid: 'user123',
  email: 'test@example.com',
  displayName: 'Test User',
  school: 'Test University',
  province: 'Hà Nội',
  district: 'Cầu Giấy',
  isProfileComplete: true,
  emailVerified: true,
};

describe('ProfilePage', () => {
  const mockSetUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser,
      isLoading: false,
      setUser: mockSetUser,
      setLoading: vi.fn(),
      initializeAuthListener: vi.fn(),
    });

    // Setup fetch mocks
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('provinces.open-api.vn/api/p/')) {
        return Promise.resolve({
          json: () => Promise.resolve([
            { code: 1, name: 'Hà Nội' },
            { code: 2, name: 'Hồ Chí Minh' }
          ])
        });
      }
      if (url.includes('world_universities_and_domains.json')) {
        return Promise.resolve({
          json: () => Promise.resolve([
            { name: 'Test University', country: 'Viet Nam' },
            { name: 'Other University', country: 'Viet Nam' }
          ])
        });
      }
      if (url.includes('depth=2')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            districts: [
              { code: 101, name: 'Cầu Giấy', province_code: 1 },
              { code: 102, name: 'Ba Đình', province_code: 1 }
            ]
          })
        });
      }
      return Promise.reject(new Error('not found'));
    });
  });

  const renderComponent = () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );
  };

  it('renders correctly with user data', async () => {
    renderComponent();
    
    // Check main elements
    expect(screen.getByRole('heading', { name: 'Account Settings', level: 1 })).toBeInTheDocument();
    
    // Check if input fields have the correct values from store
    await waitFor(() => {
      expect(screen.getByLabelText(/Display Name/i)).toHaveValue('Test User');
      expect(screen.getByLabelText(/Email Address/i)).toHaveValue('test@example.com');
      expect(screen.getByText('Test University')).toBeInTheDocument();
    });
  });

  it('handles form submission successfully', async () => {
    renderComponent();

    // Wait for the form to be interactive (data loaded)
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    });

    // Change display name
    const nameInput = screen.getByLabelText(/Display Name/i);
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    // Submit form
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveButton);

    // Verify
    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith(
        auth.currentUser,
        expect.objectContaining({ displayName: 'New Name' })
      );
      expect(setDoc).toHaveBeenCalled();
      expect(mockSetUser).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: 'New Name'
        })
      );
      expect(screen.getByText(/Profile updated successfully!/i)).toBeInTheDocument();
    });
  });

  it('disables save button when no changes are made', async () => {
    renderComponent();

    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    
    // react-hook-form isDirty takes a moment to initialize as false
    await waitFor(() => {
      expect(saveButton).toBeDisabled();
    });
  });
});
