
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-surface text-on-surface pb-20 relative overflow-hidden">
      {/* Background Meshes */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] rounded-full bg-secondary/10 blur-[150px] pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute top-[40%] left-0 w-[40vw] h-[40vw] rounded-full bg-primary/10 blur-[150px] pointer-events-none transform -translate-x-1/2"></div>

      <div className="max-w-[1000px] mx-auto px-gutter pt-12 relative z-10">
        
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-24">
          <div className="inline-flex items-center justify-center p-3 rounded-3xl bg-primary/10 text-primary mb-6 shadow-inner border border-primary/20 hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
          </div>
          <h1 className="text-display-lg md:text-[64px] leading-tight font-black text-on-surface tracking-tight mb-6">
            Building a <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Sustainable</span> Campus.
          </h1>
          <p className="text-headline-sm text-on-surface-variant max-w-3xl leading-relaxed">
            PassNow was born from a simple observation: students throw away too many good items when moving out, while incoming students buy everything brand new. 
          </p>
        </div>

        {/* Story Section */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center mb-32">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-[40px] rotate-3 opacity-20 group-hover:rotate-6 transition-transform duration-500 blur-sm"></div>
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop" 
              alt="Students collaborating" 
              className="relative z-10 w-full rounded-[40px] shadow-xl border border-outline-variant/30 object-cover aspect-[4/3] group-hover:-translate-y-2 transition-transform duration-500"
            />
          </div>
          
          <div className="space-y-6">
            <div className="inline-block px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-label-sm font-bold uppercase tracking-wider">
              Our Origin Story
            </div>
            <h2 className="text-headline-lg font-bold text-on-surface">
              From an Entrepreneurship Class to Reality
            </h2>
            <p className="text-body-lg text-on-surface-variant leading-relaxed">
              We are a passionate group of university students who started PassNow as a project for our Entrepreneurship course. We wanted to solve a real problem we saw every semester.
            </p>
            <p className="text-body-lg text-on-surface-variant leading-relaxed">
              Our goal was to create a closed, secure, and hyper-local marketplace specifically designed for students to pass down their textbooks, dorm essentials, and electronics.
            </p>
          </div>
        </div>

        {/* Mission/Values Grid */}
        <div className="grid sm:grid-cols-3 gap-6 mb-32">
          {[
            { icon: 'recycling', title: 'Reduce Waste', desc: 'Keeping usable items out of landfills.' },
            { icon: 'school', title: 'Student First', desc: 'Built exclusively for verified university students.' },
            { icon: 'savings', title: 'Save Money', desc: 'Why buy retail when you can buy from a senior?' }
          ].map((val, i) => (
            <div key={i} className="glass-panel p-8 rounded-[32px] text-center hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all duration-500 border border-outline-variant/30">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[32px]">{val.icon}</span>
              </div>
              <h3 className="text-title-lg font-bold text-on-surface mb-2">{val.title}</h3>
              <p className="text-body-md text-on-surface-variant">{val.desc}</p>
            </div>
          ))}
        </div>

        {/* Closing Banner */}
        <div className="relative rounded-[48px] overflow-hidden bg-surface-container-highest border border-outline-variant/30 text-center px-6 py-20">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/40 via-surface-container to-surface"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-headline-lg font-bold text-on-surface mb-6">
              Be part of the change.
            </h2>
            <p className="text-body-lg text-on-surface-variant mb-10">
              Join the PassNow movement and help us build a circular economy on campus. Every item passed down is a step towards a greener university.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register">
                <button className="px-8 py-3.5 bg-gradient-to-r from-primary to-secondary text-white rounded-full text-label-lg font-bold shadow-[0_8px_20px_rgba(0,166,126,0.25)] hover:-translate-y-1 transition-all duration-300">
                  Create an Account
                </button>
              </Link>
              <Link to="/browse">
                <button className="px-8 py-3.5 bg-surface text-on-surface border border-outline-variant rounded-full text-label-lg font-bold hover:bg-surface-variant hover:-translate-y-1 transition-all duration-300">
                  Browse Items
                </button>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
