import { isStudentEmail } from '../../utils/student';

interface StudentBadgeProps {
  email?: string | null;
  variant?: 'full' | 'minimal';
  className?: string;
}

export default function StudentBadge({ email, variant = 'full', className = '' }: StudentBadgeProps) {
  if (!isStudentEmail(email)) return null;

  if (variant === 'minimal') {
    return (
      <span 
        className={`flex items-center justify-center w-5 h-5 bg-surface text-primary rounded-full shadow-sm border border-primary/20 ${className}`}
        title="Verified Student"
      >
        <span className="material-symbols-outlined text-[16px]">verified</span>
      </span>
    );
  }

  return (
    <span 
      className={`inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[11px] font-bold border border-primary/20 ${className}`}
      title="Verified student via .edu.vn email"
    >
      <span className="material-symbols-outlined text-[14px]">verified</span>
      Verified Student
    </span>
  );
}
