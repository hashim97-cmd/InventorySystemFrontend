import axios from 'axios';
import type { Category, Product } from './supabase';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL || 'http://localhost:4040/api',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});

let refreshPromise: Promise<void> | null = null;

api.interceptors.response.use(
    response => response,
    async error => {
        const request = error.config;
        const url = request?.url || '';
        if (error.response?.status !== 401 || request?._retry || url.includes('/auth/login') || url.includes('/auth/refresh')) {
            return Promise.reject(error);
        }

        request._retry = true;
        refreshPromise ??= api.post('/auth/refresh').then(() => undefined).finally(() => {
            refreshPromise = null;
        });

        try {
            await refreshPromise;
            return api(request);
        } catch {
            return Promise.reject(error);
        }
    },
);

export type AuthUser = { id: string; email: string; role: 'admin' | 'user' | 'super_admin' };

export type ManagedUser = AuthUser & {
    created_at: string;
    last_sign_in_at: string | null;
    profile_id: string | null;
};

export async function getUsers(): Promise<ManagedUser[]> {
    const { data } = await api.get('/users');
    return data;
}

export async function updateUser(id: string, payload: { role?: ManagedUser['role']; password?: string }): Promise<ManagedUser> {
    const { data } = await api.patch(`/users/${id}`, payload);
    return data;
}

export async function deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
}

export function normalizeCategory(category: any): Category {
    return {
        id: category.id,
        name: category.name,
        parent_id: category.parent_id ?? category.parentId ?? null,
        sort_order: category.sort_order ?? category.sortOrder ?? 0,
        created_at: category.created_at ?? category.createdAt ?? '',
        children: category.children,
        product_count: category.product_count ?? category.productCount,
    };
}

export function normalizeProduct(product: any): Product {
    return {
        id: product.id,
        name: product.name,
        code: product.code,
        category_id: product.category_id ?? product.categoryId ?? null,
        quantity: Number(product.quantity ?? 0),
        length_cm: product.length_cm ?? product.lengthCm ?? null,
        width_cm: product.width_cm ?? product.widthCm ?? null,
        height_cm: product.height_cm ?? product.heightCm ?? null,
        size: product.size ?? null,
        base_price: Number(product.base_price ?? product.basePrice ?? 0),
        margin_pct: Number(product.margin_pct ?? product.marginPct ?? 0),
        final_price: Number(product.final_price ?? product.finalPrice ?? 0),
        image_url: product.image_url ?? product.imageUrl ?? null,
        created_at: product.created_at ?? product.createdAt ?? '',
        updated_at: product.updated_at ?? product.updatedAt ?? '',
        unit: product.unit ?? 'قطعة',
        color: product.color ?? null,
        descrption: product.descrption ?? product.description ?? null,
        stockHistory: product.stockHistory?.map((entry: any) => ({
            id: entry.id,
            productId: entry.productId ?? entry.product_id,
            change: Number(entry.change ?? 0),
            operation: entry.operation ?? '',
            notes: entry.notes ?? null,
            createdAt: entry.createdAt ?? entry.created_at ?? '',
        })),
        category: product.category ? normalizeCategory(product.category) : undefined,
        stockAvailability: product.stockAvailability,
    } as Product;
}

export async function getProduct(id: string): Promise<Product> {
    const { data } = await api.get(`/products/${id}`);
    return normalizeProduct(data.data ?? data);
}

export async function updateProduct(id: string, payload: Record<string, unknown>): Promise<Product> {
    const { data } = await api.patch(`/products/${id}`, toApiProduct(payload));
    return normalizeProduct(data.data ?? data);
}

export async function getCategories(): Promise<Category[]> {
    const { data } = await api.get('/categories');
    return data.map(normalizeCategory);
}

export async function getProducts(params?: Record<string, string | number>): Promise<{ data: Product[]; total: number }> {
    const { data } = await api.get('/products', { params });
    return { data: (data.data ?? data).map(normalizeProduct), total: data.total ?? data.length ?? 0 };
}

export async function getLowStockProducts(): Promise<Product[]> {
    const { data } = await api.get('/products/low-stock', { params: { limit: 10000 } });
    return (data.data ?? data).map(normalizeProduct);
}

export async function getOutOfStockProducts(): Promise<Product[]> {
    const { data } = await api.get('/products/out-of-stock');
    return (data.data ?? data).map(normalizeProduct);
}

type QueryResult = { data: any; error: any; count?: number };

class ApiQuery implements PromiseLike<QueryResult> {
    private params: Record<string, any> = {};
    private operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
    private body: any;
    private id: string | undefined;

    constructor(private readonly table: 'products' | 'categories') { }

    select(_columns = '*', options?: { count?: 'exact' }) {
        if (options?.count) this.params.count = options.count;
        return this;
    }

    order(column: string, options?: { ascending?: boolean }) {
        this.params.sort_by = column === 'created_at' ? 'createdAt' : column;
        this.params.sort_dir = options?.ascending === false ? 'desc' : 'asc';
        return this;
    }

    range(from: number, to: number) {
        this.params.page = Math.floor(from / (to - from + 1)) + 1;
        this.params.limit = to - from + 1;
        return this;
    }

    eq(column: string, value: string) {
        this.id = value;
        if (column === 'category_id') this.params.categoryId = value;
        return this;
    }

    in(column: string, values: string[]) {
        if (column === 'category_id') this.params.categoryId = values[0];
        return this;
    }

    or(value: string) {
        const match = value.match(/%(.+?)%/);
        if (match) this.params.search = match[1];
        return this;
    }

    insert(body: any) { this.operation = 'insert'; this.body = body; return this; }
    update(body: any) { this.operation = 'update'; this.body = body; return this; }
    delete() { this.operation = 'delete'; return this; }

    then<TResult1 = QueryResult, TResult2 = never>(onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null) {
        return this.execute().then(onfulfilled, onrejected);
    }

    private async execute(): Promise<QueryResult> {
        try {
            const resource = `/${this.table}`;
            if (this.operation === 'delete') {
                await api.delete(`${resource}/${this.id}`);
                return { data: null, error: null };
            }
            if (this.operation === 'update') {
                await api.patch(`${resource}/${this.id}`, toApiProduct(this.body));
                return { data: null, error: null };
            }
            if (this.operation === 'insert') {
                const { data } = await api.post(resource, this.table === 'products' ? toApiProduct(this.body) : toApiCategory(this.body));
                return { data, error: null };
            }

            const { data } = await api.get(resource, { params: this.params });
            const rows = data.data ?? data;
            const normalized = rows.map(this.table === 'products' ? normalizeProduct : normalizeCategory);
            return { data: normalized, error: null, count: data.total ?? normalized.length };
        } catch (error: any) {
            return { data: null, error: error.response?.data ?? error };
        }
    }
}

function toApiCategory(body: any) {
    return { name: body.name, parentId: body.parent_id ?? body.parentId ?? null };
}

function toApiProduct(body: any) {
    return {
        ...body,
        categoryId: body.category_id ?? body.categoryId,
        lengthCm: body.length_cm ?? body.lengthCm,
        widthCm: body.width_cm ?? body.widthCm,
        heightCm: body.height_cm ?? body.heightCm,
        basePrice: body.base_price ?? body.basePrice,
        marginPct: body.margin_pct ?? body.marginPct,
        imageUrl: body.image_url ?? body.imageUrl,
        finalPrice: body.final_price ?? body.finalPrice,
    };
}

export const supabase = {
    from: (table: 'products' | 'categories') => new ApiQuery(table),
};

export { api };
export default api;
