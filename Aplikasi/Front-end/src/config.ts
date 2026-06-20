/**
 * config.ts — konfigurasi global aplikasi
 *
 * BACKEND_URL diambil dari file .env
 * Untuk mengubah URL backend, edit file .env di root project
 *
 * Contoh nilai di .env:
 *   Production       → BACKEND_URL=https://backend-baglog-care.up.railway.app
 *   Emulator Android → BACKEND_URL=http://10.0.2.2:5000
 *   Device fisik     → BACKEND_URL=http://192.168.1.155:5000
 */

import Config from 'react-native-config';

// URL backend — diambil dari .env file
export const BACKEND_URL = Config.BACKEND_URL || 'http://10.0.2.2:5000';

// Interval polling dalam milidetik
export const POLL_INTERVAL_MS = 2000;
