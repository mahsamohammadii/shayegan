/**
 * Checkout & Payment API Service using Cookie Auth
 */

import { apiFetch } from './client';

/**
 * POST /api/v1/checkout/initiate
 * Initiate checkout for the current shopping cart with selected address details.
 * Requires complete profile (firstName, lastName, phone) and selected address.
 * @param {object} [addressData] All address details (addressId, fullAddress, provinceId, cityId, etc.)
 * @returns {Promise<{ orderId: string, total: number, currency: string, expiresAt: string, paymentValidFor: string, payment: object }>}
 */
export async function initiateCheckout(addressData = {}) {
  const res = await apiFetch('/api/v1/checkout/initiate', {
    method: 'POST',
    body: JSON.stringify(addressData),
  });

  const json = await res.json();
  if (!res.ok) {
    const error = new Error(json.message || 'خطا در ثبت سفارش');
    error.status = res.status;
    error.data = json;
    throw error;
  }
  return json.data || json;
}

/**
 * POST /api/v1/payments/manual/{orderId}/receipt
 * Upload manual payment receipt image/file for an order.
 * @param {string} orderId
 * @param {File} file
 * @returns {Promise<object>}
 */
export async function uploadManualReceipt(orderId, file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiFetch(`/api/v1/payments/manual/${orderId}/receipt`, {
    method: 'POST',
    body: formData,
  });

  const json = await res.json();
  if (!res.ok) {
    const error = new Error(json.message || 'خطا در آپلود رسید پرداخت');
    error.status = res.status;
    error.data = json;
    throw error;
  }
  return json.data || json;
}
