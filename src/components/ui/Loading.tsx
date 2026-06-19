import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4'
  };
  
  return (
    <div className={`animate-spin rounded-full border-b-primary border-t-transparent border-l-transparent border-r-transparent ${sizeClasses[size]} ${className}`}></div>
  );
};

interface LoaderProps {
  message?: string;
}

export const FullScreenLoader: React.FC<LoaderProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface/80 backdrop-blur-sm fade-in">
      <Spinner size="lg" className="mb-4" />
      <p className="text-on-surface font-medium animate-pulse">{message}</p>
    </div>
  );
};

export const PageLoader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col h-[50vh] w-full items-center justify-center fade-in">
      <Spinner size="lg" className="mb-4" />
      {message && <p className="text-on-surface-variant font-medium">{message}</p>}
    </div>
  );
};

export const OverlayLoader: React.FC<LoaderProps> = ({ message = 'Processing...' }) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-surface/70 backdrop-blur-[2px] rounded-inherit fade-in">
      <Spinner size="md" className="mb-3" />
      <p className="text-on-surface font-medium text-sm">{message}</p>
    </div>
  );
};
