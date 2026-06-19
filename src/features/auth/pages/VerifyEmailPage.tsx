import { useState, useEffect } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { useAuthStore } from '../../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { Button } from '../../../components/ui/button';

export default function VerifyEmailPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Automatically poll Firebase to check if email was verified in another tab
    const interval = setInterval(async () => {
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          if (user) {
            setUser({
              ...user,
              emailVerified: true,
            });
          }
          navigate('/setup-profile');
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user, setUser, navigate]);

  const handleResendEmail = async () => {
    if (!auth.currentUser) return;
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await sendEmailVerification(auth.currentUser);
      setSuccess('Verification email sent! Please check your inbox.');
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message || 'Failed to resend email');
      } else {
        setError('Failed to resend email');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="fade-in text-center">
        <div className="mb-stack-lg flex flex-col items-center">
          <div className="w-16 h-16 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl">mark_email_unread</span>
          </div>
          <h2 className="text-headline-lg font-headline-lg text-on-surface mb-2">Verify your email</h2>
          <p className="text-body-md font-body-md text-on-surface-variant">
            We've sent a verification link to <br/>
            <span className="font-semibold text-on-surface">{user?.email}</span>
          </p>
        </div>
        
        {error && (
          <div className="bg-error-container text-on-error-container p-3 rounded-md text-sm mb-4 text-left">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-primary-container text-on-primary-container p-3 rounded-md text-sm mb-4 text-left">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-center mt-stack-md fade-in">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
          
          <p className="mt-stack-md text-body-sm font-body-sm text-on-surface-variant text-center">
            Waiting for verification...
          </p>
          
          <div className="mt-stack-lg pt-stack-md border-t border-outline-variant text-center">
            <p className="text-body-sm font-body-sm text-on-surface-variant mb-stack-sm">
              Didn't receive the email?
            </p>
            <Button 
              variant="outline" 
              onClick={handleResendEmail}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Resend Verification Email'}
            </Button>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
