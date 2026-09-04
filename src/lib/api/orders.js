/**
 * Orders API Service using Cookie Auth
 */

import { apiFetch } from './client';

/**
 * GET /api/v1/orders/my
 * List current user's orders with optional status filter and pagination.
 * If page and limit are omitted, calls /api/v1/orders/my without pagination params.
 * Returns { orders: array, meta: { total, page, limit, totalPages, statusCounts } }
 */
export async function getMyOrders({ status, page, limit } = {}) {
  let endpoint = `/api/v1/orders/my`;
  const queryParams = [];
  if (page !== undefined && page !== null) queryParams.push(`page=${page}`);
  if (limit !== undefined && limit !== null) queryParams.push(`limit=${limit}`);
  if (status && status !== "ALL") queryParams.push(`status=${encodeURIComponent(status)}`);
  
  if (queryParams.length > 0) {
    endpoint += `?${queryParams.join('&')}`;
  }

  const res = await apiFetch(endpoint, {
    method: 'GET',
    cache: 'no-store',
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'خطا در دریافت لیست سفارش‌ها');
  }

  return {
    orders: json.data || json.orders || [],
    meta: json.meta || { total: 0, page: page || 1, limit: limit || 20, totalPages: 1, statusCounts: {} },
  };
}

/**
 * POST /api/v1/orders/{id}/cancel
 * Cancel an order by its ID.
 * @param {string} orderId
 * @param {string} [reason]
 * @returns {Promise<object>}
 */
export async function cancelOrder(orderId, reason = '') {
  const res = await apiFetch(`/api/v1/orders/${orderId}/cancel`, {
    method: 'POST',
    body: JSON.stringify(reason ? { reason } : {}),
  });

  const json = await res.json();
  if (!res.ok) {
    const error = new Error(json.message || 'خطا در لغو سفارش');
    error.status = res.status;
    error.data = json;
    throw error;
  }

  return json.data || json;
}
