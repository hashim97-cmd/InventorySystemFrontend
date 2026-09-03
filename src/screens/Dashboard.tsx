import { useEffect, useState } from 'react';
import { Package, Layers, AlertTriangle, TrendingUp, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase, Product, Category, buildCategoryTree, getCategoryPath, getStockStatus } from '../lib/supabase';
import { api } from '../lib/api';
import Link from 'next/link';

type Props = { onNavigate: (page: string) => void };

export default function Dashboard({ onNavigate }: Props) {
  const [stats, setStats] = useState({ totalProducts: 0, totalCategories: 0, lowStock: 0, totalValue: 0 });
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryStats, setCategoryStats] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: products }, { data: cats }, { data: lowStockResponse }] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }).range(0, 9999),
      supabase.from('categories').select('*').order('sort_order'),
      api.get('/products/low-stock', { params: { limit: 1 } }),
    ]);
    if (products && cats) {
      const tree = buildCategoryTree(cats as Category[]);
      setCategories(tree);
      const low = lowStockResponse.total ?? 0;
      const totalValue = products.reduce((s: number, p: Product) => s + (p.final_price * p.quantity), 0);
      setStats({ totalProducts: products.length, totalCategories: cats.length, lowStock: low, totalValue });
      setRecentProducts((products as Product[]).slice(0, 7));
      const flat = cats as Category[];
      const rootCats = flat.filter((c: Category) => !c.parent_id);
      setCategoryStats(
        rootCats.map((rc: Category) => {
          const ids = [rc.id, ...getAllDesc(rc.id, flat)];
          return { name: rc.name, count: products.filter((p: Product) => p.category_id && ids.includes(p.category_id)).length };
        }).filter(s => s.count > 0)
      );
    }
    setLoading(false);
  }

  function getAllDesc(id: string, cats: Category[]): string[] {
    return cats.filter(c => c.parent_id === id).flatMap(c => [c.id, ...getAllDesc(c.id, cats)]);
  }

  const maxCount = Math.max(...categoryStats.map(s => s.count), 1);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400 dark:text-slate-600">
      <Loader2 size={30} className="animate-spin" />
    </div>
  );

  const cards = [
    { label: 'إجمالي المنتجات', value: stats.totalProducts, icon: <Package size={20} />, color: 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400', border: 'border-teal-100 dark:border-teal-900', link: '/products' },
    { label: 'إجمالي الأقسام', value: stats.totalCategories, icon: <Layers size={20} />, color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-900', link: "/categories" },
    { label: 'مخزون منخفض / نفذ', value: stats.lowStock, icon: <AlertTriangle size={20} />, color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-900', link: "/reports" },
    { label: 'إجمالي قيمة المخزون', value: `${stats.totalValue.toLocaleString('ar-EG', { maximumFractionDigits: 0 })} ج`, icon: <TrendingUp size={20} />, color: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400', border: 'border-green-100 dark:border-green-900', link: "/reports" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <Link href={c.link}>
            <div key={i} className={`card border ${c.border} hover:shadow-md transition-shadow`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 leading-tight">{c.label}</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{c.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color}`}>{c.icon}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Recent Products */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">أحدث المنتجات</h2>
            <button onClick={() => onNavigate('products')} className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 text-sm font-semibold flex items-center gap-1 transition-colors">
              عرض الكل <ArrowLeft size={13} />
            </button>
          </div>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="pb-3 pr-0">المنتج</th>
                  <th className="pb-3">القسم</th>
                  <th className="pb-3">الكمية</th>
                  <th className="pb-3">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.map(product => {
                  const status = getStockStatus(product.quantity);
                  const path = getCategoryPath(product.category_id, categories);
                  return (
                    <tr key={product.id} className="table-row-hover border-b border-slate-50 dark:border-slate-700/50">
                      <td className="py-3 pr-0">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 border border-slate-100 dark:border-slate-600">
                            {product.image_url
                              ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600"><Package size={14} /></div>
                            }
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">{product.name}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{product.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-xs text-slate-500 dark:text-slate-400 max-w-[140px] truncate">{path}</td>
                      <td className="py-3 text-sm font-bold text-slate-700 dark:text-slate-200">{product.quantity} <span className="text-xs font-normal text-slate-400">{(product as any).unit}</span></td>
                      <td className="py-3">
                        <span className={`badge-${status.color}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />{status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {recentProducts.length === 0 && (
                  <tr><td colSpan={4} className="py-10 text-center text-muted">لا توجد منتجات بعد</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category chart */}
        <div className="card">
          <h2 className="section-title mb-5">المنتجات حسب القسم</h2>
          {categoryStats.length > 0 ? (
            <div className="space-y-3">
              {categoryStats.map((s, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate">{s.name}</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0 mr-2">{s.count}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-teal-500 to-teal-400 transition-all duration-700"
                      style={{ width: `${(s.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted text-sm">لا توجد بيانات</div>
          )}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-teal-500 shrink-0" />
              <span className="text-xs text-slate-400 dark:text-slate-500">المنتجات لكل قسم رئيسي</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
