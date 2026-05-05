/**
 * RunningScreen.tsx
 *
 * Tampilan sterilisasi berjalan.
 * - Baris atas card: suhu & tekanan REAL-TIME dari database (polling /running/last)
 * - Baris bawah card: suhu & tekanan TARGET dari /set/last (sekali saat masuk)
 * - Timer: REAL-TIME dari field timer yang dikirim alat (format "HH:MM:SS")
 *
 * Perpindahan ke FinishScreen HANYA terjadi saat backend mengirim sinyal finish.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { sendStop, fetchLastRunning, fetchLastSet } from '../services/backendService';
import { POLL_INTERVAL_MS } from '../config';

const PHASES = [
  { key: 'set',       label: 'SET',     color: COLORS.accent },
  { key: 'countdown', label: 'HITUNG',  color: COLORS.accent },
  { key: 'ignition',  label: 'NYALA',   color: COLORS.fire   },
  { key: 'running',   label: 'STERIL',  color: COLORS.green  },
  { key: 'finish',    label: 'SELESAI', color: COLORS.gold   },
];

interface Props {
  route: { params: ProcessParams };
  navigation: any;
}

export default function RunningScreen({ route, navigation }: Props) {
  const { namaAlat, idAlat, sterilDetik, inputSuhu, inputTekanan } = route.params;

  const [remainingSeconds, setRemainingSeconds] = useState(sterilDetik);
  const [totalSeconds, setTotalSeconds] = useState(sterilDetik); // Total durasi untuk progress bar
  const [stopping, setStopping] = useState(false);

  // Suhu & tekanan real-time dari database (topik running)
  const [realtimeSuhu,    setRealtimeSuhu]    = useState<number | null>(null);
  const [realtimeTekanan, setRealtimeTekanan] = useState<number | null>(null);
  const [realtimeLoading, setRealtimeLoading] = useState(true);

  // Suhu & tekanan target dari /set/last
  const [setSuhu,    setSetSuhu]    = useState<string>(inputSuhu);
  const [setTekanan, setSetTekanan] = useState<string>(inputTekanan);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeIn    = useRef(new Animated.Value(0)).current;
  const initialTimerSet = useRef(false); // Flag untuk set total durasi sekali saja

  // Tombol back hardware → reset stack ke SetScreen
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.reset({
        index: 1,
        routes: [
          { name: 'Dashboard' },
          { name: 'SetScreen', params: route.params },
        ],
      });
      return true;
    });
    return () => sub.remove();
  }, [navigation]);

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

  // Polling real-time suhu, tekanan & timer dari alat
  useEffect(() => {
    async function pollRealtime() {
      try {
        const res = await fetchLastRunning();
        if (res.status === 'success' && res.data) {
          const { suhu, tekanan, timer } = res.data;
          if (suhu    != null) setRealtimeSuhu(suhu);
          if (tekanan != null) setRealtimeTekanan(tekanan);

          // Update timer dari alat secara realtime (format "HH:MM:SS")
          if (timer != null) {
            const parts = String(timer).split(':');
            if (parts.length === 3) {
              const h = parseInt(parts[0], 10);
              const m = parseInt(parts[1], 10);
              const s = parseInt(parts[2], 10);
              const secs = h * 3600 + m * 60 + s;
              if (!isNaN(secs) && secs >= 0) {
                setRemainingSeconds(secs);
                
                // Set total durasi hanya sekali (saat pertama kali dapat timer dari alat)
                if (!initialTimerSet.current) {
                  setTotalSeconds(secs);
                  initialTimerSet.current = true;
                  console.log(`[RunningScreen] Total durasi diset: ${secs}s dari timer alat`);
                }
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

  // Ambil suhu & tekanan target dari /set/last (sekali saat masuk)
  useEffect(() => {
    async function loadSetData() {
      try {
        const res = await fetchLastSet();
        if (res.status === 'success' && res.data) {
          if (res.data.suhu    != null) setSetSuhu(res.data.suhu.toString());
          if (res.data.tekanan != null) setSetTekanan(res.data.tekanan.toString());
        }
      } catch {
        // Gagal — tetap pakai nilai dari route.params
      }
    }
    loadSetData();
  }, []);

  async function handleStop() {
    setStopping(true);
    try {
      await sendStop(idAlat);
    } catch {
      // Gagal kirim — tetap kembali ke SetScreen
    }
    navigation.reset({
      index: 1,
      routes: [
        { name: 'Dashboard' },
        { name: 'SetScreen', params: route.params },
      ],
    });
  }

  function formatTime(secs: number) {
    const h  = Math.floor(secs / 3600);
    const m  = Math.floor((secs % 3600) / 60);
    const s  = secs % 60;
    const mm = m.toString().padStart(2, '0');
    const ss = s.toString().padStart(2, '0');
    if (h > 0) return `${h.toString().padStart(2, '0')}:${mm}:${ss}`;
    return `${mm}:${ss}`;
  }

  const progress = totalSeconds > 0
    ? Math.max(0, Math.min(1 - remainingSeconds / totalSeconds, 1))
    : 0;
  const pct = Math.round(progress * 100);
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

            {/* Monitor card — baris atas realtime, baris bawah target set */}
            <View style={runningStyles.monitorCard}>
              {/* Baris atas — real-time */}
              <View style={runningStyles.monitorRow}>
                <View style={runningStyles.monitorCol}>
                  <Text style={runningStyles.monitorLabel}>Suhu</Text>
                  {realtimeLoading
                    ? <ActivityIndicator size="small" color={COLORS.fire} />
                    : <Text style={[runningStyles.monitorValue, { color: COLORS.fire }]}>
                        {realtimeSuhu != null ? `${realtimeSuhu}°C` : '--'}
                      </Text>
                  }
                </View>
                <View style={runningStyles.monitorDivider} />
                <View style={runningStyles.monitorCol}>
                  <Text style={runningStyles.monitorLabel}>Tekanan</Text>
                  {realtimeLoading
                    ? <ActivityIndicator size="small" color={COLORS.accent} />
                    : <Text style={[runningStyles.monitorValue, { color: COLORS.accent }]}>
                        {realtimeTekanan != null ? `${realtimeTekanan} bar` : '--'}
                      </Text>
                  }
                </View>
              </View>

              <View style={runningStyles.monitorSeparator} />

              {/* Baris bawah — target set */}
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
              </View>
            </View>

            <View style={runningStyles.progressTrack}>
              <View style={[runningStyles.progressFill, { width: `${pct}%` }]} />
            </View>
            <Text style={{
              fontSize: 42, fontWeight: '900', color: COLORS.green,
              letterSpacing: -1, marginTop: 8, lineHeight: 46,
            }}>
              {pct}%
            </Text>
            <Text style={[runningStyles.progressLabel, { fontSize: 14, marginTop: 2 }]}>selesai</Text>
          </Animated.View>
        )}
      </View>

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
