/**
 * backendService.ts
 *
 * Polling ke backend REST API untuk mendapatkan action terbaru dari MQTT.
 * Tidak ada otomasi — hanya menyediakan data mentah.
 *
 * Action yang dikenali dari backend:
 *   "countdown" → tampilkan CountdownScreen
 *   "running"   → tampilkan RunningScreen (langsung, tanpa ignition)
 *   "finish"    → tampilkan FinishScreen
 *   "set"       → kembali ke SetScreen
 */

import { BACKEND_URL } from '../config';

export interface BackendData {
  suhu: number;
  tekanan: number;
  action: string;
  waktu: string;
  device: string;
}

export interface BackendResponse {
  status: string;
  data: BackendData | null;
}

/**
 * Ambil data terakhir dari backend (satu kali, tidak polling).
 * Panggil ini secara manual dari komponen yang membutuhkan.
 */
export async function fetchLastData(): Promise<BackendResponse> {
  const response = await fetch(`${BACKEND_URL}/data`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return response.json();
}

/**
 * Kirim perintah stop ke backend.
 * Backend akan publish ke topic sterilisasi/set untuk menghentikan proses.
 */
export async function sendStop(): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }
}
