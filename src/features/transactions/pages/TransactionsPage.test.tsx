import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import TransactionsPage from './TransactionsPage';
import { useAuthStore } from '../../../store/useAuthStore';
import {
  useTransactionStore,
  type TransactionState,
} from '../../../store/useTransactionStore';
import {
  cancelTransaction,
  sellerConfirmTransaction,
} from '../../../services/transactionService';
import {
  getReviewsByReviewer,
  submitReview,
} from '../../../services/reviewService';
import type { Transaction } from '../../../types';

vi.mock('../../../store/useAuthStore');
vi.mock('../../../store/useTransactionStore');
vi.mock('../../../services/transactionService', () => ({
  cancelTransaction: vi.fn().mockResolvedValue(true),
  sellerConfirmTransaction: vi.fn().mockResolvedValue(true),
}));
vi.mock('../../../services/reviewService', () => ({
  getReviewsByReviewer: vi.fn().mockResolvedValue([]),
  submitReview: vi.fn().mockResolvedValue(true),
}));
vi.mock('../../../services/listingService', () => ({
  getListingById: vi.fn().mockResolvedValue({
    listing: { id: 'listing-1', title: 'Laptop', price: 1000 },
  }),
  getListings: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../../services/userService', () => ({
  getUserById: vi.fn().mockResolvedValue({
    uid: 'seller-1',
    displayName: 'Seller',
  }),
}));
vi.mock('../../reviews/components/ReviewModal', () => ({
  default: ({
    isOpen,
    onSubmit,
  }: {
    isOpen: boolean;
    onSubmit: (
      rating: number,
      comment: string,
      receiptStatus: 'received' | 'not_received',
    ) => Promise<void>;
  }) =>
    isOpen ? (
      <button onClick={() => void onSubmit(5, 'Smooth handover', 'received')}>
        Submit test review
      </button>
    ) : null,
}));

type AuthState = ReturnType<typeof useAuthStore.getState>;

const createAuthState = (uid: string | null): AuthState => ({
  user: uid
    ? {
        uid,
        email: `${uid}@example.com`,
        displayName: uid === 'buyer-1' ? 'Buyer' : 'Seller',
        school: 'PassNow University',
        province: 'Ha Noi',
        district: 'Cau Giay',
        isProfileComplete: true,
        emailVerified: true,
      }
    : null,
  isLoading: false,
  setUser: vi.fn(),
  setLoading: vi.fn(),
  initializeAuthListener: vi.fn(() => vi.fn()),
});

const createTransaction = (
  overrides: Partial<Transaction> = {},
): Transaction => ({
  id: 'transaction-1',
  listingId: 'listing-1',
  listingTitle: 'Laptop',
  sellerId: 'seller-1',
  buyerId: 'buyer-1',
  sellerConfirmed: false,
  status: 'pending',
  createdAt: 1,
  ...overrides,
});

const createTransactionState = (
  transactions: Transaction[],
  overrides: Partial<TransactionState> = {},
): TransactionState => ({
  actionRequiredCount: 0,
  buyingActionRequiredCount: 0,
  sellingActionRequiredCount: 0,
  transactions,
  initializeTransactionListener: vi.fn(() => vi.fn()),
  ...overrides,
});

const renderComponent = () =>
  render(
    <MemoryRouter>
      <TransactionsPage />
    </MemoryRouter>,
  );

describe('TransactionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getReviewsByReviewer).mockResolvedValue([]);
    vi.mocked(submitReview).mockResolvedValue(true);
    vi.mocked(cancelTransaction).mockResolvedValue(true);
    vi.mocked(sellerConfirmTransaction).mockResolvedValue(true);
    vi.mocked(useAuthStore).mockReturnValue(createAuthState('buyer-1'));
    vi.mocked(useTransactionStore).mockReturnValue(createTransactionState([]));
  });

  it('prompts unauthenticated users to log in', () => {
    vi.mocked(useAuthStore).mockReturnValue(createAuthState(null));

    renderComponent();

    expect(screen.getByText(/Please log in/i)).toBeInTheDocument();
  });

  it('keeps an unanswered request pending without buyer confirmation or review actions', async () => {
    vi.mocked(useTransactionStore).mockReturnValue(
      createTransactionState([createTransaction()]),
    );

    renderComponent();

    expect(await screen.findByText('Laptop')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Cancel Request/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Confirm Receipt/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Leave Review/i }),
    ).not.toBeInTheDocument();
  });

  it('lets only the buyer review after seller confirmation', async () => {
    const user = userEvent.setup();
    const transaction = createTransaction({
      sellerConfirmed: true,
      status: 'completed',
      completedAt: 2,
    });
    vi.mocked(useTransactionStore).mockReturnValue(
      createTransactionState([transaction]),
    );

    renderComponent();

    await user.click(
      await screen.findByRole('button', { name: /Leave Review/i }),
    );
    await user.click(
      screen.getByRole('button', { name: /Submit test review/i }),
    );

    await waitFor(() => {
      expect(submitReview).toHaveBeenCalledWith(
        'transaction-1',
        'listing-1',
        'buyer-1',
        'seller-1',
        5,
        'Smooth handover',
        'received',
      );
    });
    expect(
      screen.queryByRole('button', { name: /Confirm Receipt/i }),
    ).not.toBeInTheDocument();
  });

  it('does not offer the seller a review action', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuthStore).mockReturnValue(createAuthState('seller-1'));
    vi.mocked(useTransactionStore).mockReturnValue(
      createTransactionState([
        createTransaction({
          sellerConfirmed: true,
          status: 'completed',
          completedAt: 2,
        }),
      ]),
    );

    renderComponent();
    await user.click(screen.getByRole('button', { name: /^Selling/i }));

    expect(await screen.findByText('Laptop')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Leave Review/i }),
    ).not.toBeInTheDocument();
  });

  it('confirms a pending sale with the transaction id only', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuthStore).mockReturnValue(createAuthState('seller-1'));
    vi.mocked(useTransactionStore).mockReturnValue(
      createTransactionState([createTransaction()], {
        actionRequiredCount: 1,
        sellingActionRequiredCount: 1,
      }),
    );

    renderComponent();
    await user.click(screen.getByRole('button', { name: /^Selling/i }));
    await user.click(
      await screen.findByRole('button', { name: /Confirm Delivery/i }),
    );
    const confirmButtons = screen.getAllByRole('button', {
      name: /Confirm Delivery/i,
    });
    await user.click(confirmButtons[1]);

    await waitFor(() => {
      expect(sellerConfirmTransaction).toHaveBeenCalledWith('transaction-1');
    });
  });
});
