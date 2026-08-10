import { LayoutDashboard, Package, Layers, BarChart2, Settings, X, LogOut, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Page = 'dashboard' | 'products' | 'categories' | 'reports' | 'settings';

type Props = {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isOpen: boolean;
  onClose: () => void;
};

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',  label: 'لوحة التحكم', icon: <LayoutDashboard size={19} /> },
  { id: 'products',   label: 'المنتجات',    icon: <Package size={19} /> },
  { id: 'categories', label: 'الأقسام',     icon: <Layers size={19} /> },
  { id: 'reports',    label: 'التقارير',    icon: <BarChart2 size={19} /> },
  { id: 'settings',   label: 'الإعدادات',  icon: <Settings size={19} /> },
];

export default function Sidebar({ currentPage, onNavigate, isOpen, onClose }: Props) {
  const { session, signOut } = useAuth();
  const email = session?.user?.email ?? '';
  const initials = email.slice(0, 1).toUpperCase() || 'م';

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}
      <aside className={`
        fixed top-0 right-0 h-full w-64 z-40 flex flex-col
        bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-700/60
        transition-transform duration-300 ease-in-out shadow-xl
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        lg:static lg:h-screen lg:shadow-none
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shadow-sm">
              <Package size={17} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-white text-sm leading-tight">نظام المخزون</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">إدارة المخزون</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden btn-icon"><X size={17} /></button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); onClose(); }}
              className={`sidebar-link w-full ${currentPage === item.id ? 'active' : ''}`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {currentPage !== item.id && <ChevronLeft size={14} className="text-slate-300 dark:text-slate-600" />}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-sm shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{email || 'مدير النظام'}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">مسؤول</p>
            </div>
            <button onClick={signOut} className="btn-icon shrink-0" title="تسجيل الخروج">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
