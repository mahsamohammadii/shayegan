import { apiFetch } from './client';

/**
 * GET /api/v1/content
 * Returns all content items (FAQ, footer, header, about, contact, social, banners …)
 * @returns {Promise<Array>}
 */
export async function getAllContent() {
  const res = await apiFetch('/api/v1/content', {
    method: "GET",
    credentials: 'include',
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "خطا در دریافت محتوا");
  return json.data ?? [];
}
