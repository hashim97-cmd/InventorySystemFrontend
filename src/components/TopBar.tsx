import { Search, Bell, Menu } from 'lucide-react';

type Props = {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
};

export default function TopBar({ title, subtitle, onMenuClick }: Props) {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700/60 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden btn-icon">
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-base font-bold text-slate-800 dark:text-white leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden  items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 w-52">
          <Search size={15} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="بحث سريع..."
            className="bg-transparent text-sm text-slate-600 dark:text-slate-300 outline-none w-full placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>
        <button className="relative btn-icon">
          <Bell size={19} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
