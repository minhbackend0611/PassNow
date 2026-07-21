import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  doc,
  getDocs,
  runTransaction,
  type DocumentData,
  type DocumentReference,
  type DocumentSnapshot,
  type Transaction as FirestoreTransaction,
} from 'firebase/firestore';
import { submitReview } from './reviewService';
import type { Transaction } from '../types';

const mocks = vi.hoisted(() => ({
  auth: { currentUser: { uid: 'buyer-1' } as { uid: string } | null },
}));

vi.mock('../lib/firebase', () => ({ auth: mocks.auth, db: {} }));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  runTransaction: vi.fn(),
  where: vi.fn(),
}));

const createSnapshot = (
  data?: DocumentData,
): DocumentSnapshot<DocumentData> =>
  ({
    exists: () => data !== undefined,
    data: () => data,
  }) as unknown as DocumentSnapshot<DocumentData>;

const createTransaction = (
  overrides: Partial<Transaction> = {},
): Transaction => ({
  id: 'transaction-1',
  listingId: 'listing-1',
  listingTitle: 'Laptop',
  sellerId: 'seller-1',
  buyerId: 'buyer-1',
  sellerConfirmed: true,
  status: 'completed',
  createdAt: 1,
  completedAt: 2,
  ...overrides,
});

const mockReviewTransaction = (
  transactionData: Transaction,
) => {
  const get = vi
    .fn()
    .mockResolvedValueOnce(createSnapshot(transactionData))
    .mockResolvedValueOnce(createSnapshot())
    .mockResolvedValueOnce(createSnapshot({ rating: 4, totalReviews: 2 }));
  const set = vi.fn();
  const update = vi.fn();
  const firestoreTransaction = {
    get,
    set,
    update,
  } as unknown as FirestoreTransaction;

  vi.mocked(runTransaction).mockImplementationOnce(
    async (_db, updateFunction) => updateFunction(firestoreTransaction),
  );

  return { set, update };
};

describe('submitReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.currentUser = { uid: 'buyer-1' };
    vi.mocked(getDocs).mockResolvedValue({ empty: true } as Awaited<ReturnType<typeof getDocs>>);

    const transactionRef = { path: 'transactions/transaction-1' };
    const reviewRef = { path: 'reviews/transaction-1_buyer-1' };
    const userRef = { path: 'users/seller-1' };
    vi.mocked(doc)
      .mockReturnValueOnce(transactionRef as DocumentReference<DocumentData>)
      .mockReturnValueOnce(reviewRef as DocumentReference<DocumentData>)
      .mockReturnValueOnce(userRef as DocumentReference<DocumentData>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stores the buyer receipt outcome after seller confirmation', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1234);
    const firestoreTransaction = mockReviewTransaction(createTransaction());

    await expect(submitReview(
      'transaction-1',
      'listing-1',
      'buyer-1',
      'seller-1',
      5,
      '  Smooth handover  ',
      'not_received',
    )).resolves.toBe(true);

    expect(firestoreTransaction.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        reviewerId: 'buyer-1',
        revieweeId: 'seller-1',
        rating: 5,
        comment: 'Smooth handover',
        receiptStatus: 'not_received',
        createdAt: 1234,
      }),
    );
    expect(firestoreTransaction.update).toHaveBeenCalledWith(
      expect.anything(),
      { rating: 13 / 3, totalReviews: 3 },
    );
  });

  it('rejects a review before the seller confirms', async () => {
    mockReviewTransaction(createTransaction({
      sellerConfirmed: false,
      status: 'pending',
      completedAt: null,
    }));

    await expect(submitReview(
      'transaction-1',
      'listing-1',
      'buyer-1',
      'seller-1',
      4,
      '',
      'received',
    )).resolves.toBe(false);
  });

  it('rejects duplicate legacy reviews before writing', async () => {
    vi.mocked(getDocs).mockResolvedValueOnce({ empty: false } as Awaited<ReturnType<typeof getDocs>>);

    await expect(submitReview(
      'transaction-1',
      'listing-1',
      'buyer-1',
      'seller-1',
      5,
      '',
      'received',
    )).resolves.toBe(false);

    expect(runTransaction).not.toHaveBeenCalled();
  });
});
