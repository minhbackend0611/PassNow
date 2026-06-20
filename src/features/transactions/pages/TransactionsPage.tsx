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
      <div className="flex gap-4 border-b border-outline-variant/30">
        <button 
          onClick={() => setActiveTab('buying')}
          className={`pb-2 px-1 font-label-lg text-label-lg transition-colors border-b-2 ${
            activeTab === 'buying' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Buying / Requests ({buyingTxs.length})
        </button>
        <button 
          onClick={() => setActiveTab('selling')}
          className={`pb-2 px-1 font-label-lg text-label-lg transition-colors border-b-2 ${
            activeTab === 'selling' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Selling / Giving ({sellingTxs.length})
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
              <div key={tx.id} className="bg-surface-container-lowest rounded-xl p-4 md:p-6 shadow-[0_2px_4px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex flex-col gap-1 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <span className={`text-label-sm font-label-sm px-2 py-1 rounded-full border ${
                      tx.status === 'completed' 
                        ? 'bg-primary/10 text-primary border-primary/20' 
                        : 'bg-secondary/10 text-secondary border-secondary/20'
                    }`}>
                      {tx.status.toUpperCase()}
                    </span>
                    <span className="text-label-sm text-on-surface-variant">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 
                    onClick={() => navigate(`/listings/${tx.listingId}`)}
                    className="text-title-md font-title-md text-on-surface hover:text-primary cursor-pointer hover:underline mt-1"
                  >
                    {tx.listingTitle}
                  </h3>
                  <div className="text-body-sm text-on-surface-variant mt-2 flex flex-col gap-1">
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

                <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto justify-end">
                  {tx.status === 'pending' && isBuyer && !tx.buyerConfirmed && (
                    <button 
                      onClick={() => handleBuyerConfirm(tx)}
                      disabled={processingId === tx.id}
                      className="flex-1 md:flex-none bg-primary text-on-primary text-label-md px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                      Confirm Receipt
                    </button>
                  )}
                  
                  {tx.status === 'pending' && !isBuyer && !tx.sellerConfirmed && (
                    <button 
                      onClick={() => handleSellerConfirm(tx)}
                      disabled={processingId === tx.id}
                      className="flex-1 md:flex-none bg-primary text-on-primary text-label-md px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                      Confirm Delivery
                    </button>
                  )}

                  {tx.status === 'pending' && isBuyer && (
                    <button 
                      onClick={() => handleCancel(tx)}
                      disabled={processingId === tx.id}
                      className="flex-1 md:flex-none border border-error text-error text-label-md px-4 py-2 rounded-lg hover:bg-error/5 disabled:opacity-50"
                    >
                      Cancel Request
                    </button>
                  )}
                  
                  {tx.status === 'completed' && (
                    <button 
                      onClick={() => alert("Rating feature coming soon")}
                      className="flex-1 md:flex-none border border-primary text-primary text-label-md px-4 py-2 rounded-lg hover:bg-primary/5"
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
