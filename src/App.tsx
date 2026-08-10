import { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import CategoriesPage from './pages/CategoriesPage';
import ProductsPage from './pages/ProductsPage';
import ProductForm from './pages/ProductForm';
import ProductDetail from './pages/ProductDetail';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import AuthPage from './pages/AuthPage';
import { useAuth } from './context/AuthContext';
import { Product } from './lib/supabase';
import { Loader2 } from 'lucide-react';

type Page = 'dashboard' | 'products' | 'categories' | 'reports' | 'settings';

const PAGE_TITLES: Record<Page, { title: string; subtitle: string }> = {
  dashboard:  { title: 'لوحة التحكم', subtitle: 'نظرة عامة على المخزون' },
  products:   { title: 'المنتجات', subtitle: 'إدارة قائمة المنتجات' },
  categories: { title: 'الأقسام', subtitle: 'إدارة الأقسام والتصنيفات' },
  reports:    { title: 'التقارير', subtitle: 'تقارير وإحصائيات المخزون' },
  settings:   { title: 'الإعدادات', subtitle: 'إعدادات النظام' },
};

export default function App() {
  const { session, loading } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [productForm, setProductForm] = useState<{ open: boolean; product?: Product | null }>({ open: false });
  const [productDetail, setProductDetail] = useState<Product | null>(null);
  const [productsKey, setProductsKey] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center" dir="rtl">
        <Loader2 size={32} className="animate-spin text-teal-600" />
      </div>
    );
  }

  if (!session) return <AuthPage />;

  function navigate(p: string) { setPage(p as Page); }
  function openAdd() { setProductDetail(null); setProductForm({ open: true, product: null }); }
  function openEdit(product: Product) { setProductDetail(null); setProductForm({ open: true, product }); }
  function handleFormSaved() { setProductForm({ open: false }); setProductsKey(k => k + 1); }

  const { title, subtitle } = PAGE_TITLES[page];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden" dir="rtl">
      <Sidebar currentPage={page} onNavigate={p => navigate(p)} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title={title} subtitle={subtitle} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-5">
          {page === 'dashboard'  && <Dashboard onNavigate={navigate} />}
          {page === 'products'   && <ProductsPage key={productsKey} onAddProduct={openAdd} onEditProduct={openEdit} onViewProduct={setProductDetail} />}
          {page === 'categories' && <CategoriesPage />}
          {page === 'reports'    && <ReportsPage />}
          {page === 'settings'   && <SettingsPage />}
        </main>
      </div>

      {productForm.open && (
        <ProductForm product={productForm.product} onClose={() => setProductForm({ open: false })} onSaved={handleFormSaved} />
      )}
      {productDetail && (
        <ProductDetail
          product={productDetail}
          onClose={() => setProductDetail(null)}
          onEdit={product => { setProductDetail(null); setProductForm({ open: true, product }); }}
          onDelete={() => { setProductDetail(null); setProductsKey(k => k + 1); }}
        />
      )}
    </div>
  );
}