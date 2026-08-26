import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

type Page = 'dashboard' | 'products' | 'categories' | 'reports' | 'settings';

const PAGE_TITLES: Record<Page, { title: string; subtitle: string }> = {
    dashboard: { title: 'لوحة التحكم', subtitle: 'نظرة عامة على المخزون' },
    products: { title: 'المنتجات', subtitle: 'إدارة قائمة المنتجات' },
    categories: { title: 'الأقسام', subtitle: 'إدارة الأقسام والتصنيفات' },
    reports: { title: 'التقارير', subtitle: 'تقارير وإحصائيات المخزون' },
    settings: { title: 'الإعدادات', subtitle: 'إعدادات النظام' },
};

export default function NextAppShell({ page, children }: { page: Page; children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) void router.replace('/login');
    }, [loading, user, router]);

    if (loading || !user) {
        return loading ? <div className="min-h-screen flex items-center justify-center"><Loader2 size={32} className="animate-spin text-teal-600" /></div> : null;
    }

    const { title, subtitle } = PAGE_TITLES[page];
    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden" dir="rtl">
            <Sidebar currentPage={page} onNavigate={nextPage => void router.push(`/${nextPage}`)} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopBar title={title} subtitle={subtitle} onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4 sm:p-5">{children}</main>
            </div>
        </div>
    );
}

