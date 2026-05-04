/**
 * RunningScreen.tsx
 *
 * Tampilan sterilisasi berjalan — HANYA menampilkan timer & progress.
 * Tidak ada otomasi, tidak mengirim/memproses data backend.
 * Tidak berpindah sendiri — menunggu action "finish" dari backend.
 * Jika belum ada kiriman data baru → tetap di halaman ini (loading).
 *
 * Timer berjalan mundur sebagai indikator visual saja.
 * Perpindahan ke FinishScreen HANYA terjadi saat backend mengirim action "finish".
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Animated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import sharedStyles, {
  COLORS,
  topBarStyles,
  stepStyles,
  runningStyles,
  bottomStyles,
} from '../styles/ProcessScreen.styles';
import { ProcessParams } from '../types/process';
<<<<<<< Updated upstream
import { sendStop } from '../services/backendService';
=======
import { sendStop, fetchLastRunning, fetchLastSet } from '../services/backendService';
import { POLL_INTERVAL_MS } from '../config';
>>>>>>> Stashed changes

const PHASES = [
  { key: 'set',       label: 'SET',     color: COLORS.accent },
  { key: 'countdown', label: 'HITUNG',  color: COLORS.accent },
  { key: 'ignition',  label: 'NYALA',   color: COLORS.fire   },
  { key: 'running',   label: 'STERIL',  color: COLORS.green  },
  { key: 'finish',    label: 'SELESAI', color: COLORS.gold   },
];

interface Props {
  route: {
    params: ProcessParams;
  };
  navigation: any;
}

export default function RunningScreen({ route, navigation }: Props) {
  const { namaAlat, idAlat, sterilDetik, inputSuhu, inputTekanan } = route.params;

  const [remainingSeconds, setRemainingSeconds] = useState(sterilDetik);
  const remainingRef = useRef(sterilDetik);
  const [stopping, setStopping] = useState(false);

<<<<<<< Updated upstream
=======
  // Suhu & tekanan real-time dari database (topik running)
  const [realtimeSuhu,    setRealtimeSuhu]    = useState<number | null>(null);
  const [realtimeTekanan, setRealtimeTekanan] = useState<number | null>(null);
  const [realtimeLoading, setRealtimeLoading] = useState(true);

  // Suhu & tekanan target dari database (topik set — yang dikirim saat start)
  const [setSuhu,    setSetSuhu]    = useState<string>(inputSuhu);
  const [setTekanan, setSetTekanan] = useState<string>(inputTekanan);

  // Total detik untuk progress bar — diupdate saat timer di-sync dari alat
  const totalDetikRef    = useRef(sterilDetik);
  // Sudah dapat waktu dari alat sekali atau belum
  const timerSyncedRef   = useRef(false);

>>>>>>> Stashed changes
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeIn    = useRef(new Animated.Value(0)).current;

  // Fade in saat masuk
  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeIn]);

  // Pulse animasi ikon
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Timer mundur — hanya visual, tidak memicu perpindahan screen
  useEffect(() => {
    const tick = setInterval(() => {
      setRemainingSeconds(s => {
        const next = Math.max(s - 1, 0);
        remainingRef.current = next;
        return next;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, []);

<<<<<<< Updated upstream
=======
  // Polling real-time suhu & tekanan dari /sterilisasi/running/last
  // Juga ambil waktu dari alat untuk sinkronisasi timer (sekali saja)
  useEffect(() => {
    async function pollRealtime() {
      try {
        const res = await fetchLastRunning();
        if (res.status === 'success' && res.data) {
          const { suhu, tekanan, waktu } = res.data;
          if (suhu    != null) setRealtimeSuhu(suhu);
          if (tekanan != null) setRealtimeTekanan(tekanan);

          // Sinkronisasi timer dari waktu yang dikirim alat (hanya sekali)
          if (!timerSyncedRef.current && waktu != null) {
            const parts = String(waktu).split(':');
            if (parts.length === 2) {
              const secs = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
              if (!isNaN(secs) && secs > 0) {
                setRemainingSeconds(secs);
                remainingRef.current   = secs;
                totalDetikRef.current  = secs;   // simpan sebagai total untuk progress
                timerSyncedRef.current = true;
                console.log(`[RunningScreen] Timer di-sync dari alat: ${waktu} → ${secs} detik`);
              }
            }
          }
        }
      } catch {
        // Gagal polling — coba lagi di interval berikutnya
      } finally {
        setRealtimeLoading(false);
      }
    }

    pollRealtime();
    const interval = setInterval(pollRealtime, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Ambil suhu & tekanan target dari /sterilisasi/set/last (sekali saat masuk)
  useEffect(() => {
    async function loadSetData() {
      try {
        const res = await fetchLastSet();
        if (res.status === 'success' && res.data) {
          const { suhu, tekanan } = res.data;
          if (suhu    != null) setSetSuhu(suhu.toString());
          if (tekanan != null) setSetTekanan(tekanan.toString());
        }
      } catch {
        // Gagal — tetap pakai nilai dari route.params
      }
    }
    loadSetData();
  }, []);

>>>>>>> Stashed changes
  async function handleStop() {
    setStopping(true);
    try {
      await sendStop(idAlat);
    } catch {
      // Gagal kirim — tetap kembali ke SetScreen
    }
    navigation.navigate('SetScreen', route.params);
  }

  function formatTime(secs: number) {    const h  = Math.floor(secs / 3600);
    const m  = Math.floor((secs % 3600) / 60);
    const s  = secs % 60;
    const mm = m.toString().padStart(2, '0');
    const ss = s.toString().padStart(2, '0');
    if (h > 0) return `${h.toString().padStart(2, '0')}:${mm}:${ss}`;
    return `${mm}:${ss}`;
  }

  const progress = totalDetikRef.current > 0
    ? Math.min(1 - remainingSeconds / totalDetikRef.current, 1)
    : 0;
  const pct = Math.round(progress * 100);

  // Timer habis tapi belum ada kiriman finish → tampilkan loading
  const timerDone = remainingSeconds <= 0;

  function renderSteps() {
    const currentIndex = PHASES.findIndex(p => p.key === 'running');
    return (
      <View style={stepStyles.container}>
        {PHASES.map((p, i) => {
          const isActive = i === currentIndex;
          const isDone   = i < currentIndex;
          const color    = isActive ? p.color : isDone ? COLORS.muted : COLORS.dim;
          return (
            <React.Fragment key={p.key}>
              {i > 0 && (
                <View style={[stepStyles.stepLine, { backgroundColor: isDone ? COLORS.muted : COLORS.dim }]} />
              )}
              <View style={stepStyles.stepItem}>
                <View style={[stepStyles.stepDot, { backgroundColor: color }]} />
                <Text style={[stepStyles.stepLabel, { color }]}>{p.label}</Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    );
  }

  return (
    <SafeAreaView style={sharedStyles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Top bar */}
      <View style={topBarStyles.container}>
        <View style={{ width: 36 }} />
        <View style={topBarStyles.titleBlock}>
          <Text style={topBarStyles.title}>{namaAlat}</Text>
          <Text style={topBarStyles.subtitle}>ID: {idAlat}</Text>
        </View>
        <View style={{ width: 70 }} />
      </View>

      {renderSteps()}

      <View style={[sharedStyles.flex1, sharedStyles.center]}>
        {timerDone ? (
          /* Timer habis, menunggu konfirmasi finish dari backend */
          <View style={{ alignItems: 'center', gap: 20 }}>
            <ActivityIndicator size="large" color={COLORS.gold} />
            <Text style={{ color: COLORS.muted, fontSize: 13, letterSpacing: 1, textAlign: 'center', paddingHorizontal: 32 }}>
              Menunggu konfirmasi selesai dari perangkat...
            </Text>
          </View>
        ) : (
          <Animated.View style={[runningStyles.wrapper, { opacity: fadeIn }]}>
            <Animated.View style={[runningStyles.iconRing, { transform: [{ scale: pulseAnim }] }]}>
              <MaterialCommunityIcons name="atom" size={50} color={COLORS.green} />
            </Animated.View>
            <Text style={runningStyles.label}>Sterilisasi Berjalan</Text>
            <Text style={runningStyles.timer}>{formatTime(remainingSeconds)}</Text>
            <Text style={runningStyles.timerSub}>Sisa waktu</Text>
            <View style={runningStyles.statsRow}>
              <View style={runningStyles.statCard}>
                <MaterialCommunityIcons name="thermometer-high" size={20} color={COLORS.fire} />
                <Text style={runningStyles.statValue}>{inputSuhu}°C</Text>
                <Text style={runningStyles.statLabel}>Suhu</Text>
              </View>
<<<<<<< Updated upstream
              <View style={runningStyles.statCard}>
                <MaterialCommunityIcons name="gauge" size={20} color={COLORS.accent} />
                <Text style={runningStyles.statValue}>{inputTekanan} bar</Text>
                <Text style={runningStyles.statLabel}>Tekanan</Text>
=======

              {/* Garis pemisah */}
              <View style={runningStyles.monitorSeparator} />

              {/* Baris bawah — target dari menu Set */}
              <View style={runningStyles.monitorRow}>
                <View style={runningStyles.monitorCol}>
                  <Text style={runningStyles.monitorLabel}>Suhu Set</Text>
                  <Text style={runningStyles.monitorValueSub}>{setSuhu}°C</Text>
                </View>
                <View style={runningStyles.monitorDivider} />
                <View style={runningStyles.monitorCol}>
                  <Text style={runningStyles.monitorLabel}>Tekanan Set</Text>
                  <Text style={runningStyles.monitorValueSub}>{setTekanan} bar</Text>
                </View>
>>>>>>> Stashed changes
              </View>
            </View>
            <View style={runningStyles.progressTrack}>
              <View style={[runningStyles.progressFill, { width: `${pct}%` }]} />
            </View>
            <Text style={{
              fontSize: 42,
              fontWeight: '900',
              color: COLORS.green,
              letterSpacing: -1,
              marginTop: 8,
              lineHeight: 46,
            }}>
              {pct}%
            </Text>
            <Text style={[runningStyles.progressLabel, { fontSize: 14, marginTop: 2 }]}>selesai</Text>
          </Animated.View>
        )}
      </View>

      {/* Tombol hentikan */}
      {!timerDone && (
        <View style={bottomStyles.container}>
          <TouchableOpacity
            style={bottomStyles.stopBtn}
            onPress={handleStop}
            disabled={stopping}
          >
            <MaterialCommunityIcons name="stop-circle-outline" size={20} color={COLORS.danger} />
            <Text style={bottomStyles.stopBtnText}>
              {stopping ? 'Menghentikan...' : 'Hentikan Proses'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
