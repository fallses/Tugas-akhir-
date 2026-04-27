/**
 * config.ts — konfigurasi global aplikasi
 */
import Config from 'react-native-config';

// BACKEND_URL dibaca dari .env
// Emulator Android → BACKEND_URL=http://10.0.2.2:5000
// Device fisik     → BACKEND_URL=http://192.168.1.155:5000
export const BACKEND_URL = Config.BACKEND_URL ?? 'http://192.168.1.155:5000';

// Interval polling dalam milidetik
export const POLL_INTERVAL_MS = 2000;
