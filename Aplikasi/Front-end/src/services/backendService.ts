import Config from 'react-native-config';

// Ambil BACKEND_URL langsung dari .env file
const BACKEND_URL = Config.BACKEND_URL || 'https://backend-sigasti-production-6cf6.up.railway.app';

console.log('[BackendService] 🔍 BACKEND_URL =', BACKEND_URL);
console.log('[BackendService] 🔍 Config.BACKEND_URL =', Config.BACKEND_URL);

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

// ── Tipe data dari sterilisasi/manual ─────────────────────────
export interface ManualData {
  _id?:         string;
  valve:        string | null;
  gas:          string | null;
  starter:      string | null;
  suhureal:     number | null;
  tekananreal:  number | null;
  device:       string | null;
}

export interface ManualResponse {
  status: string;
  data:   ManualData | null;
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
  action?: string;        // "finish" | "stop" - untuk menentukan status
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
  suhu:          number;
  tekanan:       number;
  waktu:         string;
  finishSuhu:    number | null;
  finishTekanan: number | null;
  action?:       string;        // "finish" | "stop" - dari database
  status:        string;        // "selesai" | "stop" - fallback
  notes?:        string;
  createdAt:     string;
  batch_id?:     string | null; // ID unik untuk membedakan proses
}

export interface HistoryResponse {
  status: string;
  data:   HistoryData[];
}

// ── Tipe data untuk histories (collection baru) ───────────────
export interface HistoriesData {
  _id:              string;
  batch_id:         string;
  device:           string;
  namaAlat:         string;
  suhu:             number;
  tekanan:          number;
  waktu:            string;
  status:           'running' | 'completed' | 'stopped';
  action:           string | null;
  createdAt:        string;
  notes:            string;
  runningDataCount: number;
}

export interface HistoriesResponse {
  status: string;
  data:   HistoriesData[];
}

// ── Tipe data untuk history detail dengan grafik ──────────────
export interface HistoryDetailData {
  _id:       string;
  batch_id:  string;
  device:    string;
  namaAlat:  string;
  set: {
    suhu:       number;
    tekanan:    number;
    waktu:      string;
    startedAt:  string;
  };
  runningData: Array<{
    suhu:      number;
    tekanan:   number;
    timer:     string;
    timestamp: string;
  }>;
  finish?: {
    action:     string;
    suhu:       number;
    tekanan:    number;
    finishedAt: string;
  };
  status:    string;
  notes:     string;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryDetailResponse {
  status: string;
  data:   HistoryDetailData;
}

// ── Tipe data untuk running batch (untuk grafik riwayat) ─────
export interface RunningBatchData {
  _id:       string;
  action:    string;
  suhu:      number | null;
  tekanan:   number | null;
  timer:     string | null;
  device:    string;
  batch_id:  string;
  createdAt: string;
}

export interface RunningBatchResponse {
  status: string;
  data:   RunningBatchData[];
  count:  number;
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
 * Ambil 1 data manual terbaru dari backend (suhureal & tekananreal).
 * Endpoint: GET /sterilisasi/manual/last
 */
export async function fetchLastManual(): Promise<ManualResponse> {
  const res = await fetch(`${BACKEND_URL}/sterilisasi/manual/last`, {
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
 * DEPRECATED: Gunakan fetchHistories() untuk data yang lebih lengkap
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
 * Ambil data histories (collection baru dengan batch_id).
 * Endpoint: GET /sterilisasi/histories
 * RECOMMENDED: Gunakan ini untuk data yang lebih lengkap dan grafik
 */
export async function fetchHistories(): Promise<HistoriesResponse> {
  const res = await fetch(`${BACKEND_URL}/sterilisasi/histories`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}

/**
 * Ambil detail history berdasarkan batch_id (termasuk runningData untuk grafik).
 * Endpoint: GET /sterilisasi/histories/:batch_id
 */
export async function fetchHistoryDetail(batchId: string): Promise<HistoryDetailResponse> {
  const res = await fetch(`${BACKEND_URL}/sterilisasi/histories/${batchId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}

/**
 * Ambil data running berdasarkan batch_id untuk grafik riwayat.
 * Endpoint: GET /sterilisasi/running/batch/:batch_id
 * DEPRECATED: Gunakan fetchHistoryDetail() yang lebih lengkap
 */
export async function fetchRunningByBatchId(batchId: string): Promise<RunningBatchResponse> {
  const res = await fetch(`${BACKEND_URL}/sterilisasi/running/batch/${batchId}`, {
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

/**
 * Kirim kontrol manual ke backend.
 * Endpoint: POST /sterilisasi/manual
 * Backend publish ke MQTT sterilisasi/manual
 */
export async function sendManual(params: {
  valve:   'OPEN' | 'CLOSE';
  gas:     'TUTUP' | 'KECIL' | 'SEDANG' | 'BESAR';
  starter: 'ON' | 'OFF';
  device:  string;
  action?: string;
}): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/sterilisasi/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
}

/**
 * Kirim trigger action ke topik sterilisasi/manual.
 * Endpoint: POST /sterilisasi/manual
 * Payload: { action, device } — valve/gas/starter di-set null
 */
export async function sendManualAction(params: {
  action: string;
  device: string;
}): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/sterilisasi/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      valve:   null,
      gas:     null,
      starter: null,
      action:  params.action,
      device:  params.device,
    }),
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
}
