/**
 * Cart API Service using Cookie Auth
 */

import { apiFetch } from './client';

/**
 * GET /api/v1/cart
 * Returns current user's shopping cart.
 * @returns {Promise<object|null>}
 */
export async function getCart() {
  const res = await apiFetch('/api/v1/cart', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) {
    if (res.status === 401) return null;
    throw new Error(json.message || 'خطا در دریافت سبد خرید');
  }
  return json.data || null;
}

/**
 * POST /api/v1/cart/items
 * Add an item to the cart.
 * Supports both signatures: addItemToCart(itemData) and legacy addItemToCart(token, itemData)
 */
export async function addItemToCart(arg1, arg2) {
  const itemData = (typeof arg1 === 'object' && arg1 !== null) ? arg1 : arg2;
  const { productId, sku, quantity = 1 } = itemData || {};

  const res = await apiFetch('/api/v1/cart/items', {
    method: 'POST',
    body: JSON.stringify({ productId, sku, quantity }),
  });
  const json = await res.json();
  if (!res.ok) {
    const error = new Error(json.message || 'خطا در افزودن کالا به سبد خرید');
    error.status = res.status;
    error.data = json;
    throw error;
  }
  return json.data;
}

/**
 * PATCH /api/v1/cart/items/{itemId}
 * Update item quantity in the cart.
 * Supports both signatures: updateCartItem(itemId, data) and legacy updateCartItem(token, itemId, data)
 */
export async function updateCartItem(arg1, arg2, arg3) {
  let itemId, data;
  if (typeof arg1 === 'string' && typeof arg2 === 'object') {
    itemId = arg1;
    data = arg2;
  } else {
    itemId = arg2;
    data = arg3;
  }
  const { quantity } = data || {};

  const res = await apiFetch(`/api/v1/cart/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  });
  const json = await res.json();
  if (!res.ok) {
    const error = new Error(json.message || 'خطا در به‌روزرسانی تعداد محصول');
    error.status = res.status;
    error.data = json;
    throw error;
  }
  return json.data;
}

/**
 * DELETE /api/v1/cart/items/{itemId}
 * Remove an item from the cart.
 * Supports both signatures: deleteCartItem(itemId) and legacy deleteCartItem(token, itemId)
 */
export async function deleteCartItem(arg1, arg2) {
  const itemId = typeof arg1 === 'string' ? arg1 : arg2;

  const res = await apiFetch(`/api/v1/cart/items/${itemId}`, {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!res.ok) {
    const error = new Error(json.message || 'خطا در حذف کالا از سبد خرید');
    error.status = res.status;
    error.data = json;
    throw error;
  }
  return json.data;
}
