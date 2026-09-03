import { useEffect, useState } from 'react';
import { X, Pencil, Trash2, Package, Ruler, Tag, Layers, AlertTriangle, Loader2, ChevronLeft, History } from 'lucide-react';
import { supabase, Product, Category, buildCategoryTree, getCategoryPath, getStockStatus } from '../lib/supabase';
import { getProduct } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type Props = {
  product: Product;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onDelete: () => void;
};

export default function ProductDetail({ product, onClose, onEdit, onDelete }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [details, setDetails] = useState(product);
  const { user } = useAuth();
  const canDelete = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    getProduct(product.id).then(setDetails).catch(() => undefined);
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      if (data) setCategories(buildCategoryTree(data as Category[]));
    });
  }, [product.id]);

  async function handleDelete() {
    setDeleting(true);
    await supabase.from('products').delete().eq('id', product.id);
    setDeleting(false);
    onDelete();
  }

  const status = getStockStatus(details?.quantity);
  const path = getCategoryPath(details?.category_id, categories);
  const pathParts = path !== '—' ? path.split(' > ') : [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box-xl relative" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 rounded-t-2xl z-10">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">تفاصيل المنتج</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(product)} className="btn-secondary py-1.5 px-3 text-xs">
              <Pencil size={13} /> تعديل
            </button>
            {canDelete && <button onClick={() => setConfirmDelete(true)} className="btn-danger py-1.5 px-3 text-xs">
              <Trash2 size={13} /> حذف
            </button>}
            <button onClick={onClose} className="btn-icon"><X size={18} /></button>
          </div>
        </div>

        {/* Body — two-column layout */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left: Image */}
          <div className="md:col-span-1">
            <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 w-full max-w-xs mx-auto md:max-w-none">
              {details?.image_url ? (
                <img src={details?.image_url} alt={details?.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-200 dark:text-slate-600">
                  <Package size={64} />
                </div>
              )}
            </div>

            {/* Quick stats under image */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-600">
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">الكمية</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{details?.quantity.toLocaleString('ar-EG')}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{details?.unit}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-600">
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">الحالة</p>
                <span className={`badge-${status.color} justify-center`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {status?.label}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="md:col-span-2 space-y-5">
            {/* Name + code + breadcrumb */}
            <div>
              <div className="flex items-start gap-3 flex-wrap">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight">{details.name}</h2>
                <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-lg self-start mt-1">
                  {details.code}
                </span>
              </div>
              {pathParts?.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap mt-2">
                  <Layers size={12} className="text-slate-400 shrink-0" />
                  {pathParts?.map((part, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="text-xs bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-lg">{part}</span>
                      {i < pathParts?.length - 1 && <ChevronLeft size={10} className="text-slate-300 dark:text-slate-600" />}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing card */}
            <div className="bg-gradient-to-l from-teal-50 to-teal-50/30 dark:from-teal-900/20 dark:to-transparent border border-teal-100 dark:border-teal-800/50 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Tag size={15} className="text-teal-600 dark:text-teal-400" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">التسعير</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">السعر الأساسي</p>
                  <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{details?.base_price.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">نسبة الربح</p>
                  <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{details?.margin_pct}%</p>
                </div>
                <div>
                  <p className="text-xs text-teal-500 dark:text-teal-400 mb-1">السعر النهائي</p>
                  <p className="text-xl font-bold text-teal-600 dark:text-teal-400">{details?.final_price.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-teal-100 dark:border-teal-800/50">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  قيمة المخزون الإجمالية:
                  <span className="font-bold text-slate-700 dark:text-slate-200 mr-1">
                    {(details?.final_price * details?.quantity).toLocaleString('ar-EG', { maximumFractionDigits: 2 })} ج
                  </span>
                </p>
              </div>
            </div>

            {/* Specs */}
            {(details?.length_cm || details?.width_cm || details?.height_cm || details?.size || details?.unit || details?.color) && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <Ruler size={14} className="text-slate-500 dark:text-slate-400" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">المواصفات</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {details?.unit && (
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">وحدة القياس</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{details?.unit}</p>
                    </div>
                  )}
                  {details?.size && (
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">الحجم</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{details?.size}</p>
                    </div>
                  )}
                  {details?.length_cm && (
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">الطول</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{details.length_cm} سم</p>
                    </div>
                  )}
                  {details?.width_cm && (
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">العرض</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{details?.width_cm} سم</p>
                    </div>
                  )}
                  {details?.height_cm && (
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">الارتفاع</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{details?.height_cm} سم</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(details?.color || details?.descrption) && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700 space-y-3">
                {details?.color && <p className="text-sm text-slate-600 dark:text-slate-300"><span className="font-bold">اللون:</span> {details?.color}</p>}
                {details?.descrption && <p className="text-sm text-slate-600 dark:text-slate-300"><span className="font-bold">الوصف:</span> {details?.descrption}</p>}
              </div>
            )}

            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <History size={14} className="text-slate-500 dark:text-slate-400" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">سجل المخزون</span>
              </div>
              {details.stockHistory?.length ? (
                <div className="space-y-2">
                  {details.stockHistory.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between text-xs border-b border-slate-200 dark:border-slate-600 pb-2 last:border-0 last:pb-0">
                      <span className={entry.change >= 0 ? 'text-green-600 dark:text-green-400 font-bold' : 'text-red-600 dark:text-red-400 font-bold'}>
                        {entry.change >= 0 ? '+' : ''}{entry.change}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">{entry.notes || entry.operation}</span>
                      <span className="text-slate-400 dark:text-slate-500">{new Date(entry.createdAt).toLocaleString('ar-EG')}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-slate-400 dark:text-slate-500">لا يوجد سجل مخزون</p>}
            </div>

            <p className="text-xs text-slate-300 dark:text-slate-600" dir="ltr">
              أُضيف: {new Date(details?.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Delete confirm overlay */}
        {confirmDelete && (
          <div className="absolute inset-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-2xl flex items-center justify-center p-6 z-20">
            <div className="text-center">
              <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={26} className="text-red-500 dark:text-red-400" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-2">تأكيد الحذف</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">"{product.name}"</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setConfirmDelete(false)} className="btn-secondary">إلغاء</button>
                <button onClick={handleDelete} disabled={deleting} className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 font-semibold text-sm flex gap-2 items-center disabled:opacity-50">
                  {deleting && <Loader2 size={15} className="animate-spin" />} حذف
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
