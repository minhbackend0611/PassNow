import React from 'react';
import { Link } from 'react-router-dom';

export default function HowItWorksPage() {
  const steps = [
    {
      icon: 'how_to_reg',
      title: 'Join the Community',
      description: 'Sign up using your university email to join a trusted network of students.',
      color: 'from-blue-500 to-cyan-400'
    },
    {
      icon: 'inventory_2',
      title: 'List or Discover',
      description: 'Snap a photo to list your unwanted items, or browse deals across campus.',
      color: 'from-primary to-secondary'
    },
    {
      icon: 'chat_bubble',
      title: 'Chat & Negotiate',
      description: 'Use our secure in-app messaging to agree on a price and meeting spot.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: 'handshake',
      title: 'Meet & Exchange',
      description: 'Meet safely on campus. Confirm the handover right in the app.',
      color: 'from-amber-400 to-orange-500'
    }
  ];

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-surface text-on-surface pb-20 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-secondary/5 blur-[150px] pointer-events-none"></div>

      <div className="max-w-[1000px] mx-auto px-gutter pt-12 relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-4 shadow-inner border border-primary/20">
            <span className="material-symbols-outlined text-[32px]">lightbulb</span>
          </div>
          <h1 className="text-display-md md:text-display-lg font-bold text-on-surface tracking-tight">
            How <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">PassNow</span> Works
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Your university's sustainable marketplace. We make it incredibly simple to give your unwanted items a second life.
          </p>
        </div>

        {/* Step-by-step Grid */}
        <div className="grid md:grid-cols-2 gap-6 relative">
          {/* Connecting dashed line (visible only on desktop) */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-outline-variant/50 to-transparent -translate-y-1/2 z-0 border-t-2 border-dashed border-outline-variant/30"></div>
          <div className="hidden md:block absolute left-1/2 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-outline-variant/50 to-transparent -translate-x-1/2 z-0 border-l-2 border-dashed border-outline-variant/30"></div>

          {steps.map((step, idx) => (
            <div key={idx} className="group glass-panel p-8 rounded-[32px] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all duration-500 relative z-10 overflow-hidden border border-white/50 dark:border-white/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 blur-3xl group-hover:opacity-20 transition-opacity duration-500 rounded-full" />
              
              <div className="flex items-start gap-6 relative z-10">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg shrink-0 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                  <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {step.icon}
                  </span>
                </div>
                <div>
                  <div className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant/70 mb-1">
                    Step 0{idx + 1}
                  </div>
                  <h3 className="text-headline-sm font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-body-md text-on-surface-variant leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center glass-panel p-10 md:p-16 rounded-[40px] relative overflow-hidden border border-white/40 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 z-0" />
          <div className="relative z-10">
            <h2 className="text-headline-lg font-bold text-on-surface mb-4">
              Ready to clear out your dorm?
            </h2>
            <p className="text-body-lg text-on-surface-variant mb-8 max-w-xl mx-auto">
              Start listing your unused items today and make some extra cash while helping the environment.
            </p>
            <Link to="/list">
              <button className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-full text-label-lg font-bold shadow-[0_8px_20px_rgba(0,166,126,0.25)] hover:shadow-[0_12px_25px_rgba(0,166,126,0.35)] hover:-translate-y-1 transition-all duration-300 active:scale-95 flex items-center gap-2 mx-auto">
                <span className="material-symbols-outlined">add_circle</span>
                List an Item Now
              </button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
