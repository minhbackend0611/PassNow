import { create } from 'zustand';
import type { Transaction } from '../types';
import { subscribeToUserTransactions } from '../services/transactionService';

interface TransactionState {
  actionRequiredCount: number;
  buyingActionRequiredCount: number;
  sellingActionRequiredCount: number;
  transactions: Transaction[];
  initializeTransactionListener: (userId: string) => () => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  actionRequiredCount: 0,
  buyingActionRequiredCount: 0,
  sellingActionRequiredCount: 0,
  transactions: [],
  initializeTransactionListener: (userId: string) => {
    return subscribeToUserTransactions(userId, (transactions) => {
      let buyingCount = 0;
      let sellingCount = 0;
      transactions.forEach(tx => {
        if (tx.status === 'pending') {
          if (tx.buyerId === userId && tx.sellerConfirmed && !tx.buyerConfirmed) buyingCount++;
          if (tx.sellerId === userId && !tx.sellerConfirmed) sellingCount++;
        }
      });
      set({ 
        transactions, 
        buyingActionRequiredCount: buyingCount,
        sellingActionRequiredCount: sellingCount,
        actionRequiredCount: buyingCount + sellingCount 
      });
    });
  },
}));
