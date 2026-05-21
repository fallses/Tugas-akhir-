/**
 * App.tsx
 *
 * Navigasi utama + global action listener.
 *
 * Global listener melakukan polling ke backend secara terus-menerus.
 * Ketika backend mengirim action yang dikenali, aplikasi langsung
 * berpindah ke screen yang sesuai — dari mana pun posisi saat ini.
 *
 * Endpoint yang digunakan:
 *   GET /sterilisasi/running/last → action: countdown | running | ignition
 *   GET /sterilisasi/finish/last  → sinyal selesai (di-consume otomatis server)
 *   POST /sterilisasi/set         → kirim start ke alat
 *   POST /sterilisasi/running     → kirim stop ke alat
 *
 * Karena /running/last membaca dari DB (tidak di-consume), frontend
 * melacak _id terakhir yang sudah diproses agar tidak trigger ulang.
 *
 * Saat pertama kali mount, polling hanya mencatat _id yang sudah ada
 * tanpa memproses navigasi — mencegah masuk ke screen proses saat baru buka app.
 */

import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen   from './screens/WelcomeScreen';
import DashboardScreen from './screens/DashboardScreen';
import SetScreen       from './screens/SetScreen';
import CountdownScreen from './screens/CountdownScreen';
import IgnitionScreen  from './screens/IgnitionScreen';
import RunningScreen   from './screens/RunningScreen';
import FinishScreen    from './screens/FinishScreen';
import HistoryScreen   from './screens/HistoryScreen';
import ManualControlScreen from './screens/ManualControlScreen';

import { fetchLastRunning, fetchLastFinish } from './services/backendService';
import { POLL_INTERVAL_MS } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@daftar_alat';

const Stack = createNativeStackNavigator();

// Ref navigasi global — digunakan oleh listener di luar komponen
const navigationRef = React.createRef<NavigationContainerRef<any>>();

/**
 * Simpan params proses aktif agar bisa diteruskan ke screen berikutnya
 * saat action datang dari backend.
 */
let activeProcessParams: {
  namaAlat:     string;
  idAlat:       string;
  sterilDetik:  number;
  inputSuhu:    string;
  inputTekanan: string;
} | null = null;

/**
 * Flag untuk menandai bahwa proses sedang dihentikan.
 * Ketika true, polling akan mengabaikan data running/ignition/countdown dari alat.
 * Flag ini akan direset setelah beberapa detik atau saat masuk ke FinishScreen.
 */
let isStoppingProcess = false;
let stopTimeout: ReturnType<typeof setTimeout> | null = null;

export function setActiveProcessParams(params: typeof activeProcessParams) {
  activeProcessParams = params;
}

/**
 * Fungsi untuk menandai bahwa proses sedang dihentikan.
 * Dipanggil dari screen ketika user menekan tombol stop.
 */
export function markProcessAsStopping() {
  console.log('[App] Proses ditandai sebagai stopping - polling akan mengabaikan data running');
  isStoppingProcess = true;
  
  // Reset flag setelah 10 detik untuk menghindari stuck
  if (stopTimeout) clearTimeout(stopTimeout);
  stopTimeout = setTimeout(() => {
    console.log('[App] Reset flag stopping setelah timeout');
    isStoppingProcess = false;
  }, 10000);
}

/**
 * Fungsi untuk mereset flag stopping.
 * Dipanggil saat sudah masuk ke FinishScreen atau Dashboard.
 */
export function resetStoppingFlag() {
  console.log('[App] Reset flag stopping');
  isStoppingProcess = false;
  if (stopTimeout) {
    clearTimeout(stopTimeout);
    stopTimeout = null;
  }
}

/**
 * Fungsi untuk memvalidasi apakah ID alat terdaftar di dashboard.
 * Hanya alat yang terdaftar yang akan direspon oleh polling.
 */
async function isDeviceRegistered(deviceId: string | null): Promise<boolean> {
  if (!deviceId) {
    console.log('[App] Device ID kosong - abaikan');
    return false;
  }

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) {
      console.log('[App] Tidak ada alat terdaftar - abaikan perintah dari', deviceId);
      return false;
    }

    const daftarAlat: Array<{ id: string; nama: string; idAlat: string }> = JSON.parse(stored);
    const isRegistered = daftarAlat.some(alat => alat.idAlat === deviceId);
    
    if (!isRegistered) {
      console.log(`[App] Alat "${deviceId}" tidak terdaftar - abaikan perintah`);
    } else {
      console.log(`[App] Alat "${deviceId}" terdaftar - proses perintah`);
    }
    
    return isRegistered;
  } catch (err) {
    console.error('[App] Error saat validasi device:', err);
    return false;
  }
}

/**
 * Fungsi untuk mendapatkan nama alat dari AsyncStorage berdasarkan ID alat.
 * Return nama alat jika ditemukan, atau ID alat jika tidak ditemukan.
 */
