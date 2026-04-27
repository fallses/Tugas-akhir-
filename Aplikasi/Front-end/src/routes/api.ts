export const BASE_URL = 'http://10.0.2.2:5000';

export async function apiPostSterilisasiSet(payload: {
  suhu: number;
  tekanan: number;
  waktu: number;
  device: string;
  namaAlat?: string;
}) {
  const res = await fetch(`${BASE_URL}/sterilisasi/set`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Gagal menghubungi server');
  return json;
}
export async function apiGetSensorLast(): Promise<{ suhu: number; tekanan: number } | null> {
  const res = await fetch(`${BASE_URL}/sterilisasi/sensor/last`);
  const json = await res.json();
  if (!res.ok || !json.data) return null;
  return { suhu: json.data.suhu, tekanan: json.data.tekanan };
}