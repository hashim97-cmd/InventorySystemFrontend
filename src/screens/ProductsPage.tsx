import { useEffect, useState, useCallback } from 'react';
import {
  Search, Plus, Minus, Package, Filter, X, Pencil, Trash2,
  Loader2, AlertTriangle, List, Grid3X3, ChevronLeft, Home, ChevronRight,
} from 'lucide-react';
import { supabase, Product, Category, buildCategoryTree, getCategoryPath, getStockStatus, flattenCategories } from '../lib/supabase';
import CategoryFilterPanel from '../components/CategoryFilterPanel';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 12;

type View = 'list' | 'browse';

type Props = {
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  onStockChange: (product: Product, change: number) => Promise<void>;
};

export default function ProductsPage({ onAddProduct, onEditProduct, onViewProduct, onStockChange }: Props) {
  const [view, setView] = useState<View>('list');
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [stockTarget, setStockTarget] = useState<{ product: Product; direction: 1 | -1 } | null>(null);
  const [stockAmount, setStockAmount] = useState('');
  const { user } = useAuth();
  const canDelete = user?.role === 'admin' || user?.role === 'super_admin';

  // Browse mode state
  const [browseCatId, setBrowseCatId] = useState<string | null>(null);
  const [browsePath, setBrowsePath] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (view === 'list') loadProducts();
  }, [page, search, filterCategoryId, view]);

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    if (data) setCategories(buildCategoryTree(data as Category[]));
  }

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const flat = flattenCategories(categories.length ? categories : []);

    let query = supabase.from('products').select('*', { count: 'exact' });

    if (search.trim()) {
      query = query.or(`name.ilike.%${search.trim()}%,code.ilike.%${search.trim()}%`);
    }

    if (filterCategoryId) {
      const ids = getAllIds(filterCategoryId, flat);
      query = query.in('category_id', ids);
    }

    const from = (page - 1) * PAGE_SIZE;
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (!error) {
      setProducts((data as Product[]) ?? []);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [page, search, filterCategoryId, categories]);

  useEffect(() => {
    if (view === 'list' && categories.length > 0) loadProducts();
  }, [loadProducts, view]);

  function getAllIds(catId: string, flat: Category[]): string[] {
    const children = flat.filter(c => c.parent_id === catId);
    return [catId, ...children.flatMap(c => getAllIds(c.id, flat))];
  }

  async function handleDelete() {
    if (!deleteTarget || !canDelete) return;
    setDeleting(true);
    await supabase.from('products').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    loadProducts();
  }

  function openStockDialog(product: Product, direction: 1 | -1) {
    setStockAmount('');
    setStockTarget({ product, direction });
  }

  function requestStockChange(product: Product, change: number): Promise<void> {
    openStockDialog(product, change > 0 ? 1 : -1);
    return Promise.resolve();
  }

  async function submitStockChange() {
    if (!stockTarget) return;
    const amount = Number(stockAmount);
    if (!Number.isInteger(amount) || amount <= 0) return;
    const change = stockTarget.direction * amount;
    if (stockTarget.product.quantity + change < 0) return;
    await onStockChange(stockTarget.product, change);
    setStockTarget(null);
  }

  function handleFilterChange(id: string) {
    setFilterCategoryId(id);
    setPage(1);
  }

  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  // Browse helpers
  const flat = flattenCategories(categories);
  function navigateBrowse(cat: Category) {
    setBrowseCatId(cat.id);
    setBrowsePath(p => [...p, cat]);
  }

  function browseTo(idx: number) {
    if (idx === -1) { setBrowseCatId(null); setBrowsePath([]); return; }
    const newPath = browsePath.slice(0, idx + 1);
    setBrowsePath(newPath);
    setBrowseCatId(newPath[newPath.length - 1]?.id ?? null);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const filterLabel = filterCategoryId ? flat.find(c => c.id === filterCategoryId)?.name : '';

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="card py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 flex-1 min-w-0">
            <Search size={15} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="بحث باسم المنتج أو الكود..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="bg-transparent text-sm text-slate-600 dark:text-slate-300 outline-none w-full placeholder-slate-400 dark:placeholder-slate-500"
            />
            {search && <button onClick={() => handleSearch('')}><X size={13} className="text-slate-400" /></button>}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filter toggle (mobile) */}
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className={`lg:hidden btn-secondary flex-1 sm:flex-none justify-center ${filterCategoryId ? 'border-teal-300 text-teal-700 bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:bg-teal-900/20' : ''}`}
            >
              <Filter size={14} />
              {filterLabel || 'فلترة'}
              {filterCategoryId && <button onClick={e => { e.stopPropagation(); handleFilterChange(''); }}><X size={12} /></button>}
            </button>

            {/* View toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1 shrink-0">
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${view === 'list' ? 'bg-white dark:bg-slate-600 text-teal-700 dark:text-teal-300 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <List size={13} /> قائمة
              </button>
              <button
                onClick={() => setView('browse')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${view === 'browse' ? 'bg-white dark:bg-slate-600 text-teal-700 dark:text-teal-300 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <Grid3X3 size={13} /> تصفح
              </button>
            </div>

            <button onClick={onAddProduct} className="btn-primary shrink-0">
              <Plus size={15} />
              <span className="hidden sm:inline">إضافة</span>
            </button>
          </div>
        </div>
        {view === 'list' && total > 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{total} منتج</p>
        )}
      </div>

      {view === 'browse' ? (
        <BrowseView
          categories={categories}
          browseCatId={browseCatId}
          browsePath={browsePath}
          flat={flat}
          onNavigate={navigateBrowse}
          onBreadcrumb={browseTo}
          onView={onViewProduct}
          onEdit={onEditProduct}
          onDelete={canDelete ? setDeleteTarget : () => undefined}
          canDelete={canDelete}
          onStockChange={requestStockChange}
        />
      ) : (
        <div className="flex gap-4">
          {/* Sidebar filter (desktop) */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="card p-4 sticky top-24">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">الأقسام</span>
                {filterCategoryId && (
                  <button onClick={() => handleFilterChange('')} className="text-xs text-teal-600 dark:text-teal-400 hover:underline">
                    مسح
                  </button>
                )}
              </div>
              <CategoryFilterPanel
                categories={categories}
                value={filterCategoryId}
                onChange={handleFilterChange}
              />
            </div>
          </aside>

          {/* Mobile filter drawer */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
              <div className="absolute top-0 right-0 h-full w-72 bg-white dark:bg-slate-800 shadow-xl p-5 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-slate-800 dark:text-slate-100">فلترة بالقسم</span>
                  <button onClick={() => setSidebarOpen(false)} className="btn-icon"><X size={18} /></button>
                </div>
                <CategoryFilterPanel
                  categories={categories}
                  value={filterCategoryId}
                  onChange={id => { handleFilterChange(id); setSidebarOpen(false); }}
                />
              </div>
            </div>
          )}

          {/* Products content */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="card flex items-center justify-center py-20 text-slate-400">
                <Loader2 size={28} className="animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <EmptyState hasSearch={!!search || !!filterCategoryId} onAdd={onAddProduct} />
            ) : (
              <>
                {/* Mobile: cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:hidden">
                  {products.map(p => (
                    <MobileProductCard
                      key={p.id}
                      product={p}
                      categories={categories}
                      onView={onViewProduct}
                      onEdit={onEditProduct}
                      onDelete={canDelete ? setDeleteTarget : () => undefined}
                      canDelete={canDelete}
                      onStockChange={requestStockChange}
                    />
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden lg:block card overflow-hidden p-0">
                  <DesktopTable
                    products={products}
                    onView={onViewProduct}
                    onEdit={onEditProduct}
                    onDelete={canDelete ? setDeleteTarget : () => undefined}
                    canDelete={canDelete}
                    onStockChange={requestStockChange}
                  />
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                      className="btn-secondary py-1.5 px-3 disabled:opacity-40"
                    >
                      <ChevronRight size={15} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                      .reduce<(number | '...')[]>((acc, n, idx, arr) => {
                        if (idx > 0 && (n as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                        acc.push(n);
                        return acc;
                      }, [])
                      .map((n, i) =>
                        n === '...' ? (
                          <span key={`dots-${i}`} className="text-slate-400 px-1">…</span>
                        ) : (
                          <button
                            key={n}
                            onClick={() => setPage(n as number)}
                            className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${page === n
                              ? 'bg-teal-600 text-white shadow-sm'
                              : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                              }`}
                          >
                            {n}
                          </button>
                        )
                      )}
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(p => p + 1)}
                      className="btn-secondary py-1.5 px-3 disabled:opacity-40"
                    >
                      <ChevronLeft size={15} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-red-500 dark:text-red-400" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-2">حذف المنتج</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">"{deleteTarget.name}"</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeleteTarget(null)} className="btn-secondary">إلغاء</button>
                <button onClick={handleDelete} disabled={deleting} className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 font-semibold text-sm flex items-center gap-2 disabled:opacity-50">
                  {deleting && <Loader2 size={15} className="animate-spin" />} حذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {stockTarget && (
        <div className="modal-backdrop" onClick={() => setStockTarget(null)}>
          <div className="modal-box max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
              {stockTarget.direction === 1 ? 'إضافة للمخزون' : 'إنقاص من المخزون'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{stockTarget.product.name}</p>
            <input
              autoFocus
              type="number"
              min="1"
              max={stockTarget.direction === -1 ? stockTarget.product.quantity : undefined}
              value={stockAmount}
              onChange={e => setStockAmount(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void submitStockChange(); }}
              placeholder="أدخل الكمية"
              className="input text-lg"
            />
            <div className="flex gap-3 justify-end mt-5">
              <button onClick={() => setStockTarget(null)} className="btn-secondary">إلغاء</button>
              <button onClick={() => void submitStockChange()} className="btn-primary" disabled={!stockAmount || Number(stockAmount) <= 0}>
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Browse View ---- */
function BrowseView({ categories, browseCatId, browsePath, flat, onNavigate, onBreadcrumb, onView, onEdit, onDelete, canDelete, onStockChange }: {
  categories: Category[];
  browseCatId: string | null;
  browsePath: Category[];
  flat: Category[];
  onNavigate: (cat: Category) => void;
  onBreadcrumb: (idx: number) => void;
  onView: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  canDelete: boolean;
  onStockChange: (p: Product, change: number) => Promise<void>;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const children = browseCatId
    ? flat.find(c => c.id === browseCatId)?.children ?? []
    : categories;

  useEffect(() => {
    if (!browseCatId) { setProducts([]); return; }
    setLoading(true);
    supabase.from('products').select('*').eq('category_id', browseCatId).order('name').then(({ data }) => {
      setProducts((data as Product[]) ?? []);
      setLoading(false);
    });
  }, [browseCatId]);

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="card py-3 px-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => onBreadcrumb(-1)} className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium">
            <Home size={13} /> الرئيسية
          </button>
          {browsePath.map((cat, idx) => (
            <span key={cat.id} className="flex items-center gap-1.5">
              <ChevronLeft size={12} className="text-slate-300 dark:text-slate-600" />
              <button
                onClick={() => onBreadcrumb(idx)}
                className={`text-sm font-medium transition-colors ${idx === browsePath.length - 1
                  ? 'text-teal-700 dark:text-teal-300 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400'
                  }`}
              >
                {cat.name}
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Sub-categories */}
      {children.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">الأقسام الفرعية</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {children.map(cat => (
              <button
                key={cat.id}
                onClick={() => onNavigate(cat)}
                className="card p-4 text-center hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-md transition-all active:scale-95 group"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mx-auto mb-2 group-hover:bg-teal-100 dark:group-hover:bg-teal-800/40 transition-colors">
                  <Package size={18} className="text-teal-600 dark:text-teal-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight truncate">{cat.name}</p>
                {(cat.children?.length ?? 0) > 0 && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{cat.children!.length} قسم فرعي</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products in current category */}
      {browseCatId && (
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">المنتجات في هذا القسم</p>
          {loading ? (
            <div className="card flex items-center justify-center py-12 text-slate-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="card text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
              لا توجد منتجات مباشرة في هذا القسم
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {products.map(p => (
                <ProductBrowseCard
                  key={p.id}
                  product={p}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  canDelete={canDelete}
                  onStockChange={onStockChange}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {!browseCatId && (
        <div className="card text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
          اختر قسمًا للاستعراض
        </div>
      )}
    </div>
  );
}

/* ---- Product Browse Card ---- */
function ProductBrowseCard({ product, onView, onEdit, onDelete, canDelete, onStockChange }: {
  product: Product; onView: (p: Product) => void; onEdit: (p: Product) => void; onDelete: (p: Product) => void; canDelete: boolean; onStockChange: (p: Product, change: number) => Promise<void>;
}) {
  const status = getStockStatus(product.quantity);
  return (
    <div className="card p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onView(product)}>
      <div className="flex gap-3">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 border border-slate-100 dark:border-slate-600">
          {product.image_url
            ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600"><Package size={22} /></div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{product.name}</p>
          <p className="text-xs font-mono text-slate-400 dark:text-slate-500">{product.code}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`badge-${status.color} text-xs`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
              {status.label}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{product.quantity} {product.unit}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        <span className="text-sm font-bold text-teal-600 dark:text-teal-400">{product.final_price.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج</span>
        <div className="flex items-center gap-1">
          <button onClick={e => { e.stopPropagation(); void onStockChange(product, -1); }} disabled={product.quantity === 0} className="btn-icon" title="إنقاص المخزون"><Minus size={14} /></button>
          <button onClick={e => { e.stopPropagation(); void onStockChange(product, 1); }} className="btn-icon-teal" title="إضافة للمخزون"><Plus size={14} /></button>
          <button onClick={e => { e.stopPropagation(); onEdit(product); }} className="btn-icon"><Pencil size={14} /></button>
          {canDelete && <button onClick={e => { e.stopPropagation(); onDelete(product); }} className="btn-icon-red"><Trash2 size={14} /></button>}
        </div>
      </div>
    </div>
  );
}

/* ---- Mobile Product Card ---- */
function MobileProductCard({ product, categories, onView, onEdit, onDelete, canDelete, onStockChange }: {
  product: Product; categories: Category[];
  onView: (p: Product) => void; onEdit: (p: Product) => void; onDelete: (p: Product) => void; canDelete: boolean; onStockChange: (p: Product, change: number) => Promise<void>;
}) {
  const status = getStockStatus(product.quantity);
  const path = getCategoryPath(product.category_id, categories);
  return (
    <div className="card p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onView(product)}>
      <div className="flex gap-3 mb-3">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 border border-slate-100 dark:border-slate-600">
          {product.image_url
            ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600"><Package size={20} /></div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight truncate">{product.name}</p>
          <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5">{product.code}</p>
          <span className={`badge-${status.color} mt-1.5 text-xs`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {status.label}
          </span>
        </div>
      </div>
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5 mb-3 text-xs text-slate-500 dark:text-slate-400 truncate">
        {path}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-base font-bold text-teal-600 dark:text-teal-400">{product.final_price.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 mr-1.5">{product.quantity} {product.unit}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={e => { e.stopPropagation(); void onStockChange(product, -1); }} disabled={product.quantity === 0} className="btn-icon" title="إنقاص المخزون"><Minus size={15} /></button>
          <button onClick={e => { e.stopPropagation(); void onStockChange(product, 1); }} className="btn-icon-teal" title="إضافة للمخزون"><Plus size={15} /></button>
          <button onClick={e => { e.stopPropagation(); onEdit(product); }} className="btn-icon"><Pencil size={15} /></button>
          {canDelete && <button onClick={e => { e.stopPropagation(); onDelete(product); }} className="btn-icon-red"><Trash2 size={15} /></button>}
        </div>
      </div>
    </div>
  );
}

/* ---- Desktop Table ---- */
function DesktopTable({ products, onView, onEdit, onDelete, canDelete, onStockChange }: {
  products: Product[];
  onView: (p: Product) => void; onEdit: (p: Product) => void; onDelete: (p: Product) => void; canDelete: boolean; onStockChange: (p: Product, change: number) => Promise<void>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 dark:bg-slate-700/40 border-b border-slate-100 dark:border-slate-700">
          <tr>
            <th className="py-3 px-4">المنتج</th>
            <th className="py-3 px-4">اللون</th>
            <th className="py-3 px-4">الوصف</th>
            <th className="py-3 px-4">الكمية</th>
            <th className="py-3 px-4">السعر</th>
            <th className="py-3 px-4">السعر النهائي</th>
            <th className="py-3 px-4">الحجم</th>
            <th className="py-3 px-4">الحالة</th>
            <th className="py-3 px-4 w-24" />
          </tr>
        </thead>
        <tbody>
          {products.map(product => {
            const status = getStockStatus(product.quantity);
            return (
              <tr key={product.id} onClick={() => onView(product)} className="table-row-hover border-b border-slate-50 dark:border-slate-700/50 cursor-pointer">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 border border-slate-100 dark:border-slate-600">
                      {product.image_url
                        ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600"><Package size={16} /></div>
                      }
                    </div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{product.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs text-slate-600 dark:text-slate-300">{product.color || '—'}</span>
                </td>
                <td className="py-3 px-4 max-w-[180px]">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">{product.descrption || '—'}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{product.quantity.toLocaleString('ar-EG')} <span className="text-xs font-normal text-slate-400">{product.unit}</span></span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">{product.base_price.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">{product.final_price.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{product.size || '—'}</span>
                </td>
                <td className="py-3 px-4">
                  <span className={`badge-${status.color}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {status.label}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={e => { e.stopPropagation(); void onStockChange(product, -1); }} disabled={product.quantity === 0} className="btn-icon" title="إنقاص المخزون"><Minus size={14} /></button>
                    <button onClick={e => { e.stopPropagation(); void onStockChange(product, 1); }} className="btn-icon-teal" title="إضافة للمخزون"><Plus size={14} /></button>
                    <button onClick={e => { e.stopPropagation(); onEdit(product); }} className="btn-icon" title="تعديل"><Pencil size={14} /></button>
                    {canDelete && <button onClick={e => { e.stopPropagation(); onDelete(product); }} className="btn-icon-red" title="حذف"><Trash2 size={14} /></button>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ hasSearch, onAdd }: { hasSearch: boolean; onAdd: () => void }) {
  return (
    <div className="card text-center py-16 text-slate-400 dark:text-slate-600">
      {hasSearch ? (
        <>
          <Search size={36} className="mx-auto mb-3 text-slate-200 dark:text-slate-700" />
          <p className="text-sm">لا توجد منتجات تطابق البحث</p>
        </>
      ) : (
        <>
          <Package size={40} className="mx-auto mb-3 text-slate-200 dark:text-slate-700" />
          <p className="font-medium mb-1 text-slate-500 dark:text-slate-400">لا توجد منتجات بعد</p>
          <button onClick={onAdd} className="btn-primary mx-auto mt-3">
            <Plus size={14} /> إضافة أول منتج
          </button>
        </>
      )}
    </div>
  );
}
