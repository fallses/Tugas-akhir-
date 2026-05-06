/**
 * config.ts — konfigurasi global aplikasi
 *
 * Ganti BACKEND_URL sesuai environment:
 *   Production       → 'https://backend-sigasti-production.up.railway.app'
 *   Emulator Android → 'http://10.0.2.2:5000'
 *   Device fisik     → 'http://192.168.1.155:5000'
 */

// URL backend — sesuaikan dengan environment yang digunakan
export const BACKEND_URL = 'https://backend-sigasti-production.up.railway.app';

// Interval polling dalam milidetik
export const POLL_INTERVAL_MS = 2000;
