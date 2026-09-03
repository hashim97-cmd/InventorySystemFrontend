'use client';

import { useState } from 'react';
import NextAppShell from './NextAppShell';
import ReportsPage from '../screens/ReportsPage';
import ProductDetail from '../screens/ProductDetail';
import ProductForm from '../screens/ProductForm';
import { Product } from '../lib/supabase';
import { getProduct } from '../lib/api';

export default function ReportsRoute() {
    const [detail, setDetail] = useState<Product | null>(null);
    const [formProduct, setFormProduct] = useState<Product | null | undefined>(undefined);

    async function openProduct(product: Product) {
        setDetail(await getProduct(product.id).catch(() => product));
    }

    return <NextAppShell page="reports">
        <ReportsPage onViewProduct={openProduct} />
        {formProduct !== undefined && <ProductForm product={formProduct} onClose={() => setFormProduct(undefined)} onSaved={() => setFormProduct(undefined)} />}
        {detail && <ProductDetail product={detail} onClose={() => setDetail(null)} onEdit={product => { setDetail(null); setFormProduct(product); }} onDelete={() => setDetail(null)} />}
    </NextAppShell>;
}