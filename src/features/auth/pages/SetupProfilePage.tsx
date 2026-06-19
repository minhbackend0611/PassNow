import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '../../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { OverlayLoader } from '../../../components/ui/Loading';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { useAuthStore } from '../../../store/useAuthStore';

// Types for APIs
interface Province {
  code: number;
  name: string;
}

interface District {
  code: number;
  name: string;
  province_code: number;
}

interface University {
  name: string;
  domains: string[];
  web_pages: string[];
  country: string;
  alpha_two_code: string;
  "state-province": string | null;
}

const setupProfileSchema = z.object({
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  school: z.string().min(2, { message: 'School name is required' }),
  province: z.string().min(2, { message: 'Province/City is required' }),
  district: z.string().min(2, { message: 'District/Area is required' }),
});

type SetupProfileFormValues = z.infer<typeof setupProfileSchema>;

export default function SetupProfilePage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user: authUser, setUser } = useAuthStore();

  // Data states
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SetupProfileFormValues>({
    resolver: zodResolver(setupProfileSchema),
    defaultValues: {
      displayName: authUser?.displayName || '',
      school: authUser?.school || '',
      province: authUser?.province || '',
      district: authUser?.district || '',
    }
  });

  const selectedProvinceName = watch('province');

  // Fetch initial data
  useEffect(() => {
    // Fetch Provinces
    fetch('https://provinces.open-api.vn/api/p/')
      .then(res => res.json())
      .then((data: Province[]) => setProvinces(data))
      .catch(err => console.error("Failed to fetch provinces", err));

    // Fetch Universities (filter for Vietnam)
    fetch('https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json')
      .then(res => res.json())
      .then((data: University[]) => {
        const vnUnis = data.filter(u => u.country === "Viet Nam");
        setUniversities(vnUnis);
      })
      .catch(err => console.error("Failed to fetch universities", err));
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    if (selectedProvinceCode) {
      fetch(`https://provinces.open-api.vn/api/p/${selectedProvinceCode}?depth=2`)
        .then(res => res.json())
        .then(data => {
          const list = data.districts || [];
          setDistricts(list);
          
          const currentProv = watch('province');
          const currentDist = watch('district');
          
          if (currentProv === authUser?.province && authUser?.district) {
            if (list.some((d: District) => d.name === authUser.district)) {
              setValue('district', authUser.district);
            }
          } else if (currentDist && list.some((d: District) => d.name === currentDist)) {
            setValue('district', currentDist);
          }
        })
        .catch(err => console.error("Failed to fetch districts", err));
    } else {
      setDistricts([]);
    }
  }, [selectedProvinceCode, authUser, setValue, watch]);

  // Sync province code with province name selection
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pName = e.target.value;
    setValue('province', pName);
    setValue('district', ''); // Reset district when province changes
    
    const p = provinces.find(prov => prov.name === pName);
    if (p) {
      setSelectedProvinceCode(p.code.toString());
    } else {
      setSelectedProvinceCode('');
    }
  };

  const onSubmit = async (data: SetupProfileFormValues) => {
    if (!auth.currentUser) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await updateProfile(auth.currentUser, {
        displayName: data.displayName
      });

      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, {
        displayName: data.displayName,
        school: data.school,
        province: data.province,
        district: data.district,
        email: auth.currentUser.email,
        createdAt: new Date().toISOString(),
      }, { merge: true });

      if (authUser) {
        setUser({
          ...authUser,
          displayName: data.displayName,
          school: data.school,
          province: data.province,
          district: data.district,
          isProfileComplete: true,
        });
      }

      navigate('/');
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message || 'Failed to save profile');
      } else {
        setError('Failed to save profile');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8 glass-panel p-8 rounded-2xl relative">
        {isLoading && <OverlayLoader message="Saving Profile..." />}
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
            <Label htmlFor="displayName">Display Name <span className="text-error">*</span></Label>
            <input
              id="displayName"
              className={`flex h-10 w-full rounded-md border ${errors.displayName ? 'border-error focus:border-error' : 'border-outline-variant focus:border-on-surface'} bg-surface-container-lowest px-3 py-2 text-sm focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50`}
              placeholder="John Doe"
              {...register('displayName')}
            />
            {errors.displayName && <p className="text-error text-sm">{errors.displayName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="school">School / University <span className="text-error">*</span></Label>
            <select
              id="school"
              className={`flex h-10 w-full rounded-md border ${errors.school ? 'border-error focus:border-error' : 'border-outline-variant focus:border-on-surface'} bg-surface-container-lowest px-3 py-2 text-sm focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50`}
              {...register('school')}
              value={watch('school') || ""}
            >
              <option value="" disabled>Select your University</option>
              <option value="Not a student / Khác" className="font-semibold text-primary">Not a student / Khác</option>
              {universities.map((uni, idx) => (
                <option key={idx} value={uni.name}>{uni.name}</option>
              ))}
            </select>
            {errors.school && <p className="text-error text-sm">{errors.school.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="province">Province / City <span className="text-error">*</span></Label>
              <select
                id="province"
                className={`flex h-10 w-full rounded-md border ${errors.province ? 'border-error focus:border-error' : 'border-outline-variant focus:border-on-surface'} bg-surface-container-lowest px-3 py-2 text-sm focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50`}
                value={selectedProvinceName}
                onChange={handleProvinceChange}
              >
                <option value="" disabled>Select Province</option>
                {provinces.map((prov) => (
                  <option key={prov.code} value={prov.name}>{prov.name}</option>
                ))}
              </select>
              {errors.province && <p className="text-error text-sm">{errors.province.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">District / Area <span className="text-error">*</span></Label>
              <select
                id="district"
                className={`flex h-10 w-full rounded-md border ${errors.district ? 'border-error focus:border-error' : 'border-outline-variant focus:border-on-surface'} bg-surface-container-lowest px-3 py-2 text-sm focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50`}
                {...register('district')}
                disabled={!selectedProvinceName || districts.length === 0}
              >
                <option value="" disabled>Select District</option>
                {districts.map((dist) => (
                  <option key={dist.code} value={dist.name}>{dist.name}</option>
                ))}
              </select>
              {errors.district && <p className="text-error text-sm">{errors.district.message}</p>}
            </div>
          </div>

          <Button type="submit" className="w-full mt-8" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Complete Setup'}
          </Button>
        </form>
      </div>
    </div>
  );
}
