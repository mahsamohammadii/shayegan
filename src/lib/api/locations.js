/**
 * Locations API Service (public — no tenant header, sends credentials: 'include')
 * Provides Iran province and city reference data.
 */

import { apiFetch } from './client';

/**
 * GET /api/v1/locations/provinces
 * Returns all Iran provinces. Optionally filter by name.
 * @param {{ q?: string, limit?: number }} params
 * @returns {Promise<Array<{ id: number, name: string, slug: string, tel_prefix: string }>>}
 */
export async function getProvinces({ q = '', limit } = {}) {
  const query = new URLSearchParams();
  if (q)     query.set('q', q);
  if (limit) query.set('limit', limit);
  const search = query.toString() ? `?${query.toString()}` : '';

  const res = await apiFetch(`/api/v1/locations/provinces${search}`, {
    method: 'GET',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'خطا در دریافت استان‌ها');
  return Array.isArray(json) ? json : (json.data ?? []);
}

/**
 * GET /api/v1/locations/provinces/:provinceId/cities
 * Returns cities of a specific province.
 * @param {number} provinceId
 * @param {{ q?: string, limit?: number }} params
 * @returns {Promise<Array<{ id: number, name: string, slug: string, province_id: number, county_id: number }>>}
 */
export async function getCities(provinceId, { q = '', limit } = {}) {
  const query = new URLSearchParams();
  if (q)     query.set('q', q);
  if (limit) query.set('limit', limit);
  const search = query.toString() ? `?${query.toString()}` : '';

  const res = await apiFetch(`/api/v1/locations/provinces/${provinceId}/cities${search}`, {
    method: 'GET',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'خطا در دریافت شهرها');
  return Array.isArray(json) ? json : (json.data ?? []);
}
