import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="bg-surface-container-lowest text-on-surface font-body-md min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Abstract Animated Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-br from-primary/5 via-surface to-secondary/10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary/20 blur-[120px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-tertiary/15 blur-[80px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '5s' }}></div>
      </div>

      {/* Main Container */}
      <main className="w-full max-w-[1000px] mx-auto px-margin-mobile md:px-gutter z-10 grid md:grid-cols-2 gap-stack-lg items-center relative">
        
        {/* Left Side: Value Proposition & Branding */}
        <div className="hidden md:flex flex-col justify-center pr-stack-lg">
          <h1 className="text-headline-xl font-headline-xl text-primary mb-stack-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
            PassNow
          </h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant mb-stack-lg leading-relaxed">
            Sustainable student marketplace. Buy, sell, and give away with ease.
          </p>
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-lg mt-stack-md border border-outline-variant">
            <img 
              className="w-full h-full object-cover" 
              alt="Students exchanging items on campus" 
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop"
            />
          </div>
        </div>

        {/* Right Side: Forms Container (Glassmorphism) */}
        <div className="glass-panel rounded-2xl p-stack-lg md:p-8 w-full max-w-[450px] mx-auto relative overflow-hidden">
          {/* Mobile Brand Header (visible only on small screens) */}
          <div className="md:hidden text-center mb-stack-lg">
            <h1 className="text-headline-xl-mobile font-headline-xl-mobile text-primary mb-2 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
              PassNow
            </h1>
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              Sustainable student marketplace.
            </p>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
