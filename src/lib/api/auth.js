/**
 * Auth API Service
 * All authentication-related API calls for the storefront using cookie-based auth.
 */

import { apiFetch } from './client';

/**
 * Step 1 — Send OTP to mobile number.
 * @param {string} mobile e.g. "09123456789"
 * @returns {Promise<{ success: boolean, message: string, data: { sent: boolean } }>}
 */
export async function requestOtp(mobile) {
  const res = await apiFetch('/api/v1/auth/mobile/request-otp', {
    method: 'POST',
    body: JSON.stringify({ mobile }),
  });

  const json = await res.json();
  if (!res.ok) {
    const error = new Error(json.message || 'خطا در ارسال کد');
    error.status = res.status;
    error.data = json;
    throw error;
  }
  return json;
}

/**
 * Step 2 — Complete login via POST /api/v1/auth/login.
 * Sends identifier (mobile) and code only (no password).
 * Issues access_token and refresh_token httpOnly cookies.
 * @param {string} mobile e.g. "09123456789"
 * @param {string} code 6-digit OTP
 * @returns {Promise<{ user: object }>}
 */
export async function verifyOtp(mobile, code) {
  const res = await apiFetch('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: mobile,
      code: code,
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    const error = new Error(json.message || 'خطا در ورود به حساب');
    error.status = res.status;
    error.data = json;
    throw error;
  }
  return json.data; // contains user object
}

/**
 * Direct login with identifier (email or mobile) and code.
 * @param {string} identifier
 * @param {string} code
 * @returns {Promise<object>}
 */
export async function loginWithCode(identifier, code) {
  const res = await apiFetch('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier,
      code,
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    const error = new Error(json.message || 'خطا در ورود به حساب');
    error.status = res.status;
    error.data = json;
    throw error;
  }
  return json.data;
}

/**
 * Refresh access token using the refresh_token httpOnly cookie.
 * @returns {Promise<object>}
 */
export async function refreshAccessToken() {
  const res = await apiFetch('/api/v1/auth/refresh', {
    method: 'POST',
  });

  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json.message || 'نشست کاربری منقضی شده است');
    err.status = res.status;
    throw err;
  }
  return json.data;
}

/**
 * Fetch current user session / profile.
 * Probes GET /api/v1/auth/me and falls back to GET /api/v1/profile.
 * @returns {Promise<object>}
 */
export async function getMe() {
  let res = await apiFetch('/api/v1/auth/me', { method: 'GET' });
  if (!res.ok) {
    res = await apiFetch('/api/v1/profile', { method: 'GET' });
  }
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'خطا در دریافت اطلاعات کاربر');
  return json.data;
}

/**
 * Logout — invalidates the httpOnly refresh and access cookies on backend.
 * @returns {Promise<object>}
 */
export async function logoutUser() {
  const res = await apiFetch('/api/v1/auth/logout', {
    method: 'POST',
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'خطا در خروج از حساب');
  return json;
}
