'use client';

import { useRouter } from 'next/navigation';
import NextAppShell from '../../src/components/NextAppShell';
import Dashboard from '../../src/pages/Dashboard';

export default function DashboardRoute() {
    const router = useRouter();
    return <NextAppShell page="dashboard"><Dashboard onNavigate={page => router.push(`/${page}`)} /></NextAppShell>;
}
