/**
 * IgnitionScreen.tsx
 *
 * Tampilan ignition — menampilkan status percobaan menyalakan kompor.
 * Tidak ada otomasi internal. Semua perubahan state datang dari backend via App.tsx.
 *
 * Alur yang dikendalikan backend:
 *   sesi 1 prosesing  → tampil, tunggu
 *   sesi 1 api menyala → update tampilan
 *   sesi 2 prosesing  → update tampilan
 *   sesi 2 api menyala → update tampilan
 *   sesi 3 prosesing  → update tampilan
 *   sesi 3 api menyala → update tampilan
 *   action "running"  → App.tsx navigate ke RunningScreen
 *
 * Jika belum ada kiriman baru → tetap di halaman ini (loading indicator).
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
  ignitionStyles,
  bottomStyles,
} from '../styles/ProcessScreen.styles';
import { ProcessParams } from '../types/process';
import { sendStop } from '../services/backendService';

const MAX_SESI = 3;

const PHASES = [
  { key: 'set',       label: 'SET',     color: COLORS.accent },
  { key: 'countdown', label: 'HITUNG',  color: COLORS.accent },
  { key: 'ignition',  label: 'NYALA',   color: COLORS.fire   },
  { key: 'running',   label: 'STERIL',  color: COLORS.green  },
  { key: 'finish',    label: 'SELESAI', color: COLORS.gold   },
];

interface Props {
  route: {
    params: ProcessParams & {
      sesi: number;
      ignitionStatus: 'prosesing' | 'api menyala';
    };
  };
  navigation: any;
}

export default function IgnitionScreen({ route, navigation }: Props) {
  const { namaAlat, idAlat } = route.params;

  // Baca sesi & status dari params — akan berubah saat App.tsx panggil setParams
  const sesi           = route.params.sesi           ?? 1;
  const ignitionStatus = route.params.ignitionStatus ?? 'prosesing';

  const apiMenyala = ignitionStatus === 'api menyala';

  // Apakah sesi 3 api menyala sudah tercapai → tampilkan loading tunggu action berikutnya
  const waitingNext = sesi >= MAX_SESI && apiMenyala;

  const [stopping, setStopping] = useState(false);

  const flameAnim = useRef(new Animated.Value(1)).current;
  const fadeIn    = useRef(new Animated.Value(0)).current;
  const barAnim   = useRef(new Animated.Value(0)).current;

  // Jalankan ulang animasi setiap kali sesi atau status berubah
  useEffect(() => {
    // Fade in
    fadeIn.setValue(0);
    Animated.timing(fadeIn, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    // Bar progress
    barAnim.setValue(apiMenyala ? 1 : 0);
    if (!apiMenyala) {
      Animated.timing(barAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      }).start();
    }

    // Flame flicker
    const flicker = Animated.loop(
      Animated.sequence([
        Animated.timing(flameAnim, {
          toValue: apiMenyala ? 1.3 : 1.08,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(flameAnim, {
          toValue: apiMenyala ? 0.82 : 0.94,
          duration: 160,
          useNativeDriver: true,
        }),
      ])
    );
    flicker.start();
    return () => flicker.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesi, ignitionStatus]);

  async function handleStop() {
    setStopping(true);
    try {
      await sendStop(idAlat);
    } catch {
      // Gagal kirim — tetap kembali
    }
    navigation.navigate('SetScreen', route.params);
  }

  const barWidth   = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const flameColor = apiMenyala ? COLORS.fire : COLORS.muted;
  const titleColor = apiMenyala ? COLORS.fire : COLORS.accent;
  const ringBorder = apiMenyala ? COLORS.fire : COLORS.accent;
  const ringBg     = apiMenyala ? COLORS.fireDim : COLORS.accentDim;

  function renderSteps() {
    const currentIndex = PHASES.findIndex(p => p.key === 'ignition');
    return (
      <View style={stepStyles.container}>
        {PHASES.map((p, i) => {
          const isActive = i === currentIndex;
          const isDone   = i < currentIndex;
          const color    = isActive ? p.color : isDone ? COLORS.muted : COLORS.dim;
          return (
            <View key={p.key} style={stepStyles.stepItem}>
              <View style={[stepStyles.stepDot, { backgroundColor: color }]} />
              <Text style={[stepStyles.stepLabel, { color }]}>{p.label}</Text>
            </View>
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
        <View style={{ width: 40 }} />
        <View style={topBarStyles.titleBlock}>
          <Text style={topBarStyles.title}>{namaAlat}</Text>
          <Text style={topBarStyles.subtitle}>ID: {idAlat}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {renderSteps()}

      {/* Konten utama */}
      {waitingNext ? (
        /* Sesi 3 api menyala — tunggu action berikutnya dari backend */
        <View style={[sharedStyles.flex1, sharedStyles.center, { gap: 20 }]}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={{ color: COLORS.green, fontSize: 14, fontWeight: '700', letterSpacing: 0.5 }}>
            Semua sesi berhasil
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 12, textAlign: 'center', paddingHorizontal: 40 }}>
            Menunggu konfirmasi sterilisasi dari perangkat...
          </Text>
        </View>
      ) : (
        <Animated.View style={[sharedStyles.flex1, sharedStyles.center, { opacity: fadeIn }]}>
          <View style={ignitionStyles.wrapper}>

            {/* Flame icon */}
            <View style={{ position: 'relative', marginBottom: 28 }}>
              <Animated.View style={[
                ignitionStyles.flameRingOuter,
                {
                  borderColor: ringBorder,
                  transform: [{ scale: flameAnim }],
                  opacity: apiMenyala ? 0.5 : 0.2,
                },
              ]} />
              <Animated.View style={[
                ignitionStyles.flameRing,
                {
                  borderColor: ringBorder,
                  backgroundColor: ringBg,
                  transform: [{ scale: flameAnim }],
                },
              ]}>
                <MaterialCommunityIcons
                  name={apiMenyala ? 'fire' : 'fire-off'}
                  size={56}
                  color={flameColor}
                />
              </Animated.View>
            </View>

            {/* Title */}
            <Text style={[ignitionStyles.title, { color: titleColor }]}>
              {apiMenyala ? 'Api Menyala' : 'Ignition'}
            </Text>

            {/* Subtitle */}
            <Text style={ignitionStyles.subtitle}>
              {apiMenyala
                ? `Kompor berhasil dinyalakan pada sesi ${sesi}`
                : `Mencoba menyalakan kompor... (Sesi ${sesi}/${MAX_SESI})`}
            </Text>

            {/* Status label */}
            <Text style={[ignitionStyles.barLabel, { color: apiMenyala ? COLORS.fire : COLORS.muted, marginTop: 20 }]}>
              {apiMenyala
                ? '✓ Berhasil — menunggu konfirmasi berikutnya'
                : sesi > 1
                  ? `Percobaan ${sesi} dari ${MAX_SESI}`
                  : 'Menginisialisasi sistem'}
            </Text>

            {/* Sesi indicator dots */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 24 }}>
              {Array.from({ length: MAX_SESI }).map((_, i) => {
                const idx  = i + 1;
                const done = idx < sesi || (idx === sesi && apiMenyala);
                const active = idx === sesi;
                return (
                  <View
                    key={idx}
                    style={{
                      width: active ? 24 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: done
                        ? COLORS.fire
                        : active
                          ? (apiMenyala ? COLORS.fire : COLORS.accent)
                          : COLORS.dim,
                    }}
                  />
                );
              })}
            </View>

          </View>
        </Animated.View>
      )}

      {/* Tombol Hentikan */}
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
    </SafeAreaView>
  );
}
