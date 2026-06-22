import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { useAuthStore } from '../../../store/useAuthStore';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { OverlayLoader } from '../../../components/ui/Loading';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      // Let useEffect handle the redirect after AuthListener updates user
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message || 'Failed to login');
      } else {
        setError('Failed to login');
      }
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="fade-in relative rounded-inherit">
        {isLoading && <OverlayLoader message="Logging in..." />}
        <div className="mb-stack-lg">
          <h2 className="text-headline-lg font-headline-lg text-on-surface mb-1">Welcome back</h2>
          <p className="text-body-sm font-body-sm text-on-surface-variant">Please enter your details to log in.</p>
        </div>
        
        {error && (
          <div className="bg-error-container text-on-error-container p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        <form className="space-y-stack-md" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-label-md font-label-md text-on-surface mb-stack-xs" htmlFor="login-email">Email</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-opacity-50">mail</span>
              <input 
                id="login-email" 
                className={`w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-black/10 backdrop-blur-sm border ${errors.email ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant/60 focus:border-primary focus:ring-primary/20'} rounded-xl focus:outline-none focus:ring-4 text-body-md font-medium transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]`} 
                placeholder="student@university.edu" 
                type="email"
                {...register('email')}
              />
            </div>
            {errors.email && <p className="text-error text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-stack-xs">
              <label className="block text-label-md font-label-md text-on-surface" htmlFor="login-password">Password</label>
              <a className="text-label-sm font-label-sm text-primary hover:text-on-primary-fixed-variant transition-colors" href="#">Forgot Password?</a>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-opacity-50">lock</span>
              <input 
                id="login-password" 
                className={`w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-black/10 backdrop-blur-sm border ${errors.password ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant/60 focus:border-primary focus:ring-primary/20'} rounded-xl focus:outline-none focus:ring-4 text-body-md font-medium transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]`} 
                placeholder="••••••••" 
                type="password"
                {...register('password')}
              />
            </div>
            {errors.password && <p className="text-error text-sm mt-1">{errors.password.message}</p>}
          </div>

          <button 
            className="w-full py-3.5 px-4 bg-gradient-to-r from-primary to-secondary text-white text-label-lg font-bold rounded-xl hover:shadow-[0_8px_20px_rgba(0,166,126,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5 active:scale-95 mt-4" 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
            {!isLoading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
          </button>
        </form>

        <div className="mt-stack-lg text-center">
          <p className="text-body-sm font-body-sm text-on-surface-variant">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline focus:outline-none">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
