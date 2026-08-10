import { useState } from 'react';
import { ChevronDown, ChevronLeft, Search, X } from 'lucide-react';
import { Category, flattenCategories } from '../lib/supabase';

type Props = {
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  excludeId?: string;
};

export default function CategorySelect({ categories, value, onChange, placeholder = 'اختر قسمًا', excludeId }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const flat = flattenCategories(categories).filter(c => c.id !== excludeId);
  const selected = flat.find(c => c.id === value);

  const getPath = (cat: Category): string => {
    const parts: string[] = [cat.name];
    let cur = flat.find(c => c.id === cat.parent_id);
    while (cur) { parts.unshift(cur.name); cur = flat.find(c => c.id === cur!.parent_id); }
    return parts.join(' > ');
  };

  const filtered = flat.filter(c => !search || c.name.includes(search) || getPath(c).includes(search));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="input flex items-center justify-between text-right"
      >
        <span className={`text-sm truncate ${selected ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>
          {selected ? getPath(selected) : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <span
              onClick={e => { e.stopPropagation(); onChange(''); }}
              className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={12} />
            </span>
          )}
          {open ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronLeft size={15} className="text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="absolute top-full right-0 left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-72 overflow-hidden flex flex-col animate-fade-in">
          <div className="p-2 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 rounded-lg px-3 py-2">
              <Search size={13} className="text-slate-400 shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="بحث..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="text-sm bg-transparent outline-none w-full placeholder-slate-400 dark:placeholder-slate-500 text-slate-700 dark:text-slate-200"
              />
            </div>
          </div>
          <div className="overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); setSearch(''); }}
              className="w-full text-right px-4 py-2.5 text-sm text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {placeholder}
            </button>
            {filtered.map(cat => {
              const depth = getPath(cat).split(' > ').length - 1;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { onChange(cat.id); setOpen(false); setSearch(''); }}
                  className={`w-full text-right px-4 py-2 text-sm transition-colors truncate flex items-center gap-2 ${
                    cat.id === value
                      ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                  }`}
                  style={{ paddingRight: `${depth * 16 + 16}px` }}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    depth === 0 ? 'bg-teal-500' : depth === 1 ? 'bg-blue-400' : 'bg-slate-300 dark:bg-slate-500'
                  }`} />
                  {cat.name}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-slate-400 py-4 text-sm">لا توجد نتائج</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
