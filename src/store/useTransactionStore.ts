import { create } from 'zustand';
import type { Transaction } from '../types';
import { subscribeToUserTransactions } from '../services/transactionService';

export interface TransactionState {
  actionRequiredCount: number;
  buyingActionRequiredCount: number;
  sellingActionRequiredCount: number;
  transactions: Transaction[];
  initializeTransactionListener: (userId: string) => () => void;
}

export const calculateTransactionActionCounts = (
  transactions: Transaction[],
  userId: string,
) => {
  const sellingActionRequiredCount = transactions.filter(
    (transaction) =>
      transaction.status === 'pending' &&
      transaction.sellerId === userId &&
      !transaction.sellerConfirmed,
  ).length;

  return {
    actionRequiredCount: sellingActionRequiredCount,
    buyingActionRequiredCount: 0,
    sellingActionRequiredCount,
  };
};

export const useTransactionStore = create<TransactionState>((set) => ({
  actionRequiredCount: 0,
  buyingActionRequiredCount: 0,
  sellingActionRequiredCount: 0,
  transactions: [],
  initializeTransactionListener: (userId: string) => {
    return subscribeToUserTransactions(userId, (transactions) => {
      const actionCounts = calculateTransactionActionCounts(transactions, userId);

      set({ 
        transactions,
        ...actionCounts,
      });
    });
  },
}));
