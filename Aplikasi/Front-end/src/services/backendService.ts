import { BACKEND_URL } from '../config';

export interface BackendData {
  action: string | null;
  suhu: number | null;
  tekanan: number | null;
  waktu: string | null;
  device: string | null;
  sesi: string | null;   // "1" | "2" | "3"
  status: string | null; // "prosesing" | "api menyala"
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

/** Ambil data finish dari topik sterilisasi/finish. Di-consume otomatis oleh server. */
export async function fetchFinishData(): Promise<FinishResponse> {
  const res = await fetch(`${BACKEND_URL}/finish`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}
