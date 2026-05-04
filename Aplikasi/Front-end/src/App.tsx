/**
 * App.tsx
 *
 * Navigasi utama + global action listener.
 *
 * Global listener melakukan polling ke backend secara terus-menerus.
 * Ketika backend mengirim action yang dikenali, aplikasi langsung
 * berpindah ke screen yang sesuai — dari mana pun posisi saat ini.
 *
 * Action yang dikenali:
 *   "countdown" → CountdownScreen
 *   "running"   → RunningScreen
 *   "ignition"  → IgnitionScreen
 *   "set"       → SetScreen (kembali ke awal)
 *
 * Polling terpisah ke /finish:
 *   sterilisasi/finish → FinishScreen
 */

import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen  from './screens/WelcomeScreen';
import DashboardScreen from './screens/DashboardScreen';
import SetScreen      from './screens/SetScreen';
import CountdownScreen from './screens/CountdownScreen';
import IgnitionScreen from './screens/IgnitionScreen';
import RunningScreen  from './screens/RunningScreen';
import FinishScreen   from './screens/FinishScreen';
import HistoryScreen  from './screens/HistoryScreen';

import { fetchLastData, fetchFinishData } from './services/backendService';
import { POLL_INTERVAL_MS } from './config';

const Stack = createNativeStackNavigator();

// Ref navigasi global — digunakan oleh listener di luar komponen
const navigationRef = React.createRef<NavigationContainerRef<any>>();

/**
 * Simpan params proses aktif agar bisa diteruskan ke screen berikutnya
 * saat action datang dari backend.
 */
let activeProcessParams: {
  namaAlat: string;
  idAlat: string;
  sterilDetik: number;
  inputSuhu: string;
  inputTekanan: string;
} | null = null;

export function setActiveProcessParams(params: typeof activeProcessParams) {
  activeProcessParams = params;
}

export default function App() {
<<<<<<< Updated upstream
  const pollRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollFinishRef = useRef<ReturnType<typeof setInterval> | null>(null);
=======
  const pollRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollFinishRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  // Tracking _id running terakhir yang sudah diproses — cegah trigger duplikat
  const lastRunningId   = useRef<string | null>(null);
  // Flag: polling pertama hanya untuk inisialisasi _id, tidak memproses navigasi
  const initializedRef  = useRef(false);
>>>>>>> Stashed changes

  useEffect(() => {
    // ── Polling /data (sterilisasi/running) ──────────────────
    async function checkAction() {
      try {
<<<<<<< Updated upstream
        const res = await fetchLastData();
=======
        const res = await fetchLastRunning();

        // Polling pertama — hanya catat _id yang sudah ada, jangan proses
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

>>>>>>> Stashed changes
        if (res.status !== 'success' || !res.data) return;

        const { action, suhu, tekanan, sesi, status } = res.data;
        if (!action) return;

        const nav = navigationRef.current;
        if (!nav || !nav.isReady()) return;

        console.log(`[App] Action diterima: "${action}"`);
        const params = activeProcessParams ?? {
          namaAlat: '-',
          idAlat:   '-',
          sterilDetik: 20 * 60,
          inputSuhu:   suhu?.toString()    ?? '121',
          inputTekanan: tekanan?.toString() ?? '1.2',
        };

        switch (action) {
          case 'countdown':
            nav.navigate('CountdownScreen', params);
            break;
<<<<<<< Updated upstream
          case 'running':
=======

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
>>>>>>> Stashed changes
            nav.navigate('RunningScreen', {
              ...params,
              sterilDetik: sterilDetikFromAlat,
              ...(suhu    != null && { inputSuhu:    suhu.toString() }),
              ...(tekanan != null && { inputTekanan: tekanan.toString() }),
            });
            break;
<<<<<<< Updated upstream
          case 'set':
            nav.navigate('SetScreen', params);
=======
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
>>>>>>> Stashed changes
            break;
          default:
            if (action === 'ignition' && sesi != null) {
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
            }
            break;
        }
      } catch {
        // Gagal polling — coba lagi di interval berikutnya
      }
    }

    // ── Polling /finish (sterilisasi/finish) ─────────────────
    async function checkFinish() {
      try {
        const res = await fetchFinishData();
        if (res.status !== 'success' || !res.data) return;

        // Polling pertama — consume data lama tanpa navigate
        if (!initializedRef.current) {
          console.log('[App] Init: consume data finish lama, abaikan');
          return;
        }

        const nav = navigationRef.current;
        if (!nav || !nav.isReady()) return;

        const { suhu, tekanan, waktu } = res.data;
        console.log('[App] Finish diterima dari sterilisasi/finish');

        const params = activeProcessParams ?? {
          namaAlat: '-',
          idAlat:   '-',
          sterilDetik: 20 * 60,
          inputSuhu:   suhu?.toString()    ?? '121',
          inputTekanan: tekanan?.toString() ?? '1.2',
        };

        const now = new Date();
        nav.navigate('FinishScreen', {
          ...params,
          ...(suhu    != null && { inputSuhu:    suhu.toString() }),
          ...(tekanan != null && { inputTekanan: tekanan.toString() }),
          finishedAt: waktu ?? now.toLocaleTimeString('id-ID', {
            hour: '2-digit', minute: '2-digit',
          }),
          status: 'Berhasil',
        });
      } catch {
        // Gagal polling — coba lagi di interval berikutnya
      }
    }

<<<<<<< Updated upstream
    pollRef.current       = setInterval(checkAction, POLL_INTERVAL_MS);
    pollFinishRef.current = setInterval(checkFinish, POLL_INTERVAL_MS);
=======
    // Jalankan sekali langsung saat mount (tidak tunggu interval pertama)
    checkRunning();
    checkFinish();

    pollRef.current       = setInterval(checkRunning, POLL_INTERVAL_MS);
    pollFinishRef.current = setInterval(checkFinish,  POLL_INTERVAL_MS);
>>>>>>> Stashed changes

    return () => {
      if (pollRef.current)       clearInterval(pollRef.current);
      if (pollFinishRef.current) clearInterval(pollFinishRef.current);
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome"         component={WelcomeScreen} />
        <Stack.Screen name="Dashboard"       component={DashboardScreen} />
        <Stack.Screen name="SetScreen"       component={SetScreen} />
        <Stack.Screen name="CountdownScreen" component={CountdownScreen} />
        <Stack.Screen name="IgnitionScreen"  component={IgnitionScreen} />
        <Stack.Screen name="RunningScreen"   component={RunningScreen} />
        <Stack.Screen name="FinishScreen"    component={FinishScreen} />
        <Stack.Screen name="History"         component={HistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
