import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Transaction } from '../types';
import { subscribeToUserTransactions } from '../services/transactionService';
import {
  calculateTransactionActionCounts,
  useTransactionStore,
} from './useTransactionStore';

vi.mock('../services/transactionService', () => ({
  subscribeToUserTransactions: vi.fn(),
}));

const createTransaction = (
  overrides: Partial<Transaction> = {},
): Transaction => ({
  id: 'transaction-1',
  listingId: 'listing-1',
  listingTitle: 'Calculus Textbook',
  sellerId: 'seller-1',
  buyerId: 'buyer-1',
  sellerConfirmed: false,
  status: 'pending',
  createdAt: 1,
  ...overrides,
});

describe('calculateTransactionActionCounts', () => {
  it('never counts a buyer action after the seller confirms', () => {
    const transactions = [
      createTransaction({
        sellerConfirmed: true,
        status: 'completed',
      }),
      createTransaction({
        id: 'legacy-pending-confirmed',
        sellerConfirmed: true,
        status: 'pending',
      }),
    ];

    expect(calculateTransactionActionCounts(transactions, 'buyer-1')).toEqual({
      actionRequiredCount: 0,
      buyingActionRequiredCount: 0,
      sellingActionRequiredCount: 0,
    });
  });

  it('counts only pending requests that the seller has not confirmed', () => {
    const transactions = [
      createTransaction(),
      createTransaction({ id: 'pending-2', buyerId: 'buyer-2' }),
      createTransaction({ id: 'confirmed', sellerConfirmed: true }),
      createTransaction({ id: 'completed', status: 'completed' }),
      createTransaction({ id: 'cancelled', status: 'cancelled' }),
      createTransaction({ id: 'other-seller', sellerId: 'seller-2' }),
    ];

    expect(calculateTransactionActionCounts(transactions, 'seller-1')).toEqual({
      actionRequiredCount: 2,
      buyingActionRequiredCount: 0,
      sellingActionRequiredCount: 2,
    });
  });
});

describe('useTransactionStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTransactionStore.setState({
      actionRequiredCount: 0,
      buyingActionRequiredCount: 0,
      sellingActionRequiredCount: 0,
      transactions: [],
    });
  });

  it('updates transactions and action counts from the live subscription', () => {
    let emitTransactions: ((transactions: Transaction[]) => void) | undefined;
    const unsubscribe = vi.fn();

    vi.mocked(subscribeToUserTransactions).mockImplementation(
      (_userId, callback) => {
        emitTransactions = callback;
        return unsubscribe;
      },
    );

    const stopListening = useTransactionStore
      .getState()
      .initializeTransactionListener('seller-1');
    const transactions = [createTransaction()];

    emitTransactions?.(transactions);

    expect(subscribeToUserTransactions).toHaveBeenCalledWith(
      'seller-1',
      expect.any(Function),
    );
    expect(useTransactionStore.getState()).toMatchObject({
      actionRequiredCount: 1,
      buyingActionRequiredCount: 0,
      sellingActionRequiredCount: 1,
      transactions,
    });

    stopListening();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
