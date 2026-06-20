import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { useAuthStore } from '../../../store/useAuthStore';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { OverlayLoader } from '../../../components/ui/Loading';

const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    // Only redirect if user is logged in
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await sendEmailVerification(userCredential.user);
      // Wait for AuthListener to trigger and redirect
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message || 'Failed to create an account');
      } else {
        setError('Failed to create an account');
      }
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="fade-in relative rounded-inherit">
        {isLoading && <OverlayLoader message="Registering..." />}
        <div className="mb-stack-lg">
          <h2 className="text-headline-lg font-headline-lg text-on-surface mb-1">Create an account</h2>
          <p className="text-body-sm font-body-sm text-on-surface-variant">Join the campus circular economy.</p>
        </div>
        
        {error && (
          <div className="bg-error-container text-on-error-container p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        <form className="space-y-stack-md" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-label-md font-label-md text-on-surface mb-stack-xs" htmlFor="reg-email">University Email</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-opacity-50">school</span>
              <input 
                id="reg-email" 
                className={`w-full pl-10 pr-4 py-2 bg-surface-container-lowest border ${errors.email ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'} rounded-lg focus:outline-none focus:ring-4 text-body-md font-body-md transition-all shadow-sm`} 
                placeholder="student@university.edu" 
                type="email"
                {...register('email')}
              />
            </div>
            {errors.email && <p className="text-error text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-label-md font-label-md text-on-surface mb-stack-xs" htmlFor="reg-password">Password</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-opacity-50">lock</span>
              <input 
                id="reg-password" 
                className={`w-full pl-10 pr-4 py-2 bg-surface-container-lowest border ${errors.password ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'} rounded-lg focus:outline-none focus:ring-4 text-body-md font-body-md transition-all shadow-sm`} 
                placeholder="Create a strong password" 
                type="password"
                {...register('password')}
              />
            </div>
            {errors.password && <p className="text-error text-sm mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-label-md font-label-md text-on-surface mb-stack-xs" htmlFor="reg-confirm-password">Confirm Password</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-opacity-50">lock_reset</span>
              <input 
                id="reg-confirm-password" 
                className={`w-full pl-10 pr-4 py-2 bg-surface-container-lowest border ${errors.confirmPassword ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'} rounded-lg focus:outline-none focus:ring-4 text-body-md font-body-md transition-all shadow-sm`} 
                placeholder="Repeat password" 
                type="password"
                {...register('confirmPassword')}
              />
            </div>
            {errors.confirmPassword && <p className="text-error text-sm mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button 
            className="w-full py-2.5 px-4 bg-primary text-on-primary text-label-md font-label-md rounded-lg hover:bg-on-primary-fixed-variant active:bg-primary-fixed-dim focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-sm flex items-center justify-center gap-2 mt-stack-md disabled:opacity-70 disabled:cursor-not-allowed" 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Registering...' : 'Register'}
            {!isLoading && <span className="material-symbols-outlined text-[18px]">person_add</span>}
          </button>
        </form>

        <div className="mt-stack-lg text-center">
          <p className="text-body-sm font-body-sm text-on-surface-variant">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline focus:outline-none">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
