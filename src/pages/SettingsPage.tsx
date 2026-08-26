import { useEffect, useRef, useState } from 'react';
import { Sun, Moon, Monitor, Info, Download, Upload, UserPlus, Loader2, Pencil, Trash2, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { api, deleteUser, getUsers, ManagedUser, updateUser } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'backup' | 'restore' | 'user' | 'users' | null>(null);
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  // Extract condition to a variable
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    if (!isSuperAdmin) return;
    setBusy('users');
    getUsers().then(setUsers).catch(() => setMessage('تعذر تحميل المستخدمين')).finally(() => setBusy(null));
  }, [isSuperAdmin]);

  async function downloadBackup() {
    setBusy('backup'); setMessage('');
    try {
      const response = await api.get('/backup', { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a'); link.href = url; link.download = 'inventory-backup.dump'; link.click(); URL.revokeObjectURL(url);
      setMessage('تم تنزيل النسخة الاحتياطية');
    } catch { setMessage('تعذر إنشاء النسخة الاحتياطية'); } finally { setBusy(null); }
  }

  async function restoreBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    setBusy('restore'); setMessage('');
    try { const form = new FormData(); form.append('file', file); await api.post('/restore', form, { headers: { 'Content-Type': 'multipart/form-data' } }); setMessage('تمت استعادة النسخة الاحتياطية'); }
    catch (error: any) { setMessage(error.response?.data?.message || 'تعذر استعادة النسخة الاحتياطية'); }
    finally { setBusy(null); if (fileInput.current) fileInput.current.value = ''; }
  }

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy('user'); setMessage('');
    const form = new FormData(event.currentTarget);
    try { await api.post('/users', { email: form.get('email'), password: form.get('password'), role: form.get('role') }); setMessage('تم إنشاء المستخدم'); event.currentTarget.reset(); }
    catch (error: any) { setMessage(error.response?.data?.message || 'تعذر إنشاء المستخدم'); }
    finally { setBusy(null); }
  }

  async function saveUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingUser) return;
    setBusy('users'); setMessage('');
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '').trim();
    try {
      const updated = await updateUser(editingUser.id, {
        role: form.get('role') as ManagedUser['role'],
        ...(password ? { password } : {}),
      });
      setUsers(current => current.map(item => item.id === updated.id ? { ...item, ...updated } : item));
      setEditingUser(null);
      setMessage('تم تحديث المستخدم');
    } catch (error: any) { setMessage(error.response?.data?.message || 'تعذر تحديث المستخدم'); }
    finally { setBusy(null); }
  }

  async function removeUser(target: ManagedUser) {
    if (target.id === user?.id || !window.confirm(`هل تريد حذف المستخدم ${target.email}؟`)) return;
    setBusy('users'); setMessage('');
    try {
      await deleteUser(target.id);
      setUsers(current => current.filter(item => item.id !== target.id));
      setMessage('تم حذف المستخدم');
    } catch (error: any) { setMessage(error.response?.data?.message || 'تعذر حذف المستخدم'); }
    finally { setBusy(null); }
  }

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
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'light'
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
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'dark'
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

      {isSuperAdmin && (
        <div className="card">
          <div className="flex items-center gap-2 mb-5"><UserPlus size={18} className="text-teal-600 dark:text-teal-400" /><h2 className="section-title">إدارة المستخدمين</h2></div>
          <form onSubmit={createUser} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div><label className="label">البريد الإلكتروني</label><input name="email" type="email" required className="input" /></div>
            <div><label className="label">كلمة المرور</label><input name="password" type="password" minLength={6} required className="input" /></div>
            <div><label className="label">الصلاحية</label><select name="role" className="input"><option value="user">مستخدم</option><option value="admin">مسؤول</option></select></div>
            <button disabled={busy === 'user'} className="btn-primary justify-center">{busy === 'user' ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />} إنشاء مستخدم</button>
          </form>
        </div>
      )}

      {isAdmin && (
        <div className="card">
          <div className="flex items-center gap-2 mb-5"><Download size={18} className="text-teal-600 dark:text-teal-400" /><h2 className="section-title">النسخ الاحتياطي والاستعادة</h2></div>
          <div className="flex flex-wrap gap-3">
            <button onClick={downloadBackup} disabled={busy !== null} className="btn-primary"><Download size={15} /> {busy === 'backup' ? 'جاري الإنشاء...' : 'تنزيل نسخة احتياطية'}</button>
            <button onClick={() => fileInput.current?.click()} disabled={busy !== null} className="btn-secondary"><Upload size={15} /> {busy === 'restore' ? 'جاري الاستعادة...' : 'استعادة نسخة'}</button>
            <input ref={fileInput} type="file" accept=".dump,.sql" onChange={restoreBackup} className="hidden" />
          </div>
          {message && <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">{message}</p>}
        </div>
      )}

      {isSuperAdmin && (
        <div className="card">
          <div className="flex items-center justify-between gap-2 mb-5">
            <div className="flex items-center gap-2">
              <UserPlus size={18} className="text-teal-600 dark:text-teal-400" />
              <h2 className="section-title">جميع المستخدمين</h2>
            </div>
            {busy === 'users' && <Loader2 size={18} className="animate-spin text-slate-400" />}
          </div>
          {users.length === 0 && busy !== 'users' ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">لا يوجد مستخدمون</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead className="border-b border-slate-100 dark:border-slate-700">
                  <tr>
                    <th className="pb-3 text-right text-xs text-slate-400">البريد الإلكتروني</th>
                    <th className="pb-3 text-right text-xs text-slate-400">الصلاحية</th>
                    <th className="pb-3 text-right text-xs text-slate-400">آخر دخول</th>
                    <th className="pb-3 text-left text-xs text-slate-400">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(item => (
                    <tr key={item.id} className="border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                      <td className="py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{item.email}</td>
                      <td className="py-3 text-sm text-slate-500 dark:text-slate-400">{item.role === 'super_admin' ? 'مدير عام' : item.role === 'admin' ? 'مسؤول' : 'مستخدم'}</td>
                      <td className="py-3 text-xs text-slate-400 dark:text-slate-500">{item.last_sign_in_at ? new Date(item.last_sign_in_at).toLocaleDateString('ar-EG') : 'لم يسجل الدخول'}</td>
                      <td className="py-3 text-left">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => setEditingUser(item)} className="btn-icon" title="تعديل المستخدم"><Pencil size={14} /></button>
                          <button type="button" onClick={() => void removeUser(item)} disabled={busy === 'users' || item.id === user?.id} className="btn-icon-red" title="حذف المستخدم"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {editingUser && (
        <div className="modal-backdrop" onClick={() => setEditingUser(null)}>
          <div className="modal-box max-w-md p-6" onClick={event => event.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">تعديل المستخدم</h2>
              <button type="button" onClick={() => setEditingUser(null)} className="btn-icon"><X size={18} /></button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{editingUser.email}</p>
            <form onSubmit={saveUser} className="space-y-4">
              <div>
                <label className="label">الصلاحية</label>
                <select name="role" defaultValue={editingUser.role} className="input">
                  <option value="user">مستخدم</option>
                  <option value="admin">مسؤول</option>
                  <option value="super_admin">مدير عام</option>
                </select>
              </div>
              <div>
                <label className="label">كلمة المرور الجديدة</label>
                <input name="password" type="password" minLength={6} className="input" placeholder="اتركها فارغة بدون تغيير" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditingUser(null)} className="btn-secondary">إلغاء</button>
                <button type="submit" disabled={busy === 'users'} className="btn-primary">{busy === 'users' && <Loader2 size={15} className="animate-spin" />} حفظ التغييرات</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
