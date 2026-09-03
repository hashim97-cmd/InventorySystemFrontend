'use client';

import NextAppShell from '../../src/components/NextAppShell';
import CategoriesPage from '../../src/screens/CategoriesPage';

export default function CategoriesRoute() {
    return <NextAppShell page="categories"><CategoriesPage /></NextAppShell>;
}
