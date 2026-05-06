/**
 * FinishScreen.tsx
 *
 * Tampilan selesai — HANYA menampilkan ringkasan hasil sterilisasi.
 * Tidak ada otomasi, tidak mengirim/memproses data backend.
 * Tidak berpindah sendiri.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Animated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import sharedStyles, {
  COLORS,
  topBarStyles,
  stepStyles,
  finishStyles,
} from '../styles/ProcessScreen.styles';
import { ProcessParams } from '../types/process';
import { addHistory } from '../types/process';

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
      finishedAt?: string;
      status?: 'Berhasil' | 'Dihentikan';
    };
  };
  navigation: any;
}

function formatTime(secs: number): string {
  const h  = Math.floor(secs / 3600);
  const m  = Math.floor((secs % 3600) / 60);
  const s  = secs % 60;
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');
  if (h > 0) return `${h.toString().padStart(2, '0')}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

export default function FinishScreen({ route, navigation }: Props) {
  const {
    namaAlat,
    idAlat,
    sterilDetik,
    inputSuhu,
    inputTekanan,
    finishedAt,
    status = 'Berhasil',
  } = route.params;

  const checkScale = useRef(new Animated.Value(0)).current;
  const fadeIn     = useRef(new Animated.Value(0)).current;

  // Simpan ke history saat screen ini pertama kali muncul
  useEffect(() => {
    const now = new Date();

    // Waktu selesai
    const selesai = finishedAt ?? now.toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit',
    });

    // Hitung waktu mulai = waktu selesai - durasi steril
    const mulaiDate = new Date(now.getTime() - sterilDetik * 1000);
    const mulai = mulaiDate.toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit',
    });

    // Format tanggal: DD/MM/YYYY
    const d = now.getDate().toString().padStart(2, '0');
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const y = now.getFullYear();
    const tanggal = `${d}/${m}/${y}`;

    addHistory({
      id: Date.now().toString(),
      namaAlat,
      idAlat,
      suhu: inputSuhu,
      tekanan: inputTekanan,
      durasi: formatTime(sterilDetik),
      mulaiPukul: mulai,
      selesaiPukul: selesai,
      tanggal,
      status,
    });

    // Animasi masuk
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.spring(checkScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 5,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function renderSteps() {
    const currentIndex = PHASES.findIndex(p => p.key === 'finish');
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

  const isSuccess = status === 'Berhasil';
  const statusColor = isSuccess ? COLORS.green : COLORS.danger;

  return (
    <SafeAreaView style={sharedStyles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Top bar */}
      <View style={topBarStyles.container}>
        <View style={{ width: 80 }} />
        <View style={topBarStyles.titleBlock}>
          <Text style={topBarStyles.title}>{namaAlat}</Text>
          <Text style={topBarStyles.subtitle}>ID: {idAlat}</Text>
        </View>
        <View style={{ width: 80 }} />
      </View>

      {renderSteps()}

      <Animated.View style={{ flex: 1, width: '100%', opacity: fadeIn }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            alignItems: 'center',
            paddingHorizontal: 28,
            paddingTop: 16,
            paddingBottom: 32,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              finishStyles.checkRing,
              {
                transform: [{ scale: checkScale }],
                borderColor: statusColor,
                backgroundColor: isSuccess ? COLORS.goldDim : '#2A1010',
              },
            ]}
          >
            <MaterialCommunityIcons
              name={isSuccess ? 'check-bold' : 'stop'}
              size={56}
              color={statusColor}
            />
          </Animated.View>

          <Text style={[finishStyles.title, { color: statusColor }]}>
            {isSuccess ? 'Steril Selesai' : 'Proses Dihentikan'}
          </Text>
          <Text style={finishStyles.subtitle}>
            {isSuccess
              ? 'Proses sterilisasi telah berhasil diselesaikan. Alat siap digunakan.'
              : 'Proses sterilisasi dihentikan sebelum selesai.'}
          </Text>

          <View style={finishStyles.summaryBox}>
            {[
              { label: 'Alat',         value: namaAlat },
              { label: 'Suhu',         value: `${inputSuhu}°C` },
              { label: 'Tekanan',      value: `${inputTekanan} bar` },
              { label: 'Durasi Total', value: formatTime(sterilDetik) },
              { label: 'Selesai Pukul', value: finishedAt ?? '-' },
              {
                label: 'Status',
                value: isSuccess ? '✓ Berhasil' : '✗ Dihentikan',
                valueColor: statusColor,
              },
            ].map((row, i, arr) => (
              <React.Fragment key={row.label}>
                <View style={finishStyles.summaryRow}>
                  <Text style={finishStyles.summaryKey}>{row.label}</Text>
                  <Text style={[finishStyles.summaryValue, row.valueColor ? { color: row.valueColor } : {}]}>
                    {row.value}
                  </Text>
                </View>
                {i < arr.length - 1 && <View style={finishStyles.divider} />}
              </React.Fragment>
            ))}
          </View>

          <View style={{ width: '100%', gap: 10 }}>
            <TouchableOpacity
              style={finishStyles.doneBtn}
              onPress={() => {
                // Reset navigation stack agar back button kembali ke Dashboard
                navigation.reset({
                  index: 1,
                  routes: [
                    { name: 'Dashboard' },
                    {
                      name: 'SetScreen',
                      params: {
                        namaAlat,
                        idAlat,
                        sterilDetik,
                        inputSuhu,
                        inputTekanan,
                      },
                    },
                  ],
                });
              }}
            >
              <MaterialCommunityIcons name="refresh" size={18} color={COLORS.bg} />
              <Text style={finishStyles.doneBtnText}>Proses Baru</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={finishStyles.secondaryBtn}
              onPress={() => {
                // Reset ke Dashboard
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Dashboard' }],
                });
              }}
            >
              <MaterialCommunityIcons name="home-outline" size={18} color={COLORS.muted} />
              <Text style={finishStyles.secondaryBtnText}>Kembali ke Dashboard</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}
