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
 *   "finish"    → FinishScreen
 *   "set"       → SetScreen (kembali ke awal)
 */

import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen  from './screens/WelcomeScreen';
import DashboardScreen from './screens/DashboardScreen';
import SetScreen      from './screens/SetScreen';
import CountdownScreen from './screens/CountdownScreen';
import RunningScreen  from './screens/RunningScreen';
import FinishScreen   from './screens/FinishScreen';
import HistoryScreen  from './screens/HistoryScreen';

import { fetchLastData } from './services/backendService';
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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function checkAction() {
      try {
        const res = await fetchLastData();
        if (res.status !== 'success' || !res.data) return;

        const { action, suhu, tekanan } = res.data;
        if (!action) return;  // null setelah di-consume backend

        const nav = navigationRef.current;
        if (!nav) return;

        // Params fallback jika activeProcessParams belum di-set
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
            nav.navigate('RunningScreen', params);
            break;
          case 'finish': {
            const now = new Date();
            nav.navigate('FinishScreen', {
              ...params,
              finishedAt: now.toLocaleTimeString('id-ID', {
                hour: '2-digit', minute: '2-digit', second: '2-digit',
              }),
              status: 'Berhasil',
            });
            break;
          }
          case 'set':
            nav.navigate('SetScreen', params);
            break;
          default:
            break;
        }
      } catch {
        // Gagal polling — diam saja, coba lagi di interval berikutnya
      }
    }

    pollRef.current = setInterval(checkAction, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome"        component={WelcomeScreen} />
        <Stack.Screen name="Dashboard"      component={DashboardScreen} />
        <Stack.Screen name="SetScreen"      component={SetScreen} />
        <Stack.Screen name="CountdownScreen" component={CountdownScreen} />
        <Stack.Screen name="RunningScreen"  component={RunningScreen} />
        <Stack.Screen name="FinishScreen"   component={FinishScreen} />
        <Stack.Screen name="History"        component={HistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
