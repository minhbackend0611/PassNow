import { useEffect, useState } from 'react';
import { useToastStore, type Toast } from '../../store/useToastStore';

const ToastItem = ({ toast }: { toast: Toast }) => {
  const { removeToast } = useToastStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to trigger the enter animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => removeToast(toast.id), 300); // Wait for exit animation
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <span className="material-symbols-outlined text-primary">check_circle</span>;
      case 'error':
        return <span className="material-symbols-outlined text-error">error</span>;
      default:
        return <span className="material-symbols-outlined text-secondary">info</span>;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-primary/30 bg-primary/5';
      case 'error':
        return 'border-error/30 bg-error/5';
      default:
        return 'border-secondary/30 bg-secondary/5';
    }
  };

  return (
    <div
      onClick={() => {
        if (toast.onClick) {
          toast.onClick();
          handleClose();
        }
      }}
      className={`pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border backdrop-blur-xl shadow-lg transition-all duration-300 ease-out transform ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95'
      } ${getBorderColor()} ${toast.onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''}`}
    >
      <div className="p-4 flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 w-0">
          <p className="text-body-md font-body-md text-on-surface">{toast.message}</p>
        </div>
        <div className="flex-shrink-0 flex">
          <button
            onClick={handleClose}
            className="rounded-full inline-flex text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 p-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const ToastContainer = () => {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 z-[200] flex px-4 py-6 pointer-events-none items-start sm:p-6"
    >
      <div className="flex w-full flex-col items-center space-y-3">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </div>
  );
};
