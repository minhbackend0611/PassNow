import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '../../../lib/firebase';
import { useAuthStore } from '../../../store/useAuthStore';

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
  country: string;
}

const profileSchema = z.object({
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  school: z.string().min(2, { message: 'School name is required' }),
  province: z.string().min(2, { message: 'Province/City is required' }),
  district: z.string().min(2, { message: 'District/Area is required' }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user: authUser, setUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    formState: { errors, isDirty },
    reset
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: authUser?.displayName || '',
      school: authUser?.school || '',
      province: authUser?.province || '',
      district: authUser?.district || '',
    }
  });

  const selectedProvinceName = watch('province');

  useEffect(() => {
    // Reset form when authUser changes
    reset({
      displayName: authUser?.displayName || '',
      school: authUser?.school || '',
      province: authUser?.province || '',
      district: authUser?.district || '',
    });
  }, [authUser, reset]);

  // Fetch initial data
  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/p/')
      .then(res => res.json())
      .then((data: Province[]) => setProvinces(data))
      .catch(err => console.error("Failed to fetch provinces", err));

    fetch('https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json')
      .then(res => res.json())
      .then((data: University[]) => {
        const vnUnis = data.filter(u => u.country === "Viet Nam");
        setUniversities(vnUnis);
      })
      .catch(err => console.error("Failed to fetch universities", err));
  }, []);

  // Fetch districts when province changes or initializes
  useEffect(() => {
    if (selectedProvinceName && provinces.length > 0) {
      const p = provinces.find(prov => prov.name === selectedProvinceName);
      if (p) {
        setSelectedProvinceCode(p.code.toString());
      }
    }
  }, [selectedProvinceName, provinces]);

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
          setValue('district', authUser.district, { shouldDirty: false });
        }
      } else if (currentDist && districts.some((d) => d.name === currentDist)) {
        setValue('district', currentDist);
      }
    }
  }, [districts, authUser, setValue, watch]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pName = e.target.value;
    setValue('province', pName, { shouldDirty: true });
    setValue('district', '', { shouldDirty: true }); // Reset district
    
    const p = provinces.find(prov => prov.name === pName);
    if (p) {
      setSelectedProvinceCode(p.code.toString());
    } else {
      setSelectedProvinceCode('');
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!auth.currentUser) return;
    
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (data.displayName !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, {
          displayName: data.displayName
        });
      }

      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, {
        displayName: data.displayName,
        school: data.school,
        province: data.province,
        district: data.district,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      setUser({
        ...authUser!,
        displayName: data.displayName,
        school: data.school,
        province: data.province,
        district: data.district,
        isProfileComplete: true,
      });

      setSuccessMsg("Profile updated successfully!");
      reset({}, { keepValues: true }); // Reset isDirty state
      
      setTimeout(() => setSuccessMsg(null), 3000);
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
    <div className="flex-1 flex w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter py-stack-lg gap-gutter">
      {/* Sidebar Navigation (Settings specific) */}
      <aside className="hidden md:flex flex-col w-64 flex-shrink-0 gap-stack-sm">
        <h2 className="text-headline-md font-headline-md text-on-surface mb-stack-sm px-stack-sm">Settings</h2>
        <nav className="flex flex-col gap-1">
          <a className="flex items-center gap-stack-sm bg-primary-container text-on-primary-container rounded-lg p-stack-sm transition-opacity" href="#">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            <span className="text-label-md font-label-md">Account Settings</span>
          </a>
          <a className="flex items-center gap-stack-sm text-on-surface-variant p-stack-sm hover:bg-surface-container-high transition-all rounded-lg" href="#">
            <span className="material-symbols-outlined">security</span>
            <span className="text-label-md font-label-md">Security</span>
          </a>
          <a className="flex items-center gap-stack-sm text-on-surface-variant p-stack-sm hover:bg-surface-container-high transition-all rounded-lg" href="#">
            <span className="material-symbols-outlined">notifications</span>
            <span className="text-label-md font-label-md">Notifications</span>
          </a>
        </nav>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 max-w-3xl">
        <div className="mb-stack-lg">
          <h1 className="text-headline-xl-mobile md:text-headline-xl font-headline-xl-mobile md:font-headline-xl mb-stack-xs">Account Settings</h1>
          <p className="text-body-md font-body-md text-on-surface-variant">Manage your profile information and verified credentials.</p>
        </div>

        {error && (
          <div className="mb-4 bg-error-container text-on-error-container p-4 rounded-lg text-sm">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 bg-primary-container text-on-primary-container p-4 rounded-lg text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {successMsg}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-[0_2px_4px_rgba(0,0,0,0.04)] border border-outline-variant p-stack-lg mb-stack-lg">
          <h3 className="text-headline-md font-headline-md mb-stack-md border-b border-outline-variant pb-stack-sm">Public Profile</h3>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col md:flex-row gap-stack-lg items-start">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-stack-sm flex-shrink-0">
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-primary-container relative group cursor-pointer bg-surface-container-high flex items-center justify-center">
                  {authUser?.photoURL ? (
                    <img className="w-full h-full object-cover" alt="Avatar" src={authUser.photoURL} />
                  ) : (
                    <span className="text-4xl text-on-surface-variant">{authUser?.displayName?.charAt(0)?.toUpperCase() || 'U'}</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-white">photo_camera</span>
                  </div>
                </div>
                <button type="button" className="text-label-sm font-label-sm text-primary hover:underline">Change Picture</button>
              </div>

              {/* Form Fields */}
              <div className="flex-1 w-full space-y-stack-md">
                <div>
                  <label htmlFor="displayName" className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Display Name</label>
                  <input 
                    id="displayName"
                    className={`w-full bg-surface rounded-lg border ${errors.displayName ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'} px-3 py-2 text-body-md font-body-md focus:outline-none focus:ring-4 transition-all shadow-sm`} 
                    type="text" 
                    {...register('displayName')}
                  />
                  {errors.displayName && <p className="text-error text-sm mt-1">{errors.displayName.message}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Email Address</label>
                  <div className="flex gap-2">
                    <input 
                      id="email"
                      className="w-full bg-surface-container-low text-on-surface-variant rounded-lg border border-outline-variant px-3 py-2 text-body-md font-body-md cursor-not-allowed" 
                      disabled 
                      type="email" 
                      value={authUser?.email || ''}
                    />
                    <button type="button" className="text-primary text-label-sm font-label-sm whitespace-nowrap hover:underline px-2">Change</button>
                  </div>
                </div>

                <div>
                  <label htmlFor="school" className="block text-label-sm font-label-sm text-on-surface-variant mb-1">University / School</label>
                  <div className="relative">
                    <select 
                      id="school"
                      className={`w-full bg-surface rounded-lg border ${errors.school ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'} px-3 py-2 text-body-md font-body-md focus:outline-none focus:ring-4 transition-all shadow-sm pl-10 appearance-none`}
                      {...register('school')}
                      value={watch('school') || ""}
                    >
                      <option value="" disabled>Select your University</option>
                      <option value="Not a student / Khác" className="font-semibold text-primary">Not a student / Khác</option>
                      {universities.map((uni, idx) => (
                        <option key={idx} value={uni.name}>{uni.name}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px] pointer-events-none">school</span>
                    <span className="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant text-[20px] pointer-events-none">expand_more</span>
                  </div>
                  {errors.school && <p className="text-error text-sm mt-1">{errors.school.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                  <div>
                    <label htmlFor="province" className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Province / City</label>
                    <div className="relative">
                      <select 
                        id="province"
                        className={`w-full bg-surface rounded-lg border ${errors.province ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'} px-3 py-2 text-body-md font-body-md focus:outline-none focus:ring-4 transition-all shadow-sm pl-10 appearance-none`}
                        value={selectedProvinceName}
                        onChange={handleProvinceChange}
                      >
                        <option value="" disabled>Select Province</option>
                        {provinces.map((prov) => (
                          <option key={prov.code} value={prov.name}>{prov.name}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px] pointer-events-none">map</span>
                      <span className="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant text-[20px] pointer-events-none">expand_more</span>
                    </div>
                    {errors.province && <p className="text-error text-sm mt-1">{errors.province.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="district" className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Campus District</label>
                    <div className="relative">
                      <select 
                        id="district"
                        className={`w-full bg-surface rounded-lg border ${errors.district ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'} px-3 py-2 text-body-md font-body-md focus:outline-none focus:ring-4 transition-all shadow-sm pl-10 appearance-none`}
                        {...register('district')}
                        disabled={!selectedProvinceName || districts.length === 0}
                      >
                        <option value="" disabled>Select District</option>
                        {districts.map((dist) => (
                          <option key={dist.code} value={dist.name}>{dist.name}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px] pointer-events-none">location_on</span>
                      <span className="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant text-[20px] pointer-events-none">expand_more</span>
                    </div>
                    {errors.district && <p className="text-error text-sm mt-1">{errors.district.message}</p>}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-stack-md pt-stack-sm">
                  <button 
                    type="button" 
                    onClick={() => reset()}
                    disabled={!isDirty || isLoading}
                    className="px-6 py-2 rounded-lg text-label-md font-label-md text-on-surface-variant border border-outline-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={!isDirty || isLoading}
                    className="px-6 py-2 rounded-lg text-label-md font-label-md bg-primary text-on-primary shadow-sm hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      'Saving...'
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Linked Accounts / Verification */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-[0_2px_4px_rgba(0,0,0,0.04)] border border-outline-variant p-stack-lg mb-stack-lg">
          <h3 className="text-headline-md font-headline-md mb-stack-md border-b border-outline-variant pb-stack-sm">Verified Credentials</h3>
          <div className="space-y-stack-md">
            <div className="flex items-center justify-between p-stack-md bg-surface-container rounded-lg border border-outline-variant">
              <div className="flex items-center gap-stack-md">
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined">verified_user</span>
                </div>
                <div>
                  <h4 className="text-label-md font-label-md text-on-surface">Student Status</h4>
                  <p className="text-label-sm font-label-sm text-on-surface-variant">Verified via {authUser?.email}</p>
                </div>
              </div>
              <span className="text-primary text-label-sm font-label-sm flex items-center gap-1 bg-surface-container-high px-2 py-1 rounded-full border border-primary/20">
                <span className="material-symbols-outlined text-[16px]">check_circle</span> Verified
              </span>
            </div>

            <div className="flex items-center justify-between p-stack-md bg-surface-container rounded-lg border border-outline-variant">
              <div className="flex items-center gap-stack-md">
                <div className="w-10 h-10 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center">
                  <span className="material-symbols-outlined">phone_iphone</span>
                </div>
                <div>
                  <h4 className="text-label-md font-label-md text-on-surface">Phone Number</h4>
                  <p className="text-label-sm font-label-sm text-on-surface-variant">Add a number for SMS alerts</p>
                </div>
              </div>
              <button className="text-on-surface-variant text-label-sm font-label-sm hover:text-primary transition-colors">Connect</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
