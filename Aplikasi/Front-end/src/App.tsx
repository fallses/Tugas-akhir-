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

// Ref untuk tracking action terakhir (untuk mencegah loop)
let lastActionRef: string | null = null;
let isFinished: boolean = false; // Flag untuk menandai proses sudah finish

export function resetLastAction() {
  lastActionRef = null;
  isFinished = false; // Reset flag finish juga
}

export default function App() {
  const pollRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollFinishRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // ── Polling /data (sterilisasi/running) ──────────────────
    async function checkAction() {
      try {
        const res = await fetchLastData();
        if (res.status !== 'success' || !res.data) return;

        const { action, suhu, tekanan, sesi, status } = res.data;
        if (!action) return;

        const nav = navigationRef.current;
        if (!nav || !nav.isReady()) return;

        // Jangan proses action jika sudah finish
        if (isFinished) return;

        // Jangan proses action yang sama berulang kali
        if (lastActionRef === action) return;
        lastActionRef = action;

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
          case 'running':
            nav.navigate('RunningScreen', {
              ...params,
              ...(suhu    != null && { inputSuhu:    suhu.toString() }),
              ...(tekanan != null && { inputTekanan: tekanan.toString() }),
            });
            break;
          case 'set':
            nav.navigate('SetScreen', params);
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
    // Data finish di-consume di backend setelah dibaca (sekali pakai)
    // Jadi tidak perlu tracking kompleks, data otomatis hilang setelah dibaca
    async function checkFinish() {
      try {
        const res = await fetchFinishData();
        if (res.status !== 'success' || !res.data) return;

        const nav = navigationRef.current;
        if (!nav || !nav.isReady()) return;

        const { suhu, tekanan, waktu } = res.data;
        console.log('[App] Finish diterima dari sterilisasi/finish (consumed)');

        // Set flag finish agar checkAction tidak proses action lagi
        isFinished = true;
        lastActionRef = null;

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

    pollRef.current       = setInterval(checkAction, POLL_INTERVAL_MS);
    pollFinishRef.current = setInterval(checkFinish, POLL_INTERVAL_MS);

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
