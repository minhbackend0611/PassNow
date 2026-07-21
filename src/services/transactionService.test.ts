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
import { sendSystemMessage } from './chatService';
import * as transactionService from './transactionService';
import type { Transaction } from '../types';

const mocks = vi.hoisted(() => ({
  auth: { currentUser: { uid: 'seller-1' } as { uid: string } | null },
}));

vi.mock('../lib/firebase', () => ({ auth: mocks.auth, db: {} }));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  runTransaction: vi.fn(),
  where: vi.fn(),
  writeBatch: vi.fn(),
}));
vi.mock('./chatService', () => ({
  sendSystemMessage: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('./emailService', () => ({
  sendSellerConfirmedEmail: vi.fn().mockResolvedValue(true),
  sendTransactionCancelledEmail: vi.fn().mockResolvedValue(true),
  sendTransactionCompletedEmail: vi.fn().mockResolvedValue(true),
  sendTransactionRequestedEmail: vi.fn().mockResolvedValue(true),
}));
vi.mock('./userService', () => ({
  getUserById: vi.fn().mockResolvedValue({ displayName: 'Seller' }),
}));

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

const createSnapshot = (
  data?: DocumentData,
): DocumentSnapshot<DocumentData> =>
  ({
    exists: () => data !== undefined,
    data: () => data,
  }) as unknown as DocumentSnapshot<DocumentData>;

const mockTransactionExecution = (
  snapshots: DocumentSnapshot<DocumentData>[],
) => {
  const get = vi.fn();
  snapshots.forEach((snapshot) => get.mockResolvedValueOnce(snapshot));
  const update = vi.fn();
  const firestoreTransaction = {
    get,
    update,
  } as unknown as FirestoreTransaction;

  vi.mocked(runTransaction).mockImplementationOnce(
    async (_db, updateFunction) => updateFunction(firestoreTransaction),
  );

  return { get, update };
};

describe('sellerConfirmTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.currentUser = { uid: 'seller-1' };
    vi.mocked(getDocs).mockResolvedValue({
      docs: [],
      empty: true,
    } as unknown as Awaited<ReturnType<typeof getDocs>>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('completes the transaction and increments inventory exactly once', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1234);
    const transactionRef = {
      path: 'transactions/transaction-1',
    } as unknown as DocumentReference<DocumentData>;
    const listingRef = {
      path: 'listings/listing-1',
    } as unknown as DocumentReference<DocumentData>;
    vi.mocked(doc)
      .mockReturnValueOnce(transactionRef)
      .mockReturnValueOnce(listingRef);
    const firestoreTransaction = mockTransactionExecution([
      createSnapshot(createTransaction()),
      createSnapshot({ completedCount: 0, quantity: 2, status: 'available' }),
    ]);

    await expect(
      transactionService.sellerConfirmTransaction('transaction-1'),
    ).resolves.toBe(true);

    expect(firestoreTransaction.update).toHaveBeenCalledTimes(2);
    expect(firestoreTransaction.update).toHaveBeenNthCalledWith(
      1,
      transactionRef,
      {
        sellerConfirmed: true,
        status: 'completed',
        completedAt: 1234,
      },
    );
    expect(firestoreTransaction.update).toHaveBeenNthCalledWith(
      2,
      listingRef,
      { completedCount: 1 },
    );
    expect(sendSystemMessage).toHaveBeenCalledOnce();
  });

  it('is idempotent when the transaction is already completed', async () => {
    const transactionRef = {
      path: 'transactions/transaction-1',
    } as unknown as DocumentReference<DocumentData>;
    const listingRef = {
      path: 'listings/listing-1',
    } as unknown as DocumentReference<DocumentData>;
    vi.mocked(doc)
      .mockReturnValueOnce(transactionRef)
      .mockReturnValueOnce(listingRef);
    const firestoreTransaction = mockTransactionExecution([
      createSnapshot(
        createTransaction({
          sellerConfirmed: true,
          status: 'completed',
          completedAt: 1234,
        }),
      ),
      createSnapshot({ completedCount: 1, quantity: 2, status: 'available' }),
    ]);

    await expect(
      transactionService.sellerConfirmTransaction('transaction-1'),
    ).resolves.toBe(true);

    expect(firestoreTransaction.get).toHaveBeenCalledTimes(2);
    expect(firestoreTransaction.update).not.toHaveBeenCalled();
    expect(sendSystemMessage).not.toHaveBeenCalled();
  });

  it('does not expose the removed buyer confirmation action', () => {
    expect(transactionService).not.toHaveProperty('buyerConfirmTransaction');
  });
});

describe('requestTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.currentUser = { uid: 'buyer-1' };
    vi.mocked(getDocs).mockResolvedValue({
      docs: [],
      empty: true,
    } as unknown as Awaited<ReturnType<typeof getDocs>>);
  });

  it('does not create a request after the listing sells out', async () => {
    const transactionRef = {
      path: 'transactions/listing-1_buyer-1',
    } as unknown as DocumentReference<DocumentData>;
    const listingRef = {
      path: 'listings/listing-1',
    } as unknown as DocumentReference<DocumentData>;
    vi.mocked(doc)
      .mockReturnValueOnce(transactionRef)
      .mockReturnValueOnce(listingRef);

    const get = vi
      .fn()
      .mockResolvedValueOnce(createSnapshot({
        id: 'listing-1',
        title: 'Laptop',
        sellerId: 'seller-1',
        status: 'completed',
        completedCount: 1,
        quantity: 1,
      }))
      .mockResolvedValueOnce(createSnapshot());
    const set = vi.fn();
    const firestoreTransaction = {
      get,
      set,
    } as unknown as FirestoreTransaction;
    vi.mocked(runTransaction).mockImplementationOnce(
      async (_db, updateFunction) => updateFunction(firestoreTransaction),
    );

    await expect(transactionService.requestTransaction(
      'listing-1',
      'Laptop',
      'seller-1',
      'buyer-1',
    )).resolves.toBeNull();

    expect(set).not.toHaveBeenCalled();
  });
});
