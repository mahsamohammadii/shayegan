/**
 * Profile API Service using Cookie Auth
 */

import { apiFetch } from './client';

/**
 * GET /api/v1/profile
 * Fetch the logged-in user's profile.
 */
export async function getProfile() {
  const res = await apiFetch('/api/v1/profile', {
    method: 'GET',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'خطا در دریافت پروفایل');
  return json.data;
}

/**
 * PATCH /api/v1/profile
 * Update profile fields (firstName, lastName, phone).
 * Supports updateProfile(payload) and legacy updateProfile(token, payload)
 */
export async function updateProfile(arg1, arg2) {
  const payload = (typeof arg1 === 'object' && arg1 !== null) ? arg1 : arg2;
  const res = await apiFetch('/api/v1/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    const msg = json.errors?.map(e => e.message).join(' | ') || json.message || 'خطا در ویرایش پروفایل';
    throw new Error(msg);
  }
  return json.data;
}

/**
 * GET /api/v1/profile/addresses
 * List all addresses for the logged-in user.
 */
export async function getAddresses() {
  const res = await apiFetch('/api/v1/profile/addresses', {
    method: 'GET',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'خطا در دریافت آدرس‌ها');
  return json.data;
}

/**
 * POST /api/v1/profile/addresses
 * Create a new address.
 * Supports createAddress(payload) and legacy createAddress(token, payload)
 */
export async function createAddress(arg1, arg2) {
  const payload = (typeof arg1 === 'object' && arg1 !== null) ? arg1 : arg2;
  const res = await apiFetch('/api/v1/profile/addresses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    const msg = json.errors?.map(e => e.message).join(' | ') || json.message || 'خطا در ثبت آدرس';
    throw new Error(msg);
  }
  return json.data;
}

/**
 * PATCH /api/v1/profile/addresses/:id
 * Update an existing address.
 * Supports updateAddress(id, payload) and legacy updateAddress(token, id, payload)
 */
export async function updateAddress(arg1, arg2, arg3) {
  let id, payload;
  if (typeof arg1 === 'string' && typeof arg2 === 'object') {
    id = arg1;
    payload = arg2;
  } else {
    id = arg2;
    payload = arg3;
  }

  const res = await apiFetch(`/api/v1/profile/addresses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    const msg = json.errors?.map(e => e.message).join(' | ') || json.message || 'خطا در ویرایش آدرس';
    throw new Error(msg);
  }
  return json.data;
}

/**
 * DELETE /api/v1/profile/addresses/:id
 * Remove an address.
 * Supports deleteAddress(id) and legacy deleteAddress(token, id)
 */
export async function deleteAddress(arg1, arg2) {
  const id = typeof arg1 === 'string' ? arg1 : arg2;

  const res = await apiFetch(`/api/v1/profile/addresses/${id}`, {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'خطا در حذف آدرس');
  return json.data;
}
