import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Category = {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
  children?: Category[];
  product_count?: number;
};

export type Product = {
  id: string;
  name: string;
  code: string;
  category_id: string | null;
  quantity: number;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  size: string | null;
  base_price: number;
  margin_pct: number;
  final_price: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
};

export type ProductFormData = {
  name: string;
  code: string;
  category_id: string;
  quantity: number;
  length_cm: string;
  width_cm: string;
  height_cm: string;
  size: string;
  base_price: string;
  margin_pct: string;
  image_url: string;
};

export function buildCategoryTree(categories: Category[]): Category[] {
  const map = new Map<string, Category>();
  const roots: Category[] = [];

  categories.forEach(cat => {
    map.set(cat.id, { ...cat, children: [] });
  });

  map.forEach(cat => {
    if (cat.parent_id) {
      const parent = map.get(cat.parent_id);
      if (parent) {
        parent.children!.push(cat);
      }
    } else {
      roots.push(cat);
    }
  });

  const sort = (nodes: Category[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order);
    nodes.forEach(n => n.children && sort(n.children));
  };
  sort(roots);
  return roots;
}

export function getCategoryPath(categoryId: string | null, categories: Category[]): string {
  if (!categoryId) return '—';
  const flat = flattenCategories(categories);
  const pathParts: string[] = [];
  let current = flat.find(c => c.id === categoryId);
  while (current) {
    pathParts.unshift(current.name);
    current = current.parent_id ? flat.find(c => c.id === current!.parent_id) : undefined;
  }
  return pathParts.join(' > ') || '—';
}

export function flattenCategories(tree: Category[]): Category[] {
  const result: Category[] = [];
  const traverse = (nodes: Category[]) => {
    nodes.forEach(n => {
      result.push(n);
      if (n.children?.length) traverse(n.children);
    });
  };
  traverse(tree);
  return result;
}

export function getStockStatus(quantity: number): { label: string; color: string } {
  if (quantity === 0) return { label: 'نفذ', color: 'red' };
  if (quantity <= 10) return { label: 'كمية منخفضة', color: 'amber' };
  return { label: 'متوفر', color: 'green' };
}
