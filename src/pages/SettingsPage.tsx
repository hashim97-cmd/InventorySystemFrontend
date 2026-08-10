import { Sun, Moon, Monitor, Bell, Database, Globe, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function SettingsPage() {
  const { theme, toggle } = useTheme();

  return (
    <div className="max-w-2xl space-y-5">
      {/* Appearance */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <Monitor size={18} className="text-teal-600 dark:text-teal-400" />
          <h2 className="section-title">المظهر</h2>
        </div>

        <div>
          <label className="label">وضع العرض</label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button
              onClick={() => theme === 'dark' && toggle()}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                theme === 'light'
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${theme === 'light' ? 'bg-teal-100 dark:bg-teal-900/40' : 'bg-slate-100 dark:bg-slate-700'}`}>
                <Sun size={18} className={theme === 'light' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500'} />
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">الوضع الفاتح</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">خلفية بيضاء مضيئة</p>
              </div>
            </button>

            <button
              onClick={() => theme === 'light' && toggle()}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                theme === 'dark'
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-teal-100 dark:bg-teal-900/40' : 'bg-slate-100 dark:bg-slate-700'}`}>
                <Moon size={18} className={theme === 'dark' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500'} />
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">الوضع الداكن</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">خلفية داكنة مريحة للعين</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <Bell size={18} className="text-teal-600 dark:text-teal-400" />
          <h2 className="section-title">التنبيهات</h2>
        </div>
        <div className="space-y-4">
          {[
            { label: 'تنبيه عند نفاد المخزون', desc: 'إشعار عند وصول الكمية إلى صفر' },
            { label: 'تنبيه الكمية المنخفضة', desc: 'إشعار عند انخفاض الكمية عن 10 وحدات' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.label}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-teal-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-[-20px]" />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* System info */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <Info size={18} className="text-teal-600 dark:text-teal-400" />
          <h2 className="section-title">معلومات النظام</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: 'اسم النظام', value: 'نظام إدارة المخزون' },
            { label: 'الإصدار', value: '2.0.0' },
            { label: 'قاعدة البيانات', value: 'Supabase PostgreSQL' },
            { label: 'اللغة', value: 'العربية (RTL)' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
              <span className="text-sm text-slate-500 dark:text-slate-400">{item.label}</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
