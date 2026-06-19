import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PublicProfilePage from './PublicProfilePage';
import { useAuthStore } from '../../../store/useAuthStore';
import { getUserById } from '../../../services/userService';
import { getListings } from '../../../services/listingService';
import type { User, Listing } from '../../../types';

// Mock dependencies
vi.mock('../../../store/useAuthStore');
vi.mock('../../../services/userService');
vi.mock('../../../services/listingService');

const mockCurrentUser = {
  uid: 'user_current',
  email: 'current@example.com',
  displayName: 'Current User',
  school: 'Current School',
  province: 'Hà Nội',
  district: 'Cầu Giấy',
  isProfileComplete: true,
};

const mockTargetUser: User = {
  uid: 'user_target',
  email: 'target@example.com',
  displayName: 'Target User',
  school: 'Target University',
  province: 'Hà Nội',
  district: 'Hai Bà Trưng',
  isProfileComplete: true,
  rating: 4.5,
  totalReviews: 8,
};

const mockListings: Listing[] = [
  {
    id: 'listing_1',
    title: 'Chemistry Textbook',
    description: 'Good condition Chemistry book',
    price: 150,
    isFree: false,
    condition: 'Used',
    images: ['chem.jpg'],
    category: 'books',
    school: 'Target University',
    district: 'Hai Bà Trưng',
    sellerId: 'user_target',
    status: 'available',
    createdAt: Date.now().toString(),
    updatedAt: Date.now().toString(),
  },
  {
    id: 'listing_2',
    title: 'Free Table lamp',
    description: 'Working desk lamp',
    price: 0,
    isFree: true,
    condition: 'Used',
    images: ['lamp.jpg'],
    category: 'electronics',
    school: 'Target University',
    district: 'Hai Bà Trưng',
    sellerId: 'user_target',
    status: 'available',
    createdAt: Date.now().toString(),
    updatedAt: Date.now().toString(),
  }
];

describe('PublicProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (userId = 'user_target') => {
    render(
      <MemoryRouter initialEntries={[`/profile/${userId}`]}>
        <Routes>
          <Route path="/profile/:userId" element={<PublicProfilePage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders loading state initially', () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: mockCurrentUser });
    vi.mocked(getUserById).mockReturnValue(new Promise(() => {})); // pending
    vi.mocked(getListings).mockReturnValue(new Promise(() => {})); // pending
    
    renderComponent();
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders user details and active listings for another user', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: mockCurrentUser });
    vi.mocked(getUserById).mockResolvedValue(mockTargetUser);
    vi.mocked(getListings).mockResolvedValue(mockListings);

    renderComponent('user_target');

    // Verify user details show up
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Target User/i, level: 1 })).toBeInTheDocument();
      expect(screen.getAllByText(/University/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Trưng/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/4.5/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/reviews/i).length).toBeGreaterThan(0);
    });

    // Verify active listings show up
    expect(screen.getByText(/Chemistry/i)).toBeInTheDocument();
    expect(screen.getByText(/Table/i)).toBeInTheDocument();
    
    // Verify CTA shows "Contact Seller"
    expect(screen.getByRole('button', { name: /Contact/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Edit/i })).not.toBeInTheDocument();
  });

  it('renders own profile with edit button instead of contact button', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: mockCurrentUser });
    vi.mocked(getUserById).mockResolvedValue(mockCurrentUser);
    vi.mocked(getListings).mockResolvedValue([]);

    renderComponent('user_current');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Current User/i, level: 1 })).toBeInTheDocument();
    });

    // Verify own profile CTA shows "Edit Profile Settings"
    expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Contact/i })).not.toBeInTheDocument();
  });

  it('renders user not found state when profile is missing', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: mockCurrentUser });
    vi.mocked(getUserById).mockResolvedValue(null);
    vi.mocked(getListings).mockResolvedValue([]);

    renderComponent('non_existent_user');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Not Found/i, level: 2 })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Home/i })).toBeInTheDocument();
    });
  });
});
