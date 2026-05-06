import { BACKEND_URL } from '../config';

// ── Tipe data dari sterilisasi/running ───────────────────────
export interface RunningData {
  _id:     string;
  action:  string | null;
  suhu:    number | null;
  tekanan: number | null;
  waktu:   string | null;
  timer:   string | null; // Timer dari alat (format: "HH:MM:SS")
  device:  string | null;
  sesi:    string | null;
  status:  string | null;
}

export interface RunningResponse {
  status: string;
  data:   RunningData | null;
}

// ── Tipe data dari sterilisasi/set ───────────────────────────
export interface SetData {
  _id:     string;
  action:  string | null;
  suhu:    number | null;
  tekanan: number | null;
  waktu:   string | null;
  device:  string | null;
}

export interface SetResponse {
  status: string;
  data:   SetData | null;
}

// ── Tipe data dari sterilisasi/finish ────────────────────────
export interface FinishData {
  _id?:    string;
  suhu:    number | null;
  tekanan: number | null;
  waktu:   string | null;
  device:  string | null;
  createdAt?: string;
}

export interface FinishResponse {
  status: string;
  data:   FinishData | null;
}

export interface FinishListResponse {
  status: string;
  data:   FinishData[];
}

// ── Tipe data untuk history (gabungan finish + set) ──────────
export interface HistoryData {
  _id:           string;
  device:        string | null;
  suhu:          number;      // dari set
  tekanan:       number;      // dari set
  waktu:         string;      // dari set (durasi)
  finishSuhu:    number | null;    // suhu akhir dari finish
  finishTekanan: number | null;    // tekanan akhir dari finish
  createdAt:     string;
  notes?:        string;      // catatan user
}

export interface HistoryResponse {
  status: string;
  data:   HistoryData[];
}

/**
 * Ambil 1 data running terbaru dari backend.
 * Endpoint: GET /sterilisasi/running/last
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
 * Ambil 1 data set terbaru dari backend (suhu & tekanan target yang dikirim saat start).
 * Endpoint: GET /sterilisasi/set/last
 */
export async function fetchLastSet(): Promise<SetResponse> {
  const res = await fetch(`${BACKEND_URL}/sterilisasi/set/last`, {
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
 * Ambil semua data finish dari database untuk history.
 * Endpoint: GET /sterilisasi/finish
 */
export async function fetchFinishHistory(): Promise<FinishListResponse> {
  const res = await fetch(`${BACKEND_URL}/sterilisasi/finish`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}

/**
 * Ambil data history lengkap (gabungan finish + set).
 * Endpoint: GET /sterilisasi/history
 */
export async function fetchHistory(): Promise<HistoryResponse> {
  const res = await fetch(`${BACKEND_URL}/sterilisasi/history`, {
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
  waktu:   string;
}): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/sterilisasi/set`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action:  'start',
      suhu:    parseFloat(params.suhu),
      tekanan: parseFloat(params.tekanan),
      waktu:   params.waktu,
      device:  params.device,
    }),
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
}

/**
 * Kirim perintah STOP ke backend.
 * Endpoint: POST /sterilisasi/running
 * Publish ke topik sterilisasi/running agar alat menerima perintah stop.
 */
export async function sendStop(device?: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/sterilisasi/running`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'stop',
      device: device ?? null,
    }),
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
}

/**
 * Hapus riwayat berdasarkan ID.
 * Endpoint: DELETE /sterilisasi/history/:id
 */
export async function deleteHistory(id: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/sterilisasi/history/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
}

/**
 * Update catatan riwayat berdasarkan ID.
 * Endpoint: PATCH /sterilisasi/history/:id
 */
export async function updateHistoryNotes(id: string, notes: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/sterilisasi/history/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
}
