import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import TransactionsPage from './TransactionsPage';
import { useAuthStore } from '../../../store/useAuthStore';
import { useTransactionStore } from '../../../store/useTransactionStore';

vi.mock('../../../store/useAuthStore');
vi.mock('../../../store/useTransactionStore');
vi.mock('../../../services/transactionService');
vi.mock('../../../services/reviewService', () => ({
  getReviewsByReviewer: vi.fn().mockResolvedValue([]),
  submitReview: vi.fn().mockResolvedValue(true)
}));
vi.mock('../../../services/listingService', () => ({
  getListingById: vi.fn().mockResolvedValue({ listing: { id: 'listing_1', title: 'Laptop', price: 1000 } })
}));
vi.mock('../../../services/userService', () => ({
  getUserById: vi.fn().mockResolvedValue({ uid: 'seller_123', displayName: 'Seller' })
}));

describe('TransactionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    render(
      <MemoryRouter>
        <TransactionsPage />
      </MemoryRouter>
    );
  };

  it('prompts to login if not logged in', () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: null } as unknown as ReturnType<typeof useAuthStore>);
    vi.mocked(useTransactionStore).mockReturnValue({ transactions: [], buyingActionRequiredCount: 0, sellingActionRequiredCount: 0 } as unknown as ReturnType<typeof useTransactionStore>);
    renderComponent();
    expect(screen.getByText(/Please log in/i)).toBeInTheDocument();
  });

  it('renders transactions list', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: { uid: 'buyer_123' } } as unknown as ReturnType<typeof useAuthStore>);
    vi.mocked(useTransactionStore).mockReturnValue({
      transactions: [
        {
          id: 'tx_1',
          listingId: 'listing_1',
          listingTitle: 'Laptop',
          sellerId: 'seller_123',
          buyerId: 'buyer_123',
          sellerConfirmed: true,
          buyerConfirmed: false,
          status: 'pending',
          createdAt: Date.now()
        }
      ],
      buyingActionRequiredCount: 0,
      sellingActionRequiredCount: 0,
      initializeListener: vi.fn(),
    } as unknown as ReturnType<typeof useTransactionStore>);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Laptop/i)).toBeInTheDocument();
    });
    
    // We are the buyer, so we should see Confirm Receipt and Cancel Request
    expect(screen.getByRole('button', { name: /Confirm Receipt/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel Request/i })).toBeInTheDocument();
  });
});
