import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '../../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { OverlayLoader } from '../../../components/ui/Loading';
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
          setDistricts(data.districts || []);
        })
        .catch(err => console.error("Failed to fetch districts", err));
    } else {
      setDistricts([]);
    }
  }, [selectedProvinceCode]);

  useEffect(() => {
    if (districts.length > 0) {
      const currentProv = watch('province');
      const currentDist = watch('district');
      
      if (currentProv === authUser?.province && authUser?.district) {
        if (districts.some((d) => d.name === authUser.district)) {
          setValue('district', authUser.district);
        }
      } else if (currentDist && districts.some((d) => d.name === currentDist)) {
        setValue('district', currentDist);
      }
    }
  }, [districts, authUser, setValue, watch]);

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
    <div className="bg-surface-container-lowest text-on-surface font-body-md min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Abstract Animated Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-br from-primary/5 via-surface to-secondary/10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary/20 blur-[120px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-tertiary/15 blur-[80px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '5s' }}></div>
      </div>
      
      <div className="w-full max-w-lg space-y-8 glass-panel p-8 rounded-2xl relative z-10">
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
              className={`w-full pl-4 pr-4 py-3 bg-white/50 dark:bg-black/10 backdrop-blur-sm border ${errors.displayName ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant/60 focus:border-primary focus:ring-primary/20'} rounded-xl focus:outline-none focus:ring-4 text-body-md font-medium transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] disabled:cursor-not-allowed disabled:opacity-50`}
              placeholder="John Doe"
              {...register('displayName')}
            />
            {errors.displayName && <p className="text-error text-sm">{errors.displayName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="school">School / University <span className="text-error">*</span></Label>
            <select
              id="school"
              className={`w-full pl-4 pr-4 py-3 bg-white/50 dark:bg-black/10 backdrop-blur-sm border ${errors.school ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant/60 focus:border-primary focus:ring-primary/20'} rounded-xl focus:outline-none focus:ring-4 text-body-md font-medium transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] disabled:cursor-not-allowed disabled:opacity-50 appearance-none`}
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
              <Label htmlFor="province">Contact Province / City <span className="text-error">*</span></Label>
              <select
                id="province"
                className={`w-full pl-4 pr-4 py-3 bg-white/50 dark:bg-black/10 backdrop-blur-sm border ${errors.province ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant/60 focus:border-primary focus:ring-primary/20'} rounded-xl focus:outline-none focus:ring-4 text-body-md font-medium transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] disabled:cursor-not-allowed disabled:opacity-50 appearance-none`}
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
              <Label htmlFor="district">Contact District / Area <span className="text-error">*</span></Label>
              <select
                id="district"
                className={`w-full pl-4 pr-4 py-3 bg-white/50 dark:bg-black/10 backdrop-blur-sm border ${errors.district ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant/60 focus:border-primary focus:ring-primary/20'} rounded-xl focus:outline-none focus:ring-4 text-body-md font-medium transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] disabled:cursor-not-allowed disabled:opacity-50 appearance-none`}
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

          <button 
            type="submit" 
            className="w-full py-3.5 px-4 bg-gradient-to-r from-primary to-secondary text-white text-label-lg font-bold rounded-xl hover:shadow-[0_8px_20px_rgba(0,166,126,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5 active:scale-95 mt-8"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}
