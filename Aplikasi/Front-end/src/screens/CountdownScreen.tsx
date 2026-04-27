/**
 * CountdownScreen.tsx
 *
 * Tampilan countdown — HANYA menampilkan animasi countdown.
 * Tidak ada otomasi, tidak mengirim/memproses data backend.
 * Tidak berpindah sendiri — menunggu action "running" dari backend.
 * Jika belum ada kiriman data baru → tetap di halaman ini (loading).
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Animated } from 'react-native';
import sharedStyles, {
  COLORS,
  topBarStyles,
  stepStyles,
  countStyles,
  bottomStyles,
} from '../styles/ProcessScreen.styles';
import { ProcessParams } from '../types/process';
import { sendStop } from '../services/backendService';

const PHASES = [
  { key: 'set',       label: 'SET',     color: COLORS.accent },
  { key: 'countdown', label: 'HITUNG',  color: COLORS.accent },
  { key: 'running',   label: 'STERIL',  color: COLORS.green  },
  { key: 'finish',    label: 'SELESAI', color: COLORS.gold   },
];

interface Props {
  route: {
    params: ProcessParams;
  };
  navigation: any;
}

export default function CountdownScreen({ route, navigation }: Props) {
  const { namaAlat, idAlat } = route.params;

  const [countValue, setCountValue] = useState(3);
  const [showLoading, setShowLoading] = useState(false);
  const [stopping, setStopping] = useState(false);

  const numberScale    = useRef(new Animated.Value(1)).current;
  const numberOpacity  = useRef(new Animated.Value(1)).current;
  const ringScale      = useRef(new Animated.Value(0.8)).current;
  const ringOpacity    = useRef(new Animated.Value(0)).current;
  const ringOuterScale = useRef(new Animated.Value(0.8)).current;
  const mulaiOpacity   = useRef(new Animated.Value(0)).current;
  const mulaiScale     = useRef(new Animated.Value(0.5)).current;
  const fadeIn         = useRef(new Animated.Value(0)).current;

  const enterFade = useCallback(() => {
    fadeIn.setValue(0);
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeIn]);

  function animateTick() {
    numberScale.setValue(1.5);
    numberOpacity.setValue(1);
    ringScale.setValue(0.4);
    ringOpacity.setValue(0.9);
    ringOuterScale.setValue(0.5);
    Animated.parallel([
      Animated.timing(numberScale,    { toValue: 1,   duration: 700,  useNativeDriver: true }),
      Animated.timing(ringScale,      { toValue: 1.5, duration: 900,  useNativeDriver: true }),
      Animated.timing(ringOpacity,    { toValue: 0,   duration: 900,  useNativeDriver: true }),
      Animated.timing(ringOuterScale, { toValue: 1.8, duration: 1100, useNativeDriver: true }),
    ]).start();
  }

  function showMulai() {
    numberOpacity.setValue(0);
    Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.spring(mulaiScale,   { toValue: 1, useNativeDriver: true, tension: 60, friction: 5 }),
        Animated.timing(mulaiOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
    ]).start(() => {
      // Setelah animasi "Mulai!" selesai → tampilkan loading, tunggu backend
      setTimeout(() => setShowLoading(true), 600);
    });
  }

  useEffect(() => {
    enterFade();
    setCountValue(3);
    mulaiOpacity.setValue(0);
    mulaiScale.setValue(0.5);
    animateTick();

    const interval = setInterval(() => {
      setCountValue(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          showMulai();
          return 0;
        }
        animateTick();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleStop() {
    setStopping(true);
    try {
      await sendStop();
    } catch {
      // Gagal kirim — tetap kembali ke SetScreen
    }
    navigation.navigate('SetScreen', route.params);
  }

  function renderSteps() {
    const currentIndex = PHASES.findIndex(p => p.key === 'countdown');
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
        {!showLoading ? (
          <Animated.View style={[countStyles.wrapper, { opacity: fadeIn }]}>
            <Text style={countStyles.label}>Memulai dalam</Text>
            <View style={countStyles.centerBox}>
              <Animated.View style={[countStyles.ringOuter, { transform: [{ scale: ringOuterScale }] }]} />
              <Animated.View style={[countStyles.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
              <Animated.Text
                style={[
                  countStyles.number,
                  { transform: [{ scale: numberScale }], opacity: numberOpacity },
                ]}
              >
                {countValue > 0 ? countValue : ''}
              </Animated.Text>
              <Animated.Text
                style={[
                  countStyles.mulai,
                  { opacity: mulaiOpacity, transform: [{ scale: mulaiScale }], position: 'absolute' },
                ]}
              >
                Mulai!
              </Animated.Text>
            </View>
          </Animated.View>
        ) : (
          <View style={{ alignItems: 'center', gap: 20 }}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={{ color: COLORS.muted, fontSize: 13, letterSpacing: 1 }}>
              Menunggu konfirmasi perangkat...
            </Text>
          </View>
        )}
      </View>

      {/* Tombol Batal */}
      <View style={bottomStyles.container}>
        <TouchableOpacity
          style={bottomStyles.stopBtn}
          onPress={handleStop}
          disabled={stopping}
        >
          <MaterialCommunityIcons name="close-circle-outline" size={20} color={COLORS.danger} />
          <Text style={bottomStyles.stopBtnText}>
            {stopping ? 'Membatalkan...' : 'Batalkan Proses'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
