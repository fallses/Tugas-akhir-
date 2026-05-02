import { BACKEND_URL } from '../config';

// ── Tipe data dari sterilisasi/running ───────────────────────
export interface RunningData {
  _id:     string;
  action:  string | null;
  suhu:    number | null;
  tekanan: number | null;
  waktu:   string | null;
  device:  string | null;
  sesi:    string | null;   // "1" | "2" | "3"
  status:  string | null;   // "prosesing" | "api menyala"
}

export interface RunningResponse {
  status: string;
  data:   RunningData | null;
}

// ── Tipe data dari sterilisasi/finish ────────────────────────
export interface FinishData {
  suhu:    number | null;
  tekanan: number | null;
  waktu:   string | null;
  device:  string | null;
}

export interface FinishResponse {
  status: string;
  data:   FinishData | null;
}

/**
 * Ambil 1 data running terbaru dari backend.
 * Endpoint: GET /sterilisasi/running/last
 * Data dibaca dari DB — tidak di-consume otomatis.
 * Frontend harus tracking _id untuk menghindari proses duplikat.
 */
export async function fetchLastRunning(): Promise<RunningResponse> {
  const res = await fetch(`${BACKEND_URL}/sterilisasi/running/last`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}

/**
 * Ambil data finish terbaru dari backend.
 * Endpoint: GET /sterilisasi/finish/last
 * Data di-consume otomatis oleh server setelah dibaca (dari memory).
 */
export async function fetchLastFinish(): Promise<FinishResponse> {
  const res = await fetch(`${BACKEND_URL}/sterilisasi/finish/last`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}

/**
 * Kirim perintah START ke backend.
 * Endpoint: POST /sterilisasi/set
 * Backend publish ke MQTT sterilisasi/set: { action:"start", suhu, tekanan, waktu, Device }
 */
export async function sendStart(params: {
  suhu:    string;
  tekanan: string;
  device:  string;
}): Promise<void> {
  const now   = new Date();
  const waktu = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const res = await fetch(`${BACKEND_URL}/sterilisasi/set`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action:  'start',
      suhu:    parseFloat(params.suhu),
      tekanan: parseFloat(params.tekanan),
      waktu,
      device:  params.device,
    }),
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
}

/**
 * Kirim perintah STOP ke backend.
 * Endpoint: POST /sterilisasi/set
 * Backend publish ke MQTT sterilisasi/set: { action:"stop", Device }
 */
export async function sendStop(device?: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/sterilisasi/set`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'stop',
      device: device ?? null,
    }),
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
}
