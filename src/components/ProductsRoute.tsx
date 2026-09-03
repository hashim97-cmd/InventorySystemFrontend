'use client';

import { useState } from 'react';
import NextAppShell from './NextAppShell';
import ProductsPage from '../screens/ProductsPage';
import ProductForm from '../screens/ProductForm';
import ProductDetail from '../screens/ProductDetail';
import { Product } from '../lib/supabase';
import { getProduct, updateProduct } from '../lib/api';

export default function ProductsRoute() {
    const [formProduct, setFormProduct] = useState<Product | null | undefined>(undefined);
    const [detail, setDetail] = useState<Product | null>(null);
    const [key, setKey] = useState(0);

    async function changeStock(product: Product, change: number) {
        await updateProduct(product.id, { quantity: Math.max(0, product.quantity + change) });
        setKey(value => value + 1);
    }

    async function openProduct(product: Product) {
        setDetail(await getProduct(product.id).catch(() => product));
    }

    return <NextAppShell page="products">
        <ProductsPage key={key} onAddProduct={() => setFormProduct(null)} onEditProduct={setFormProduct} onViewProduct={openProduct} onStockChange={changeStock} />
        {formProduct !== undefined && <ProductForm product={formProduct} onClose={() => setFormProduct(undefined)} onSaved={() => { setFormProduct(undefined); setKey(value => value + 1); }} />}
        {detail && <ProductDetail product={detail} onClose={() => setDetail(null)} onEdit={product => { setDetail(null); setFormProduct(product); }} onDelete={() => { setDetail(null); setKey(value => value + 1); }} />}
    </NextAppShell>;
}
