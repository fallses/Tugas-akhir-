/**
 * types/process.ts — tipe bersama untuk semua screen proses
 */

export interface ProcessParams {
  namaAlat: string;
  idAlat: string;
  /** Durasi sterilisasi dalam detik */
  sterilDetik: number;
  /** Suhu target (string untuk tampilan) */
  inputSuhu: string;
  /** Tekanan target (string untuk tampilan) */
  inputTekanan: string;
}

export interface HistoryEntry {
  id: string;
  namaAlat: string;
  idAlat: string;
  suhu: string;
  tekanan: string;
  /** Durasi terformat HH:MM:SS */
  durasi: string;
  mulaiPukul: string;
  selesaiPukul: string;
  tanggal: string;
  status: 'Berhasil' | 'Dihentikan';
  notes?: string;
}

// In-memory history store — bisa diganti AsyncStorage di produksi
export let globalHistory: HistoryEntry[] = [];

export function addHistory(entry: HistoryEntry) {
  globalHistory = [entry, ...globalHistory].slice(0, 50);
}