async function getDeviceName(deviceId: string | null): Promise<string> {
  if (!deviceId) return 'Unknown Device';

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return deviceId;

    const daftarAlat: Array<{ id: string; nama: string; idAlat: string }> = JSON.parse(stored);
    const alat = daftarAlat.find(a => a.idAlat === deviceId);
    
    return alat?.nama ?? deviceId;
  } catch (err) {
    console.error('[App] Error saat mengambil nama device:', err);
    return deviceId;
  }
}

export default function App() {
  const pollRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollFinishRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  // Tracking _id running terakhir yang sudah diproses — cegah trigger duplikat
  const lastRunningId  = useRef<string | null>(null);
  // Polling pertama hanya untuk inisialisasi _id, tidak memproses navigasi
  const initializedRef = useRef(false);

  useEffect(() => {
    // ── Polling /sterilisasi/running/last ────────────────────
    async function checkRunning() {
      try {
        const res = await fetchLastRunning();

        // Polling pertama — catat _id yang sudah ada, jangan proses navigasi
        if (!initializedRef.current) {
          initializedRef.current = true;
          if (res.status === 'success' && res.data?._id) {
            lastRunningId.current = res.data._id;
            console.log(`[App] Init: tandai _id lama (${res.data._id})`);
          } else {
            console.log('[App] Init: tidak ada data running lama');
          }
          return;
        }

        if (res.status !== 'success' || !res.data) return;

        const { _id, action, suhu, tekanan, sesi, status, device } = res.data;
        if (!action) return;

        // Jika proses sedang dihentikan, abaikan data running/ignition/countdown dari alat
        // Pengecekan ini harus dilakukan SEBELUM validasi device dan _id
        if (isStoppingProcess && (action === 'countdown' || action === 'running' || action === 'ignition')) {
          console.log(`[App] Proses sedang dihentikan - abaikan action "${action}" dari alat`);
          return;
        }

        // Validasi: Hanya proses perintah dari alat yang terdaftar
        const deviceRegistered = await isDeviceRegistered(device);
        if (!deviceRegistered) {
          // Alat tidak terdaftar - abaikan perintah
          return;
        }

        // Sudah diproses sebelumnya → skip
        if (_id && _id === lastRunningId.current) return;
        lastRunningId.current = _id ?? null;

        const nav = navigationRef.current;
        if (!nav || !nav.isReady()) return;

        console.log(`[App] Running action diterima: "${action}" (id: ${_id})`);

        // Jika activeProcessParams tidak ada, ambil nama alat dari AsyncStorage
        let params = activeProcessParams;
        if (!params) {
          const namaAlat = await getDeviceName(device);
          params = {
            namaAlat:     namaAlat,
            idAlat:       device ?? '-',
            sterilDetik:  20 * 60,
            inputSuhu:    suhu?.toString()     ?? '121',
            inputTekanan: tekanan?.toString()  ?? '1.2',
          };
          console.log(`[App] Params dibuat dari device: ${device} → ${namaAlat}`);
        }

        switch (action) {
          case 'countdown':
            nav.navigate('CountdownScreen', params);
            break;

          case 'running': {
            // Konversi waktu dari alat ("HH:MM") ke sterilDetik
            let sterilDetikFromAlat = params.sterilDetik;
            if (res.data.waktu != null) {
              const parts = String(res.data.waktu).split(':');
              if (parts.length === 2) {
                const secs = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
                if (!isNaN(secs) && secs > 0) sterilDetikFromAlat = secs;
              }
            }
            nav.navigate('RunningScreen', {
              ...params,
              sterilDetik: sterilDetikFromAlat,
              ...(suhu    != null && { inputSuhu:    suhu.toString() }),
              ...(tekanan != null && { inputTekanan: tekanan.toString() }),
            });
            break;
          }

          case 'ignition': {
            if (sesi == null) break;
            const ignitionParams = {
              ...params,
              sesi: parseInt(sesi, 10) || 1,
              ignitionStatus: (status === 'api menyala'
                ? 'api menyala'
                : 'prosesing') as 'prosesing' | 'api menyala',
            };
            const currentRoute = nav.getCurrentRoute();
            if (currentRoute?.name === 'IgnitionScreen') {
              nav.setParams(ignitionParams);
            } else {
              nav.navigate('IgnitionScreen', ignitionParams);
            }
            break;
          }

          case 'ignition_failed': {
            // Gagal menyalakan kompor setelah beberapa percobaan
            console.log('[App] Ignition failed, tampilkan error screen');
            // Backend mengirim percobaan di field sesi
            const percobaan = sesi ? parseInt(sesi, 10) : 3;
            const failedParams = {
              ...params,
              sesi: percobaan,
              ignitionStatus: 'gagal' as const,
            };
            const currentRoute = nav.getCurrentRoute();
            if (currentRoute?.name === 'IgnitionScreen') {
              nav.setParams(failedParams);
            } else {
              nav.navigate('IgnitionScreen', failedParams);
            }
            break;
          }

          case 'stop': {
            // Proses dihentikan — kembali ke SetScreen
            console.log('[App] Proses dihentikan, kembali ke SetScreen');
            nav.reset({
              index: 1,
              routes: [
                { name: 'Dashboard' },
                { name: 'SetScreen', params },
              ],
            });
            break;
          }

          default:
            console.warn(`[App] Action tidak dikenali: "${action}"`);
            break;
        }
      } catch {
        // Gagal polling — coba lagi di interval berikutnya
      }
    }

    // ── Polling /sterilisasi/finish/last ─────────────────────
    // Server consume data setelah dibaca, jadi tidak perlu tracking _id
    async function checkFinish() {
      try {
        const res = await fetchLastFinish();
        if (res.status !== 'success' || !res.data) return;

        // Polling pertama — abaikan data finish lama (sudah di-consume oleh server)
        if (!initializedRef.current) {
          console.log('[App] Init: abaikan data finish lama');
          return;
        }

        const nav = navigationRef.current;
        if (!nav || !nav.isReady()) return;

        // Jika sudah di FinishScreen, jangan navigasi lagi (hindari menimpa status "Dihentikan")
        const currentRoute = nav.getCurrentRoute();
        if (currentRoute?.name === 'FinishScreen') {
          console.log('[App] Sudah di FinishScreen, skip navigasi finish dari backend');
          return;
        }

        const { suhu, tekanan, waktu, device, action } = res.data;
        console.log('[App] Finish diterima dari sterilisasi/finish/last');

        // Validasi: Hanya proses perintah dari alat yang terdaftar
        const deviceRegistered = await isDeviceRegistered(device);
        if (!deviceRegistered) {
          // Alat tidak terdaftar - abaikan perintah
          return;
        }

        // Tentukan status berdasarkan action
        // Jika action adalah "stop", maka status "Dihentikan"
        // Jika action adalah "finish" atau tidak ada, maka status "Berhasil"
        const finishStatus: 'Berhasil' | 'Dihentikan' = 
          action === 'stop' ? 'Dihentikan' : 'Berhasil';
        
        console.log(`[App] Finish action: "${action}" → Status: ${finishStatus}`);

        // Jika activeProcessParams tidak ada, ambil nama alat dari AsyncStorage
        let params = activeProcessParams;
        if (!params) {
          const namaAlat = await getDeviceName(device);
          params = {
            namaAlat:     namaAlat,
            idAlat:       device ?? '-',
            sterilDetik:  20 * 60,
            inputSuhu:    suhu?.toString()     ?? '121',
            inputTekanan: tekanan?.toString()  ?? '1.2',
          };
          console.log(`[App] Params finish dibuat dari device: ${device} → ${namaAlat}`);
        }

        nav.reset({
          index: 2,
          routes: [
            { name: 'Dashboard' },
            {
              name: 'SetScreen',
              params: {
                ...params,
                ...(suhu    != null && { inputSuhu:    suhu.toString() }),
                ...(tekanan != null && { inputTekanan: tekanan.toString() }),
              },
            },
            {
              name: 'FinishScreen',
              params: {
                ...params,
                ...(suhu    != null && { inputSuhu:    suhu.toString() }),
                ...(tekanan != null && { inputTekanan: tekanan.toString() }),
                finishedAt: waktu ?? new Date().toLocaleTimeString('id-ID', {
                  hour: '2-digit', minute: '2-digit',
                }),
                status: finishStatus,
              },
            },
          ],
        });
        
        // Reset flag stopping setelah berhasil navigasi ke FinishScreen
        resetStoppingFlag();
      } catch {
        // Gagal polling — coba lagi di interval berikutnya
      }
    }

    // Jalankan sekali langsung saat mount (tidak tunggu interval pertama)
    checkRunning();
    checkFinish();

    pollRef.current       = setInterval(checkRunning, POLL_INTERVAL_MS);
    pollFinishRef.current = setInterval(checkFinish,  POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current)       clearInterval(pollRef.current);
      if (pollFinishRef.current) clearInterval(pollFinishRef.current);
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome"         component={WelcomeScreen as any} />
        <Stack.Screen name="Dashboard"       component={DashboardScreen as any} />
        <Stack.Screen name="SetScreen"       component={SetScreen as any} />
        <Stack.Screen name="CountdownScreen" component={CountdownScreen as any} />
        <Stack.Screen name="IgnitionScreen"  component={IgnitionScreen as any} />
        <Stack.Screen name="RunningScreen"   component={RunningScreen as any} />
        <Stack.Screen name="FinishScreen"    component={FinishScreen as any} />
        <Stack.Screen name="History"         component={HistoryScreen as any} />
        <Stack.Screen name="ManualControl"   component={ManualControlScreen as any} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
