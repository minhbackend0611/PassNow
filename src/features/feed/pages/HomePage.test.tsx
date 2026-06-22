import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import HomePage from './HomePage';
import { useAuthStore } from '../../../store/useAuthStore';
import { getListings } from '../../../services/listingService';
import type { Listing } from '../../../types';

vi.mock('../../../store/useAuthStore');
vi.mock('../../../services/listingService', () => ({
  getListings: vi.fn()
}));

global.fetch = vi.fn().mockResolvedValue({
  json: () => Promise.resolve([
    { country: 'Viet Nam', name: 'BK University' },
    { country: 'Viet Nam', name: 'Other Uni' },
    { country: 'USA', name: 'MIT' }
  ])
});

const mockUser = {
  uid: 'user1',
  email: 'user1@example.com',
  displayName: 'User One',
  school: 'BK University',
  province: 'Hà Nội',
  district: 'Cầu Giấy',
  isProfileComplete: true,
};

const mockRawListings: Listing[] = [
  {
    id: 'l1',
    title: 'Other Uni Listing',
    description: 'A listing from another school',
    price: 10,
    isFree: false,
    condition: 'Used',
    images: [],
    category: 'Other',
    school: 'Other University',
    province: 'Hà Nội',
    district: 'Hoàn Kiếm',
    sellerId: 'user_other',
    status: 'available',
    createdAt: '2026-06-19T10:00:00.000Z',
    updatedAt: '2026-06-19T10:00:00.000Z',
  },
  {
    id: 'l2',
    title: 'Same School Listing',
    description: 'A listing matching BK',
    price: 20,
    isFree: false,
    condition: 'New',
    images: [],
    category: 'Books',
    school: 'BK University',
    province: 'Hà Nội',
    district: 'Cầu Giấy',
    sellerId: 'user_bk',
    status: 'available',
    createdAt: '2026-06-19T09:00:00.000Z',
    updatedAt: '2026-06-19T09:00:00.000Z',
  },
  {
    id: 'l3',
    title: 'Same District Listing',
    description: 'A listing matching Cầu Giấy',
    price: 30,
    isFree: false,
    condition: 'Like New',
    images: [],
    category: 'Clothing',
    school: 'Other BK',
    district: 'Cầu Giấy',
    sellerId: 'user_other_cg',
    status: 'available',
    createdAt: '2026-06-19T08:00:00.000Z',
    updatedAt: '2026-06-19T08:00:00.000Z',
  }
];

describe('HomePage Feed sorting and Filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );
  };

  it('sorts listings by user school preference, then district, then others', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: mockUser });
    vi.mocked(getListings).mockResolvedValue(mockRawListings);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Same School Listing')).toBeInTheDocument();
    });

    const items = screen.getAllByRole('heading', { level: 3 });
    // Expected order: 
    // Index 0: Same School Listing (BK University)
    // Index 1: Same District Listing (Cầu Giấy)
    // Index 2: Other Uni Listing (Other University / Hoàn Kiếm)
    expect(items[0]).toHaveTextContent('Same School Listing');
    expect(items[1]).toHaveTextContent('Same District Listing');
    expect(items[2]).toHaveTextContent('Other Uni Listing');
  });

  it('toggles Free Only active tab and fetches accordingly', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: mockUser });
    vi.mocked(getListings).mockResolvedValue([]);

    renderComponent();

    const freeTabButton = screen.getByRole('button', { name: /Free Only/i });
    fireEvent.click(freeTabButton);

    await waitFor(() => {
      expect(getListings).toHaveBeenLastCalledWith(expect.objectContaining({
        isFree: true
      }));
    });
  });

  it('renders Empty State when no results matching query filters', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: mockUser });
    vi.mocked(getListings).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    const clearButton = screen.getByRole('button', { name: /Clear filters/i });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(getListings).toHaveBeenLastCalledWith({});
    });
  });
});
