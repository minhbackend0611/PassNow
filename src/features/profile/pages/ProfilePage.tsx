import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '../../../lib/firebase';
import { useAuthStore } from '../../../store/useAuthStore';
import { CustomSelect } from '../../../components/ui/CustomSelect';

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

  const handleProvinceChange = (pName: string) => {
    setValue('province', pName, { shouldDirty: true, shouldValidate: true });
    setValue('district', '', { shouldDirty: true, shouldValidate: true }); // Reset district
    
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
    <div className="flex-1 flex w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter py-stack-lg gap-gutter relative">
      {/* Animated abstract background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[40%] rounded-full bg-secondary/10 blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
      </div>
      {/* Sidebar Navigation (Settings specific) */}
      <aside className="hidden md:flex flex-col w-64 flex-shrink-0 gap-stack-sm">
        <h2 className="text-headline-md font-headline-md text-on-surface mb-stack-sm px-stack-sm">Settings</h2>
        <nav className="flex flex-col gap-2 glass-panel p-3 rounded-[32px]">
          <a className="flex items-center gap-stack-sm bg-gradient-to-r from-primary/10 to-primary/5 text-primary rounded-2xl p-stack-sm transition-all duration-300 shadow-sm font-semibold hover:-translate-y-0.5 hover:shadow-md" href="#">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            <span className="text-label-md font-label-md">Account Settings</span>
          </a>
          <a className="flex items-center gap-stack-sm text-on-surface-variant p-stack-sm hover:bg-surface-container hover:text-primary transition-all duration-300 rounded-2xl hover:translate-x-1" href="#">
            <span className="material-symbols-outlined">security</span>
            <span className="text-label-md font-label-md">Security</span>
          </a>
          <a className="flex items-center gap-stack-sm text-on-surface-variant p-stack-sm hover:bg-surface-container hover:text-primary transition-all duration-300 rounded-2xl hover:translate-x-1" href="#">
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
        <div className="glass-panel p-stack-lg mb-stack-lg rounded-[32px] hover:shadow-lg transition-all duration-500 border border-white/20 dark:border-white/5 bg-gradient-to-br from-surface-container-low/80 to-primary/5">
          <h3 className="text-headline-md font-headline-md mb-stack-md border-b border-outline-variant/50 pb-stack-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">badge</span>
            Public Profile
          </h3>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col md:flex-row gap-stack-lg items-start">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-stack-sm flex-shrink-0">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-surface-container-high hover:border-primary/50 relative group cursor-pointer bg-surface-container-high flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  {authUser?.photoURL ? (
                    <img className="w-full h-full object-cover" alt="Avatar" src={authUser.photoURL} />
                  ) : (
                    <span className="text-4xl text-on-surface-variant group-hover:scale-110 transition-transform duration-300">{authUser?.displayName?.charAt(0)?.toUpperCase() || 'U'}</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                    <span className="material-symbols-outlined text-white transform scale-75 group-hover:scale-100 transition-transform duration-300">photo_camera</span>
                  </div>
                </div>
                <button type="button" className="text-label-sm font-label-sm text-primary hover:text-primary-dark transition-colors font-semibold hover:underline decoration-2 underline-offset-4">Change Picture</button>
              </div>

              {/* Form Fields */}
              <div className="flex-1 w-full space-y-stack-md">
                <div className="group/input">
                  <label htmlFor="displayName" className="block text-label-sm font-label-sm text-on-surface-variant mb-1 font-semibold group-hover/input:text-primary transition-colors">Display Name</label>
                  <input 
                    id="displayName"
                    className={`w-full bg-surface/50 dark:bg-black/20 backdrop-blur-md rounded-2xl border ${errors.displayName ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant/50 focus:border-primary hover:border-primary/50 focus:ring-primary/20'} px-4 py-3 text-body-md font-body-md focus:outline-none focus:ring-4 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 focus:-translate-y-1 focus:shadow-lg`} 
                    type="text" 
                    {...register('displayName')}
                  />
                  {errors.displayName && <p className="text-error text-sm mt-1 animate-pulse">{errors.displayName.message}</p>}
                </div>

                <div className="group/input">
                  <label htmlFor="email" className="block text-label-sm font-label-sm text-on-surface-variant mb-1 font-semibold">Email Address</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      id="email"
                      className="w-full bg-surface-variant/30 text-on-surface-variant rounded-2xl border border-outline-variant/30 px-4 py-3 text-body-md font-body-md cursor-not-allowed shadow-inner transition-all" 
                      disabled 
                      type="email" 
                      value={authUser?.email || ''}
                    />
                    <button type="button" className="text-primary text-label-sm font-label-sm whitespace-nowrap hover:bg-primary/10 hover:-translate-y-0.5 hover:shadow-sm px-4 py-2 rounded-xl transition-all duration-300 font-semibold active:scale-95">Change</button>
                  </div>
                </div>

                <div className="group/input">
                  <label htmlFor="school" className="block text-label-sm font-label-sm text-on-surface-variant mb-1 font-semibold group-hover/input:text-primary transition-colors">University / School</label>
                  <div className="relative group/select z-30">
                    <CustomSelect
                      value={watch('school') || ""}
                      onChange={(val) => setValue('school', val, { shouldValidate: true, shouldDirty: true })}
                      options={[
                        { value: 'Not a student / Khác', label: 'Not a student / Khác' },
                        ...universities.map((uni) => ({ value: uni.name, label: uni.name }))
                      ]}
                      placeholder="Select your University"
                      icon="school"
                      error={!!errors.school}
                    />
                  </div>
                  {errors.school && <p className="text-error text-sm mt-1 animate-pulse">{errors.school.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                  <div className="group/input">
                    <label htmlFor="province" className="block text-label-sm font-label-sm text-on-surface-variant mb-1 font-semibold group-hover/input:text-primary transition-colors">Province / City</label>
                    <div className="relative group/select z-20">
                      <CustomSelect
                        value={selectedProvinceName}
                        onChange={handleProvinceChange}
                        options={provinces.map((prov) => ({ value: prov.name, label: prov.name }))}
                        placeholder="Select Province"
                        icon="map"
                        error={!!errors.province}
                      />
                    </div>
                    {errors.province && <p className="text-error text-sm mt-1 animate-pulse">{errors.province.message}</p>}
                  </div>

                  <div className="group/input">
                    <label htmlFor="district" className="block text-label-sm font-label-sm text-on-surface-variant mb-1 font-semibold group-hover/input:text-primary transition-colors">Campus District</label>
                    <div className="relative group/select z-10">
                      <CustomSelect
                        value={watch('district') || ""}
                        onChange={(val) => setValue('district', val, { shouldValidate: true, shouldDirty: true })}
                        options={districts.map((dist) => ({ value: dist.name, label: dist.name }))}
                        placeholder="Select District"
                        icon="location_on"
                        error={!!errors.district}
                        disabled={!selectedProvinceName || districts.length === 0}
                      />
                    </div>
                    {errors.district && <p className="text-error text-sm mt-1 animate-pulse">{errors.district.message}</p>}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-stack-md pt-stack-sm">
                  <button 
                    type="button" 
                    onClick={() => reset()}
                    disabled={!isDirty || isLoading}
                    className="px-6 py-2.5 rounded-2xl text-label-md font-label-md text-on-surface-variant bg-surface/60 hover:bg-surface-container border border-outline-variant/30 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={!isDirty || isLoading}
                    className="px-6 py-2.5 rounded-2xl text-label-md font-label-md bg-gradient-to-r from-primary to-primary/90 text-on-primary shadow-[0_4px_12px_rgba(0,166,126,0.2)] hover:shadow-[0_8px_20px_rgba(0,166,126,0.4)] hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100 disabled:shadow-none"
                  >
                    {isLoading ? (
                      <span className="animate-pulse">Saving...</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">save</span>
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
        <div className="glass-panel p-stack-lg mb-stack-lg rounded-[32px] hover:shadow-lg transition-all duration-500 border border-white/20 dark:border-white/5 bg-gradient-to-br from-surface-container-low/80 to-secondary/5">
          <h3 className="text-headline-md font-headline-md mb-stack-md border-b border-outline-variant/50 pb-stack-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">verified</span>
            Verified Credentials
          </h3>
          <div className="space-y-stack-md">
            <div className="group/cred flex items-center justify-between p-stack-md bg-surface-container/50 hover:bg-surface-container rounded-[24px] border border-outline-variant/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default">
              <div className="flex items-center gap-stack-md">
                <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center group-hover/cred:scale-110 transition-transform duration-300 shadow-sm">
                  <span className="material-symbols-outlined">verified_user</span>
                </div>
                <div>
                  <h4 className="text-label-md font-label-md text-on-surface">Student Status</h4>
                  <p className="text-label-sm font-label-sm text-on-surface-variant">Verified via {authUser?.email}</p>
                </div>
              </div>
              <span className="text-primary text-label-sm font-label-sm flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 shadow-sm group-hover/cred:bg-primary group-hover/cred:text-white transition-colors duration-300">
                <span className="material-symbols-outlined text-[16px]">check_circle</span> Verified
              </span>
            </div>

            <div className="group/cred flex items-center justify-between p-stack-md bg-surface-container/50 hover:bg-surface-container rounded-[24px] border border-outline-variant/50 hover:border-secondary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default">
              <div className="flex items-center gap-stack-md">
                <div className="w-12 h-12 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center group-hover/cred:scale-110 group-hover/cred:bg-secondary-container group-hover/cred:text-on-secondary-container transition-all duration-300 shadow-sm">
                  <span className="material-symbols-outlined">phone_iphone</span>
                </div>
                <div>
                  <h4 className="text-label-md font-label-md text-on-surface">Phone Number</h4>
                  <p className="text-label-sm font-label-sm text-on-surface-variant">Add a number for SMS alerts</p>
                </div>
              </div>
              <button className="text-on-surface-variant text-label-sm font-label-sm hover:bg-secondary/10 hover:text-secondary hover:-translate-y-0.5 hover:shadow-sm px-4 py-2 rounded-xl transition-all duration-300 font-semibold active:scale-95">Connect</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
