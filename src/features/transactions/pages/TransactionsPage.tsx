import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
  getUserTransactions, 
  sellerConfirmTransaction, 
  buyerConfirmTransaction,
  cancelTransaction
} from '../../../services/transactionService';
import type { Transaction } from '../../../types';

export default function TransactionsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'buying' | 'selling'>('buying');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchTransactions = async () => {
    if (!user) return;
    setIsLoading(true);
    const txs = await getUserTransactions(user.uid);
    setTransactions(txs);
    setIsLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <h2 className="text-2xl font-bold mb-4">Please log in to view your transactions</h2>
        <button onClick={() => navigate('/login')} className="bg-primary text-on-primary px-4 py-2 rounded-lg">Login</button>
      </div>
    );
  }

  const handleCancel = async (tx: Transaction) => {
    if (window.confirm("Are you sure you want to cancel this request?")) {
      setProcessingId(tx.id);
      await cancelTransaction(tx.id, tx.listingId);
      await fetchTransactions();
      setProcessingId(null);
    }
  };

  const handleBuyerConfirm = async (tx: Transaction) => {
    if (window.confirm("Confirm you have received this item?")) {
      setProcessingId(tx.id);
      await buyerConfirmTransaction(tx.id, tx.listingId);
      await fetchTransactions();
      setProcessingId(null);
    }
  };

  const handleSellerConfirm = async (tx: Transaction) => {
    if (window.confirm("Confirm you have delivered this item?")) {
      setProcessingId(tx.id);
      await sellerConfirmTransaction(tx.id, tx.listingId);
      await fetchTransactions();
      setProcessingId(null);
    }
  };

  const buyingTxs = transactions.filter(t => t.buyerId === user.uid);
  const sellingTxs = transactions.filter(t => t.sellerId === user.uid);

  const displayTxs = activeTab === 'buying' ? buyingTxs : sellingTxs;

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter py-stack-lg pb-24 md:pb-stack-lg flex flex-col gap-stack-lg">
      <div className="flex justify-between items-end border-b border-outline-variant/30 pb-4">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-on-surface">My Transactions</h1>
          <p className="text-body-md font-body-md text-on-surface-variant">Manage your purchase requests and sales</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant w-full overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => setActiveTab('buying')}
          className={`flex-1 md:flex-none text-center px-gutter py-stack-sm text-label-md font-label-md transition-colors whitespace-nowrap border-b-2 ${
            activeTab === 'buying' 
              ? 'border-primary text-primary font-bold' 
              : 'border-transparent text-on-surface-variant hover:text-primary hover:border-outline-variant'
          }`}
        >
          Buying ({buyingTxs.length})
        </button>
        <button 
          onClick={() => setActiveTab('selling')}
          className={`flex-1 md:flex-none text-center px-gutter py-stack-sm text-label-md font-label-md transition-colors whitespace-nowrap border-b-2 ${
            activeTab === 'selling' 
              ? 'border-primary text-primary font-bold' 
              : 'border-transparent text-on-surface-variant hover:text-primary hover:border-outline-variant'
          }`}
        >
          Selling ({sellingTxs.length})
        </button>
      </div>

      {/* Transaction List */}
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : displayTxs.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-8 text-center border border-outline-variant/30">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4">receipt_long</span>
            <h3 className="text-title-lg font-title-lg text-on-surface mb-2">No transactions found</h3>
            <p className="text-body-md text-on-surface-variant">You don't have any {activeTab === 'buying' ? 'buying' : 'selling'} transactions yet.</p>
            <button onClick={() => navigate('/browse')} className="mt-4 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md">
              Browse Listings
            </button>
          </div>
        ) : (
          displayTxs.map(tx => {
            const isBuyer = tx.buyerId === user.uid;
            
            return (
              <div key={tx.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-stack-md p-stack-md bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-1 w-full md:w-auto flex-grow min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-label-sm font-label-sm px-2 py-1 rounded-full border ${
                      tx.status === 'completed' 
                        ? 'bg-primary-fixed-dim text-on-primary-fixed border-primary' 
                        : 'bg-secondary-container text-on-secondary-container border-transparent'
                    }`}>
                      {tx.status.toUpperCase()}
                    </span>
                    <span className="text-label-sm text-on-surface-variant">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 
                    onClick={() => navigate(`/listings/${tx.listingId}`)}
                    className="text-headline-md font-headline-md text-on-surface hover:text-primary cursor-pointer hover:underline mt-1 truncate"
                  >
                    {tx.listingTitle}
                  </h3>
                  <div className="text-body-sm text-on-surface-variant mt-1 flex flex-col gap-1">
                    <p>Status Details:</p>
                    <p className="flex items-center gap-1">
                      <span className={`material-symbols-outlined text-[16px] ${tx.sellerConfirmed ? 'text-primary' : 'text-on-surface-variant'}`}>
                        {tx.sellerConfirmed ? 'check_circle' : 'pending'}
                      </span>
                      Seller {tx.sellerConfirmed ? 'Confirmed Delivery' : 'Pending'}
                    </p>
                    <p className="flex items-center gap-1">
                      <span className={`material-symbols-outlined text-[16px] ${tx.buyerConfirmed ? 'text-primary' : 'text-on-surface-variant'}`}>
                        {tx.buyerConfirmed ? 'check_circle' : 'pending'}
                      </span>
                      Buyer {tx.buyerConfirmed ? 'Confirmed Receipt' : 'Pending'}
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-auto flex sm:flex-col gap-stack-sm shrink-0">
                  {tx.status === 'pending' && isBuyer && !tx.buyerConfirmed && (
                    <button 
                      onClick={() => handleBuyerConfirm(tx)}
                      disabled={processingId === tx.id}
                      className="flex-1 sm:flex-none px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-label-md hover:bg-on-primary-fixed-variant transition-colors text-center disabled:opacity-50"
                    >
                      Confirm Receipt
                    </button>
                  )}
                  
                  {tx.status === 'pending' && !isBuyer && !tx.sellerConfirmed && (
                    <button 
                      onClick={() => handleSellerConfirm(tx)}
                      disabled={processingId === tx.id}
                      className="flex-1 sm:flex-none px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-label-md hover:bg-on-primary-fixed-variant transition-colors text-center disabled:opacity-50"
                    >
                      Confirm Delivery
                    </button>
                  )}

                  {tx.status === 'pending' && isBuyer && (
                    <button 
                      onClick={() => handleCancel(tx)}
                      disabled={processingId === tx.id}
                      className="flex-1 sm:flex-none px-4 py-2 bg-surface-container-high text-on-surface rounded-lg text-label-md font-label-md hover:bg-error hover:text-on-error transition-colors text-center disabled:opacity-50"
                    >
                      Cancel Request
                    </button>
                  )}
                  
                  {tx.status === 'completed' && (
                    <button 
                      onClick={() => alert("Rating feature coming soon")}
                      className="flex-1 sm:flex-none px-4 py-2 bg-surface text-primary border border-primary rounded-lg text-label-md font-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors text-center"
                    >
                      Leave Review
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
