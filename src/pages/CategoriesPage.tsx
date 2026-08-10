import { useEffect, useState } from 'react';
import { Plus, Loader2, X, AlertTriangle } from 'lucide-react';
import { supabase, Category, buildCategoryTree } from '../lib/supabase';
import CategoryTree from '../components/CategoryTree';
import CategorySelect from '../components/CategorySelect';

type ModalState = { mode: 'add' | 'edit'; category?: Category; defaultParentId?: string; defaultParentName?: string } | null;

export default function CategoriesPage() {
  const [tree, setTree] = useState<Category[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formName, setFormName] = useState('');
  const [formParentId, setFormParentId] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('category_id'),
    ]);
    if (cats) setTree(buildCategoryTree(cats as Category[]));
    if (prods) {
      const counts: Record<string, number> = {};
      prods.forEach((p: { category_id: string | null }) => {
        if (p.category_id) counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
      });
      setProductCounts(counts);
    }
    setLoading(false);
  }

  function openAdd(parentId?: string, parentName?: string) {
    setFormName(''); setFormParentId(parentId ?? '');
    setModal({ mode: 'add', defaultParentId: parentId, defaultParentName: parentName });
  }

  function openEdit(cat: Category) {
    setFormName(cat.name); setFormParentId(cat.parent_id ?? '');
    setModal({ mode: 'edit', category: cat });
  }

  async function handleSave() {
    if (!formName.trim()) return;
    setSaving(true);
    const payload = { name: formName.trim(), parent_id: formParentId || null };
    if (modal?.mode === 'edit' && modal.category) {
      await supabase.from('categories').update(payload).eq('id', modal.category.id);
    } else {
      await supabase.from('categories').insert(payload);
    }
    setSaving(false); setModal(null); await loadData();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from('categories').delete().eq('id', deleteTarget.id);
    setDeleting(false); setDeleteTarget(null); await loadData();
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="section-title">شجرة الأقسام</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">هيكل هرمي غير محدود العمق</p>
          </div>
          <button onClick={() => openAdd()} className="btn-primary">
            <Plus size={15} /> إضافة قسم رئيسي
          </button>
        </div>

        <CategoryTree
          nodes={tree}
          productCounts={productCounts}
          onAddChild={openAdd}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          loading={loading}
        />
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">
                {modal.mode === 'edit' ? 'تعديل القسم' : 'إضافة قسم جديد'}
              </h3>
              <button onClick={() => setModal(null)} className="btn-icon"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {modal.mode === 'add' && modal.defaultParentName && (
                <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-xl px-4 py-3 text-sm text-teal-700 dark:text-teal-300">
                  إضافة قسم فرعي تحت: <span className="font-bold">{modal.defaultParentName}</span>
                </div>
              )}
              <div>
                <label className="label">اسم القسم *</label>
                <input
                  type="text" value={formName} onChange={e => setFormName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  className="input" placeholder="أدخل اسم القسم" autoFocus
                />
              </div>
              <div>
                <label className="label">القسم الأب (اختياري)</label>
                <CategorySelect
                  categories={tree} value={formParentId} onChange={setFormParentId}
                  placeholder="قسم رئيسي (بدون قسم أب)" excludeId={modal.category?.id}
                />
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3 justify-end border-t border-slate-100 dark:border-slate-700 pt-4">
              <button onClick={() => setModal(null)} className="btn-secondary">إلغاء</button>
              <button onClick={handleSave} disabled={saving || !formName.trim()} className="btn-primary disabled:opacity-50">
                {saving && <Loader2 size={15} className="animate-spin" />}
                {modal.mode === 'edit' ? 'حفظ التعديلات' : 'إضافة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={26} className="text-red-500 dark:text-red-400" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-2">تأكيد الحذف</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">حذف القسم: <span className="font-bold text-slate-700 dark:text-slate-200">"{deleteTarget.name}"</span></p>
              <p className="text-xs text-red-500 dark:text-red-400 mb-5">سيتم حذف جميع الأقسام الفرعية المرتبطة.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeleteTarget(null)} className="btn-secondary">إلغاء</button>
                <button onClick={handleDelete} disabled={deleting} className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 font-semibold text-sm flex gap-2 items-center disabled:opacity-50">
                  {deleting && <Loader2 size={15} className="animate-spin" />} حذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
