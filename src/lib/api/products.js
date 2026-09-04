/**
 * Products & Categories API Service using Cookie Auth
 */

import { apiFetch } from './client';

/**
 * GET /api/v1/products
 * Fetches a paginated list of products with full filter support.
 */
export async function getProducts({
  q,
  categoryId,
  status = 'published',
  page = 1,
  limit = 12,
  minPrice,
  maxPrice,
  sortBy,
  sortOrder,
  inStock,
} = {}) {
  const endpoint = `/api/v1/products?page=${page}&limit=${limit}` +
    (q ? `&q=${encodeURIComponent(q)}` : '') +
    (categoryId ? `&category=${encodeURIComponent(categoryId)}` : '') +
    (minPrice ? `&minPrice=${minPrice}` : '') +
    (maxPrice ? `&maxPrice=${maxPrice}` : '') +
    (sortBy ? `&sortBy=${encodeURIComponent(sortBy)}` : '') +
    (sortOrder ? `&sortOrder=${encodeURIComponent(sortOrder)}` : '') +
    (inStock ? `&inStock=${inStock}` : '');

  const res = await apiFetch(endpoint, {
    method: 'GET',
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'خطا در دریافت محصولات');

  return {
    products: json.data  ?? [],
    meta:     json.meta  ?? {},
  };
}

/**
 * GET /api/v1/categories
 * Returns flat list of all categories (root & subcategories).
 */
export async function getCategories() {
  const res = await apiFetch('/api/v1/categories', {
    method: 'GET',
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'خطا در دریافت دسته‌بندی‌ها');
  return json.data ?? [];
}

/**
 * GET /api/v1/products/catalog-tree
 */
export async function getCatalogTree({ limit = 5 } = {}) {
  const res = await apiFetch(`/api/v1/products/catalog-tree?limit=${limit}`, {
    method: 'GET',
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'خطا در دریافت درخت دسته‌بندی');
  return json.data ?? [];
}

/**
 * Pick a random image from the first 3 images of a product.
 */
export function pickRandomImage(images = []) {
  if (!images.length) return null;
  const candidates = images.slice(0, 3);
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return (
    pick?.renditions?.find(r => r.name === 'medium')?.url ??
    pick?.url ??
    null
  );
}

/**
 * Get the display price of a product (lowest variant price or basePrice).
 */
export function getMinPrice(product) {
  if (product.variants?.length) {
    const prices = product.variants.map(v => v.price).filter(Boolean);
    if (prices.length) return Math.min(...prices);
  }
  return product.basePrice ?? 0;
}

/**
 * GET /api/v1/products/{slug}
 * Fetches a single product by its slug.
 */
export async function getProductBySlug(slug) {
  const res = await apiFetch(`/api/v1/products/${slug}`, {
    method: 'GET',
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'خطا در دریافت اطلاعات محصول');
  return json.data ?? null;
}

/**
 * GET /api/v1/products/{slug}/options
 * Fetches selectable options, axes, price range, and variants for a product.
 */
export async function getProductOptions(slug) {
  const res = await apiFetch(`/api/v1/products/${slug}/options`, {
    method: 'GET',
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'خطا در دریافت گزینه‌های محصول');
  return json.data ?? null;
}
