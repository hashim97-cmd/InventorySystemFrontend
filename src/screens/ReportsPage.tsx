import { useEffect, useState } from 'react';
import { Loader2, TrendingDown, DollarSign, Package, AlertTriangle, BarChart2 } from 'lucide-react';
import { supabase, Product, Category, buildCategoryTree, flattenCategories, getCategoryPath } from '../lib/supabase';
import { getLowStockProducts, getOutOfStockProducts, getProducts } from '../lib/api';

type Props = {
  onViewProduct: (product: Product) => void;
};

export default function ReportsPage({ onViewProduct }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [outOfStock, setOutOfStock] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getProducts({ limit: 10000, sort_by: 'finalPrice', sort_dir: 'desc' }),
      getLowStockProducts(),
      getOutOfStockProducts(),
      supabase.from('categories').select('*').order('sort_order'),
    ]).then(([{ data: prods }, low, out, { data: cats }]) => {
      if (prods) setProducts(prods);
      setLowStock(low);
      setOutOfStock(out);
      if (cats) setCategories(buildCategoryTree(cats as Category[]));
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400 dark:text-slate-600">
      <Loader2 size={30} className="animate-spin" />
    </div>
  );

  const totalValue = products.reduce((s, p) => s + p.final_price * p.quantity, 0);
  const flat = flattenCategories(categories);

  // Category value breakdown
  const rootCats = flat.filter(c => !c.parent_id);
  const catValues = rootCats.map(rc => {
    const ids = [rc.id, ...getAllDescIds(rc.id, flat)];
    const value = products.filter(p => p.category_id && ids.includes(p.category_id))
      .reduce((s, p) => s + p.final_price * p.quantity, 0);
    const count = products.filter(p => p.category_id && ids.includes(p.category_id)).length;
    return { ...rc, value, count };
  }).filter(c => c.value > 0).sort((a, b) => b.value - a.value);

  const maxVal = Math.max(...catValues.map(c => c.value), 1);

  // Top by value
  const topByValue = [...products]
    .sort((a, b) => (b.final_price * b.quantity) - (a.final_price * a.quantity))
    .slice(0, 8);

  return (
    <div className="space-y-5">
      {/* Summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي قيمة المخزون', value: `${totalValue.toLocaleString('ar-EG', { maximumFractionDigits: 0 })} ج`, icon: <DollarSign size={20} />, color: 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400' },
          { label: 'إجمالي المنتجات', value: products.length, icon: <Package size={20} />, color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
          { label: 'كمية منخفضة', value: lowStock.length, icon: <TrendingDown size={20} />, color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
          { label: 'نفذ من المخزون', value: outOfStock.length, icon: <AlertTriangle size={20} />, color: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
        ].map((c, i) => (
          <div key={i} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 leading-tight">{c.label}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{c.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color}`}>{c.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Category Value Chart */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 size={18} className="text-teal-600 dark:text-teal-400" />
            <h2 className="section-title">قيمة المخزون حسب القسم</h2>
          </div>
          {catValues.length === 0 ? (
            <p className="text-muted text-center py-8">لا توجد بيانات</p>
          ) : (
            <div className="space-y-3">
              {catValues.map(cat => (
                <div key={cat.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">{cat.name}</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0 mr-2">{cat.value.toLocaleString('ar-EG', { maximumFractionDigits: 0 })} ج</span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-teal-500 to-teal-400 transition-all duration-700"
                      style={{ width: `${(cat.value / maxVal) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{cat.count} منتج</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle size={18} className="text-amber-500 dark:text-amber-400" />
            <h2 className="section-title">تنبيهات المخزون</h2>
          </div>
          {outOfStock.length === 0 && lowStock.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package size={22} className="text-green-500 dark:text-green-400" />
              </div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">المخزون في حالة جيدة</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {outOfStock.map(p => (
                <button key={p.id} type="button" onClick={() => onViewProduct(p)} className="w-full flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/50 text-right hover:shadow-sm transition-shadow">
                  <span className="badge-red shrink-0">نفذ</span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex-1 truncate">{p.name}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{getCategoryPath(p.category_id, categories)}</span>
                </button>
              ))}
              {lowStock.map(p => (
                <button key={p.id} type="button" onClick={() => onViewProduct(p)} className="w-full flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/50 text-right hover:shadow-sm transition-shadow">
                  <span className="badge-amber shrink-0">منخفض</span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex-1 truncate">{p.name}</span>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0">{p.quantity} {(p as any).unit}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Products by inventory value */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <TrendingDown size={18} className="text-teal-600 dark:text-teal-400" />
          <h2 className="section-title">أعلى المنتجات قيمةً في المخزون</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px]">
            <thead className="border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="pb-3 text-right text-xs text-slate-400 dark:text-slate-500">#</th>
                <th className="pb-3 text-right text-xs text-slate-400 dark:text-slate-500">المنتج</th>
                <th className="pb-3 text-right text-xs text-slate-400 dark:text-slate-500">القسم</th>
                <th className="pb-3 text-right text-xs text-slate-400 dark:text-slate-500">الكمية</th>
                <th className="pb-3 text-right text-xs text-slate-400 dark:text-slate-500">السعر</th>
                <th className="pb-3 text-right text-xs text-slate-400 dark:text-slate-500">إجمالي القيمة</th>
              </tr>
            </thead>
            <tbody>
              {topByValue.map((p, i) => (
                <tr key={p.id} className="table-row-hover border-b border-slate-50 dark:border-slate-700/50">
                  <td className="py-3 text-sm font-bold text-slate-400 dark:text-slate-500">{i + 1}</td>
                  <td className="py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{p.name}</td>
                  <td className="py-3 text-xs text-slate-500 dark:text-slate-400 max-w-[140px] truncate">{getCategoryPath(p.category_id, categories)}</td>
                  <td className="py-3 text-sm text-slate-700 dark:text-slate-200">{p.quantity} <span className="text-xs text-slate-400">{(p as any).unit}</span></td>
                  <td className="py-3 text-sm text-teal-600 dark:text-teal-400 font-semibold">{p.final_price.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج</td>
                  <td className="py-3 text-sm font-bold text-slate-700 dark:text-slate-200">{(p.final_price * p.quantity).toLocaleString('ar-EG', { maximumFractionDigits: 0 })} ج</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getAllDescIds(id: string, flat: Category[]): string[] {
  const children = flat.filter(c => c.parent_id === id);
  return children.flatMap(c => [c.id, ...getAllDescIds(c.id, flat)]);
}
