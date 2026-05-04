/**
 * config.ts — konfigurasi global aplikasi
 *
 * Ganti BACKEND_URL sesuai environment:
 *   Emulator Android → 'http://10.0.2.2:5000'
 *   Device fisik     → 'http://192.168.1.155:5000'
 */

// URL backend — sesuaikan dengan IP server yang digunakan
export const BACKEND_URL = 'http://10.0.2.2:5000';

// Interval polling dalam milidetik
export const POLL_INTERVAL_MS = 2000;
