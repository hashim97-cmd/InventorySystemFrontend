import { useEffect, useState } from 'react';
import { X, Loader2, Package, Calculator } from 'lucide-react';
import { supabase, Product, Category, buildCategoryTree, ProductFormData } from '../lib/supabase';
import CategorySelect from '../components/CategorySelect';

type Props = {
  product?: Product | null;
  onClose: () => void;
  onSaved: () => void;
};

const UNITS = ['قطعة', 'لتر', 'كجم', 'جرام', 'متر', 'رول', 'رزمة', 'علبة', 'زجاجة', 'كيس', 'صندوق', 'حزمة'];

const defaultForm: ProductFormData & { unit: string } = {
  name: '', code: '', category_id: '', quantity: 0,
  length_cm: '', width_cm: '', height_cm: '',
  size: '', base_price: '', margin_pct: '', image_url: '', unit: 'قطعة', final_price: '',
};

export default function ProductForm({ product, onClose, onSaved }: Props) {
  const [form, setForm] = useState({ ...defaultForm });
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [manualFinalPrice, setManualFinalPrice] = useState(false);

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      if (data) setCategories(buildCategoryTree(data as Category[]));
    });
    if (product) {
      setForm({
        name: product.name,
        code: product.code,
        category_id: product.category_id ?? '',
        quantity: product.quantity,
        length_cm: product.length_cm?.toString() ?? '',
        width_cm: product.width_cm?.toString() ?? '',
        height_cm: product.height_cm?.toString() ?? '',
        size: product.size ?? '',
        base_price: product.base_price.toString(),
        margin_pct: product.margin_pct.toString(),
        final_price: product.final_price.toString(),
        image_url: product.image_url ?? '',
        unit: (product as any).unit ?? 'قطعة',
      });
      const calculatedPrice = product.base_price * (1 + product.margin_pct / 100);
      setManualFinalPrice(Math.abs(product.final_price - calculatedPrice) > 0.01);
    }
  }, [product]);

  const calculatedFinalPrice = (parseFloat(form.base_price) || 0) * (1 + (parseFloat(form.margin_pct) || 0) / 100);
  const finalPrice = manualFinalPrice && form.final_price ? parseFloat(form.final_price) : calculatedFinalPrice;

  function set(key: string, value: string | number) {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: '' }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'اسم المنتج مطلوب';
    if (!form.code.trim()) e.code = 'الكود مطلوب';
    if (!form.base_price || isNaN(parseFloat(form.base_price))) e.base_price = 'السعر مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      category_id: form.category_id || null,
      quantity: Number(form.quantity) || 0,
      length_cm: form.length_cm ? parseFloat(form.length_cm) : null,
      width_cm: form.width_cm ? parseFloat(form.width_cm) : null,
      height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
      size: form.size || null,
      base_price: parseFloat(form.base_price),
      margin_pct: parseFloat(form.margin_pct) || 0,
      image_url: form.image_url || null,
      unit: form.unit || 'قطعة',
      ...(manualFinalPrice && form.final_price ? { final_price: parseFloat(form.final_price) } : {}),
    };

    let error;
    if (product) {
      ({ error } = await supabase.from('products').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', product.id));
    } else {
      ({ error } = await supabase.from('products').insert(payload));
    }

    setSaving(false);
    if (!error) {
      onSaved();
    } else if (error.code === '23505') {
      setErrors({ code: 'هذا الكود مستخدم بالفعل' });
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box max-w-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10 rounded-t-2xl">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{product ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Image preview */}
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shrink-0 flex items-center justify-center">
              {form.image_url ? (
                <img src={form.image_url} alt="preview" className="w-full h-full object-cover" onError={() => set('image_url', '')} />
              ) : (
                <Package size={26} className="text-slate-300 dark:text-slate-600" />
              )}
            </div>
            <div className="flex-1">
              <label className="label">رابط صورة المنتج</label>
              <input type="text" value={form.image_url} onChange={e => set('image_url', e.target.value)} className="input" placeholder="https://..." />
            </div>
          </div>

          {/* Name + Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">اسم المنتج *</label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={`input ${errors.name ? 'border-red-300 focus:ring-red-500' : ''}`} placeholder="اسم المنتج" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="label">الكود (SKU) *</label>
              <input type="text" value={form.code} onChange={e => set('code', e.target.value)} className={`input font-mono ${errors.code ? 'border-red-300 focus:ring-red-500' : ''}`} placeholder="P-001" />
              {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="label">القسم</label>
            <CategorySelect categories={categories} value={form.category_id} onChange={v => set('category_id', v)} placeholder="اختر القسم..." />
          </div>

          {/* Quantity + Unit + Size */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">الكمية</label>
              <input type="number" min="0" value={form.quantity} onChange={e => set('quantity', e.target.value)} className="input" placeholder="0" />
            </div>
            <div>
              <label className="label">وحدة القياس</label>
              <select value={form.unit} onChange={e => set('unit', e.target.value)} className="input">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">الحجم / الوزن</label>
              <input type="text" value={form.size} onChange={e => set('size', e.target.value)} className="input" placeholder="مثال: 25 كجم، 1 لتر..." />
            </div>
          </div>

          {/* Dimensions */}
          <div>
            <label className="label">الأبعاد بالسم (الطول × العرض × الارتفاع)</label>
            <div className="grid grid-cols-3 gap-3">
              {(['length_cm', 'width_cm', 'height_cm'] as const).map((field, i) => (
                <div key={field} className="relative">
                  <input
                    type="number"
                    value={(form as any)[field]}
                    onChange={e => set(field, e.target.value)}
                    className="input pl-8"
                    placeholder={['الطول', 'العرض', 'الارتفاع'][i]}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{'طعر'[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-3 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <Calculator size={15} className="text-teal-600 dark:text-teal-400" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">التسعير</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label">السعر الأساسي *</label>
                <div className="relative">
                  <input type="number" min="0" step="0.01" value={form.base_price} onChange={e => set('base_price', e.target.value)} className={`input pl-6 ${errors.base_price ? 'border-red-300' : ''}`} placeholder="0.00" />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">ج</span>
                </div>
                {errors.base_price && <p className="text-xs text-red-500 mt-1">{errors.base_price}</p>}
              </div>
              <div>
                <label className="label">نسبة الربح / الضريبة %</label>
                <div className="relative">
                  <input type="number" min="0" step="0.1" value={form.margin_pct} onChange={e => set('margin_pct', e.target.value)} className="input pl-6" placeholder="0" />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                </div>
              </div>
              <div>
                <label className="label flex items-center gap-2">
                  <input type="checkbox" checked={manualFinalPrice} onChange={e => setManualFinalPrice(e.target.checked)} />
                  السعر النهائي يدويا
                </label>
                {manualFinalPrice ? (
                  <input type="number" min="0" step="0.01" value={form.final_price} onChange={e => set('final_price', e.target.value)} className="input" placeholder="0.00" />
                ) : (
                  <div className="bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-800 rounded-xl px-4 py-2.5 text-teal-700 dark:text-teal-300 font-bold text-sm">
                    {finalPrice.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center gap-3 justify-end border-t border-slate-100 dark:border-slate-700 pt-4">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
            {saving && <Loader2 size={15} className="animate-spin" />}
            {product ? 'حفظ التعديلات' : 'إضافة المنتج'}
          </button>
        </div>
      </div>
    </div>
  );
}
