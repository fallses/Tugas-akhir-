/**
 * config.ts — konfigurasi global aplikasi
 */

// Ganti dengan IP server backend kamu (bukan localhost jika di device fisik)
// Emulator Android → 10.0.2.2 | Device fisik → IP komputer di jaringan lokal
export const BACKEND_URL = 'http://10.0.2.2:5000';

// Interval polling dalam milidetik
export const POLL_INTERVAL_MS = 2000;
