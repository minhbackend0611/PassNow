import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '../../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { useAuthStore } from '../../../store/useAuthStore';

const setupProfileSchema = z.object({
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  school: z.string().min(2, { message: 'School name is required' }),
  district: z.string().min(2, { message: 'District/Area is required' }),
});

type SetupProfileFormValues = z.infer<typeof setupProfileSchema>;

export default function SetupProfilePage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user: authUser, setUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupProfileFormValues>({
    resolver: zodResolver(setupProfileSchema),
    defaultValues: {
      displayName: authUser?.displayName || '',
      school: authUser?.school || '',
      district: authUser?.district || '',
    }
  });

  const onSubmit = async (data: SetupProfileFormValues) => {
    if (!auth.currentUser) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // 1. Update auth profile (displayName)
      await updateProfile(auth.currentUser, {
        displayName: data.displayName
      });

      // 2. Save additional data to Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, {
        displayName: data.displayName,
        school: data.school,
        district: data.district,
        email: auth.currentUser.email,
        createdAt: new Date().toISOString(),
      }, { merge: true });

      // 3. Update Zustand store
      setUser({
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: data.displayName,
        school: data.school,
        district: data.district,
        isProfileComplete: true,
      });

      // 4. Navigate to home
      navigate('/');
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message || 'Failed to save profile');
      } else {
        setError('Failed to save profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8 glass-panel p-8 rounded-2xl">
        <div className="text-center">
          <h2 className="font-headline-lg text-primary mb-2">Complete Your Profile</h2>
          <p className="text-on-surface-variant font-body-sm">Tell us a bit about yourself to get started</p>
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="John Doe"
              {...register('displayName')}
            />
            {errors.displayName && <p className="text-error text-sm">{errors.displayName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="school">School</Label>
            <Input
              id="school"
              placeholder="e.g. FPT University"
              {...register('school')}
            />
            {errors.school && <p className="text-error text-sm">{errors.school.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="district">District / Area</Label>
            <Input
              id="district"
              placeholder="e.g. District 9, HCMC"
              {...register('district')}
            />
            {errors.district && <p className="text-error text-sm">{errors.district.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Complete Setup'}
          </Button>
        </form>
      </div>
    </div>
  );
}
