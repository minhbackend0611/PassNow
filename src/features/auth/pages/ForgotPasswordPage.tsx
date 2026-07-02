import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { OverlayLoader } from '../../../components/ui/Loading';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await sendPasswordResetEmail(auth, data.email);
      setSuccess('Password reset link sent! Please check your inbox.');
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message || 'Failed to send reset email');
      } else {
        setError('Failed to send reset email');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="fade-in relative rounded-inherit">
        {isLoading && <OverlayLoader message="Sending..." />}
        <div className="mb-stack-lg">
          <h2 className="text-headline-lg font-headline-lg text-on-surface mb-1">Reset Password</h2>
          <p className="text-body-sm font-body-sm text-on-surface-variant">Enter your email and we'll send you a link to reset your password.</p>
        </div>
        
        {error && (
          <div className="bg-error-container text-on-error-container p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-primary-container text-on-primary-container p-3 rounded-md text-sm mb-4">
            {success}
          </div>
        )}

        {!success && (
          <form className="space-y-stack-md" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-label-md font-label-md text-on-surface mb-stack-xs" htmlFor="forgot-email">Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-opacity-50">mail</span>
                <input 
                  id="forgot-email" 
                  className={`w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-black/10 backdrop-blur-sm border ${errors.email ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant/60 focus:border-primary focus:ring-primary/20'} rounded-xl focus:outline-none focus:ring-4 text-body-md font-medium transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]`} 
                  placeholder="student@university.edu" 
                  type="email"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-error text-sm mt-1">{errors.email.message}</p>}
            </div>

            <button 
              className="w-full py-3.5 px-4 bg-gradient-to-r from-primary to-secondary text-white text-label-lg font-bold rounded-xl hover:shadow-[0_8px_20px_rgba(0,166,126,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5 active:scale-95 mt-4" 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
              {!isLoading && <span className="material-symbols-outlined text-[18px]">send</span>}
            </button>
          </form>
        )}

        <div className="mt-stack-lg text-center">
          <p className="text-body-sm font-body-sm text-on-surface-variant">
            Remember your password?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline focus:outline-none">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
