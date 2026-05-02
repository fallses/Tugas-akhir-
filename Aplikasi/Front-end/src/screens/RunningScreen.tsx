/**
 * RunningScreen.tsx
 *
 * Tampilan sterilisasi berjalan.
 * - Bagian atas: suhu & tekanan REAL-TIME dari database (polling /running/last)
 * - Bagian bawah: suhu & tekanan TARGET yang diset dari menu Set
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
  BackHandler,
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
import { sendStop, fetchLastRunning } from '../services/backendService';
import { POLL_INTERVAL_MS } from '../config';

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

  // Suhu & tekanan real-time dari database
  const [realtimeSuhu,    setRealtimeSuhu]    = useState<number | null>(null);
  const [realtimeTekanan, setRealtimeTekanan] = useState<number | null>(null);
  const [realtimeLoading, setRealtimeLoading] = useState(true);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeIn    = useRef(new Animated.Value(0)).current;

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

  // Polling real-time suhu & tekanan dari /sterilisasi/running/last
  useEffect(() => {
    async function pollRealtime() {
      try {
        const res = await fetchLastRunning();
        if (res.status === 'success' && res.data) {
          const { suhu, tekanan } = res.data;
          if (suhu    != null) setRealtimeSuhu(suhu);
          if (tekanan != null) setRealtimeTekanan(tekanan);
        }
      } catch {
        // Gagal polling — coba lagi di interval berikutnya
      } finally {
        setRealtimeLoading(false);
      }
    }

    // Langsung poll sekali saat masuk screen
    pollRealtime();
    const interval = setInterval(pollRealtime, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  async function handleStop() {
    setStopping(true);
    try {
      await sendStop(idAlat);
    } catch {
      // Gagal kirim — tetap kembali ke SetScreen
    }
    navigation.navigate('SetScreen', route.params);
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

  const progress = sterilDetik > 0
    ? Math.min(1 - remainingSeconds / sterilDetik, 1)
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

            {/* ── 1 card: baris atas real-time, baris bawah target set ── */}
            <View style={runningStyles.monitorCard}>

              {/* Baris atas — real-time dari database */}
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

              {/* Garis pemisah */}
              <View style={runningStyles.monitorSeparator} />

              {/* Baris bawah — target dari menu Set */}
              <View style={runningStyles.monitorRow}>
                <View style={runningStyles.monitorCol}>
                  <Text style={runningStyles.monitorLabel}>Suhu Set</Text>
                  <Text style={runningStyles.monitorValueSub}>{inputSuhu}°C</Text>
                </View>
                <View style={runningStyles.monitorDivider} />
                <View style={runningStyles.monitorCol}>
                  <Text style={runningStyles.monitorLabel}>Tekanan Set</Text>
                  <Text style={runningStyles.monitorValueSub}>{inputTekanan} bar</Text>
                </View>
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
