import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { VIETNAM_UNIVERSITIES } from '../../constants/universities';
import type { University } from '../../constants/universities';

interface UniversityBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (university: University) => void;
}

export function UniversityBrowserModal({ isOpen, onClose, onSelect }: UniversityBrowserModalProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return VIETNAM_UNIVERSITIES;
    const q = search.toLowerCase();
    return VIETNAM_UNIVERSITIES.filter(
      (u) => u.name.toLowerCase().includes(q) || (u.aliases || []).some((a) => a.toLowerCase().includes(q)),
    );
  }, [search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center sm:p-6 animate-in fade-in">
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[32px] sm:rounded-[32px] bg-surface shadow-xl slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/40 p-5">
          <h2 className="text-title-md font-semibold text-on-surface">Browse Universities</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="border-b border-outline-variant/40 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search by name or abbreviation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-4 text-body-md outline-none focus:border-primary"
            />
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {filtered.length > 0 ? (
            filtered.map((uni) => (
              <li key={uni.id}>
                <button
                  onClick={() => onSelect(uni)}
                  className="flex w-full items-start gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-title-md font-bold text-primary">
                    {uni.name.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-body-md font-semibold text-on-surface">{uni.name}</p>
                    {uni.aliases && uni.aliases.length > 0 && (
                      <p className="mt-0.5 truncate text-body-sm text-on-surface-variant">
                        {uni.aliases.join(', ')}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            ))
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-body-md font-semibold text-on-surface">No universities found</p>
              <p className="mt-1 text-body-sm text-on-surface-variant">Try a different search term.</p>
            </div>
          )}
        </ul>
      </div>
    </div>
  );
}
