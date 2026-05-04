import { BACKEND_URL } from '../config';

export interface BackendData {
  action: string | null;
  suhu: number | null;
  tekanan: number | null;
<<<<<<< Updated upstream
  waktu: string | null;
  device: string | null;
  sesi: string | null;   // "1" | "2" | "3"
  status: string | null; // "prosesing" | "api menyala"
=======
  waktu:   string | null;
  device:  string | null;
  sesi:    string | null;
  status:  string | null;
>>>>>>> Stashed changes
}

export interface BackendResponse {
  status: string;
  data: BackendData | null;
}

/** Ambil data terakhir dari backend. Action di-consume otomatis oleh server. */
export async function fetchLastData(): Promise<BackendResponse> {
  const res = await fetch(`${BACKEND_URL}/data`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}

/**
 * Kirim perintah START ke backend.
 * Backend publish ke sterilisasi/set: { action:"start", suhu, tekanan, waktu, Device }
 */
export async function sendStart(params: {
  suhu: string;
  tekanan: string;
  device: string;
}): Promise<void> {
  const now = new Date();
  const waktu = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const res = await fetch(`${BACKEND_URL}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
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
 * Backend publish ke sterilisasi/set: { action:"stop", waktu, Device }
 */
export async function sendStop(device?: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device: device ?? null }),
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
}

<<<<<<< Updated upstream
=======
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
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
/** Ambil data finish dari topik sterilisasi/finish. Di-consume otomatis oleh server. */
export async function fetchFinishData(): Promise<FinishResponse> {
  const res = await fetch(`${BACKEND_URL}/finish`, {
=======
/**
 * Ambil 1 data running terbaru dari backend.
 * Endpoint: GET /sterilisasi/running/last
 */
export async function fetchLastRunning(): Promise<RunningResponse> {
  const res = await fetch(`${BACKEND_URL}/sterilisasi/running/last`, {
>>>>>>> Stashed changes
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}
<<<<<<< Updated upstream
=======

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
 * Kirim perintah START ke backend.
 * Endpoint: POST /sterilisasi/set
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
>>>>>>> Stashed changes
