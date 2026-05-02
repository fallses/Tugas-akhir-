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
 *   POST /sterilisasi/set         → kirim start / stop ke alat
 *
 * Karena /running/last membaca dari DB (tidak di-consume), frontend
 * melacak _id terakhir yang sudah diproses agar tidak trigger ulang.
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

import { fetchLastRunning, fetchLastFinish } from './services/backendService';
import { POLL_INTERVAL_MS } from './config';

const Stack = createNativeStackNavigator();

// Ref navigasi global — digunakan oleh listener di luar komponen
const navigationRef = React.createRef<NavigationContainerRef<any>>();

/**
 * Simpan params proses aktif agar bisa diteruskan ke screen berikutnya
 * saat action datang dari backend.
 */
let activeProcessParams: {
  namaAlat:    string;
  idAlat:      string;
  sterilDetik: number;
  inputSuhu:   string;
  inputTekanan: string;
} | null = null;

export function setActiveProcessParams(params: typeof activeProcessParams) {
  activeProcessParams = params;
}

export default function App() {
  const pollRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollFinishRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  // Tracking _id running terakhir yang sudah diproses — cegah trigger duplikat
  const lastRunningId   = useRef<string | null>(null);

  useEffect(() => {
    // ── Polling /sterilisasi/running/last ────────────────────
    async function checkRunning() {
      try {
        const res = await fetchLastRunning();
        if (res.status !== 'success' || !res.data) return;

        const { _id, action, suhu, tekanan, sesi, status } = res.data;
        if (!action) return;

        // Sudah diproses sebelumnya → skip
        if (_id && _id === lastRunningId.current) return;
        lastRunningId.current = _id ?? null;

        const nav = navigationRef.current;
        if (!nav || !nav.isReady()) return;

        console.log(`[App] Running action diterima: "${action}" (id: ${_id})`);

        const params = activeProcessParams ?? {
          namaAlat:    '-',
          idAlat:      '-',
          sterilDetik: 20 * 60,
          inputSuhu:   suhu?.toString()     ?? '121',
          inputTekanan: tekanan?.toString() ?? '1.2',
        };

        switch (action) {
          case 'countdown':
            nav.navigate('CountdownScreen', params);
            break;

          case 'running':
            nav.navigate('RunningScreen', {
              ...params,
              ...(suhu    != null && { inputSuhu:    suhu.toString() }),
              ...(tekanan != null && { inputTekanan: tekanan.toString() }),
            });
            break;

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

        const nav = navigationRef.current;
        if (!nav || !nav.isReady()) return;

        const { suhu, tekanan, waktu } = res.data;
        console.log('[App] Finish diterima dari sterilisasi/finish/last');

        const params = activeProcessParams ?? {
          namaAlat:    '-',
          idAlat:      '-',
          sterilDetik: 20 * 60,
          inputSuhu:   suhu?.toString()     ?? '121',
          inputTekanan: tekanan?.toString() ?? '1.2',
        };

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
                status: 'Berhasil',
              },
            },
          ],
        });
      } catch {
        // Gagal polling — coba lagi di interval berikutnya
      }
    }

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
