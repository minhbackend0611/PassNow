import { useEffect } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false,
  isLoading = false,
}: ConfirmModalProps) => {
  
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={() => !isLoading && onCancel()}
      ></div>
      <div className="relative bg-surface rounded-[32px] p-6 max-w-sm w-full shadow-[0_20px_40px_rgba(0,0,0,0.2)] animate-fade-in border border-outline-variant/30 flex flex-col gap-6">
        
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mt-2 ${isDestructive ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
          <span className="material-symbols-outlined text-[32px]">
            {isDestructive ? 'delete_forever' : 'help_outline'}
          </span>
        </div>
        
        <div className="text-center">
          <h3 className="text-headline-sm font-bold text-on-surface mb-2">{title}</h3>
          <p className="text-body-md text-on-surface-variant whitespace-pre-wrap">{message}</p>
        </div>

        <div className="flex gap-3 w-full">
          <button 
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3.5 rounded-xl font-label-lg font-bold text-on-surface-variant bg-surface-container hover:bg-surface-variant transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3.5 rounded-xl font-label-lg font-bold flex justify-center items-center gap-2 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:transform-none ${
              isDestructive 
                ? 'bg-error text-white shadow-[0_4px_14px_rgba(186,26,26,0.3)] hover:shadow-[0_8px_25px_rgba(186,26,26,0.5)]' 
                : 'bg-primary text-on-primary shadow-[0_4px_14px_rgba(0,166,126,0.3)] hover:shadow-[0_8px_25px_rgba(0,166,126,0.5)]'
            }`}
          >
            {isLoading ? (
              <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
            ) : null}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
