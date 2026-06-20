import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ListingDetailPage from './ListingDetailPage';
import { useAuthStore } from '../../../store/useAuthStore';
import { getListingById } from '../../../services/listingService';
import type { Listing, User } from '../../../types';

vi.mock('../../../store/useAuthStore');
vi.mock('../../../services/listingService');

const mockListing: Listing = {
  id: 'listing_abc',
  title: 'Organic Chemistry Set',
  description: 'Full organic chemistry model kit in perfect condition.',
  price: 300,
  isFree: false,
  condition: 'Like New',
  images: ['chem_kit.jpg'],
  category: 'books',
  school: 'BK University',
  district: 'Cầu Giấy',
  sellerId: 'seller_123',
  status: 'available',
  createdAt: Date.now().toString(),
  updatedAt: Date.now().toString(),
  views: 42,
};

const mockSeller: User = {
  uid: 'seller_123',
  email: 'seller@example.com',
  displayName: 'Pro Seller',
  school: 'BK University',
  province: 'Hà Nội',
  district: 'Cầu Giấy',
  isProfileComplete: true,
  rating: 4.8,
  totalReviews: 15,
};

describe('ListingDetailPage Permission Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (id = 'listing_abc') => {
    render(
      <MemoryRouter initialEntries={[`/listings/${id}`]}>
        <Routes>
          <Route path="/listings/:id" element={<ListingDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders loading spinner and details correctly', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: null });
    vi.mocked(getListingById).mockResolvedValue({ listing: mockListing, seller: mockSeller });

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText(/Organic/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/300/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Seller/i).length).toBeGreaterThan(0);
    });
  });

  it('renders Edit and Delete actions plus views count for the seller owner', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: { uid: 'seller_123' } } as unknown as ReturnType<typeof useAuthStore>); // is owner
    vi.mocked(getListingById).mockResolvedValue({ listing: mockListing, seller: mockSeller });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
      expect(screen.getByText(/42/i)).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /Contact/i })).not.toBeInTheDocument();
  });

  it('renders Contact Seller action for normal buyer users', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: { uid: 'buyer_999' } } as unknown as ReturnType<typeof useAuthStore>); // not owner
    vi.mocked(getListingById).mockResolvedValue({ listing: mockListing, seller: mockSeller });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Contact/i })).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /Edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Delete/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/42/i)).not.toBeInTheDocument();
  });
});
