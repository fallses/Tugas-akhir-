/**
 * SetScreen.tsx
 *
 * Tampilan SET — satu-satunya tampilan yang boleh memiliki fitur otomatis
 * (monitoring realtime dari backend) dan mengirim perintah ke backend.
 *
 * Perpindahan ke CountdownScreen terjadi HANYA saat:
 *   1. User menekan "Mulai Proses" (tombol manual)
 *   2. Backend mengirim action "countdown"
 *
 * Jika belum ada kiriman data baru → tetap di halaman ini.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import sharedStyles, {
  COLORS,
  topBarStyles,
  stepStyles,
  setStyles,
  bottomStyles,
} from '../styles/ProcessScreen.styles';
import { setActiveProcessParams } from '../App';
import { sendStart } from '../services/backendService';

const PHASES = [
  { key: 'set',       label: 'SET',     color: COLORS.accent },
  { key: 'countdown', label: 'HITUNG',  color: COLORS.accent },
  { key: 'ignition',  label: 'NYALA',   color: COLORS.fire   },
  { key: 'running',   label: 'STERIL',  color: COLORS.green  },
  { key: 'finish',    label: 'SELESAI', color: COLORS.gold   },
];

const PRESETS = [
  { label: 'Cepat',    jam: 0, menit: 15, suhu: 121, tekanan: 1.0 },
  { label: 'Standar',  jam: 0, menit: 20, suhu: 121, tekanan: 1.2 },
  { label: 'Intensif', jam: 0, menit: 30, suhu: 134, tekanan: 2.0 },
];

interface Props {
  route: {
    params: {
      namaAlat: string;
      idAlat: string;
      // Opsional: nilai awal dari proses sebelumnya
      sterilDetik?: number;
      inputSuhu?: string;
      inputTekanan?: string;
    };
  };
  navigation: any;
}

export default function SetScreen({ route, navigation }: Props) {
  const { namaAlat, idAlat } = route.params;

  const [selectedPreset, setSelectedPreset] = useState(1);
  const [inputJam, setInputJam]         = useState('0');
  const [inputMenit, setInputMenit]     = useState('20');
  const [inputSuhu, setInputSuhu]       = useState(route.params.inputSuhu ?? '121');
  const [inputTekanan, setInputTekanan] = useState(route.params.inputTekanan ?? '1.2');

  // true = user sudah tekan Mulai, sedang menunggu kiriman "countdown" dari backend
  // Navigasi ditangani sepenuhnya oleh global listener di App.tsx
  const [waitingForBackend, setWaitingForBackend] = useState(false);

  // Reset overlay saat screen kembali difokus (misal setelah navigate balik)
  useFocusEffect(
    useCallback(() => {
      return () => setWaitingForBackend(false);
    }, [])
  );

  function totalDetik(jam: string, menit: string): number {
    const j = parseInt(jam, 10)   || 0;
    const m = parseInt(menit, 10) || 0;
    const total = j * 3600 + m * 60;
    return total > 0 ? total : 60;
  }

  function buildParams() {
    return {
      namaAlat,
      idAlat,
      sterilDetik: totalDetik(inputJam, inputMenit),
      inputSuhu,
      inputTekanan,
    };
  }

  // Sync params ke global listener setiap kali input berubah
  useEffect(() => {
    setActiveProcessParams(buildParams());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputJam, inputMenit, inputSuhu, inputTekanan]);

  function applyPreset(index: number) {
    setSelectedPreset(index);
    const p = PRESETS[index];
    setInputJam(p.jam.toString());
    setInputMenit(p.menit.toString());
    setInputSuhu(p.suhu.toString());
    setInputTekanan(p.tekanan.toString());
  }

  async function handleMulaiProses() {
    // Update params agar App.tsx punya data terbaru saat navigate
    setActiveProcessParams(buildParams());
    setWaitingForBackend(true);
    // Kirim perintah start ke backend → backend publish ke sterilisasi/set
    try {
      await sendStart({ suhu: inputSuhu, tekanan: inputTekanan, device: idAlat });
    } catch {
      // Gagal kirim — tetap tampilkan loading, user bisa batalkan
    }
  }

  function handleBatalTunggu() {
    setWaitingForBackend(false);
  }

  function formatDurasiLabel(jam: string, menit: string) {
    const j = parseInt(jam, 10)   || 0;
    const m = parseInt(menit, 10) || 0;
    if (j > 0 && m > 0) return `${j}j ${m}m`;
    if (j > 0)          return `${j} jam`;
    return `${m} menit`;
  }

  function renderSteps() {
    const currentIndex = PHASES.findIndex(p => p.key === 'set');
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
        <Pressable
          style={topBarStyles.backBtn}
          onPress={() =>
            navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard')
          }
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={18} color={COLORS.muted} />
        </Pressable>
        <View style={topBarStyles.titleBlock}>
          <Text style={topBarStyles.title}>{namaAlat}</Text>
          <Text style={topBarStyles.subtitle}>ID: {idAlat}</Text>
        </View>
        <TouchableOpacity
          style={topBarStyles.historyBtn}
          onPress={() => navigation.navigate('History')}
        >
          <MaterialCommunityIcons name="history" size={16} color={COLORS.muted} />
          <Text style={topBarStyles.historyBtnText}>Riwayat</Text>
        </TouchableOpacity>
      </View>

      {renderSteps()}

      <View style={[sharedStyles.flex1, { width: '100%', paddingHorizontal: 20 }]}>
        <ScrollView
          style={{ flex: 1, width: '100%' }}
          contentContainerStyle={setStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          // Nonaktifkan scroll saat menunggu
          scrollEnabled={!waitingForBackend}
        >
          {/* Preset */}
          <Text style={setStyles.sectionLabel}>Preset Program</Text>
          <View style={setStyles.presetRow}>
            {PRESETS.map((p, i) => (
              <TouchableOpacity
                key={p.label}
                style={[setStyles.presetBtn, selectedPreset === i && setStyles.presetBtnActive]}
                onPress={() => applyPreset(i)}
              >
                <Text style={[setStyles.presetLabel, selectedPreset === i && setStyles.presetLabelActive]}>
                  {p.label}
                </Text>
                <Text style={[setStyles.presetDetail, selectedPreset === i && setStyles.presetDetailActive]}>
                  {formatDurasiLabel(p.jam.toString(), p.menit.toString())}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Durasi Steril */}
          <Text style={setStyles.sectionLabel}>Durasi Steril</Text>
          <View style={setStyles.paramCard}>
            <View style={setStyles.paramRow}>
              <View style={setStyles.paramLeft}>
                <MaterialCommunityIcons name="timer-outline" size={18} color={COLORS.accent} />
                <View>
                  <Text style={setStyles.paramName}>Jam</Text>
                  <Text style={{ color: COLORS.muted, fontSize: 10, marginTop: 1 }}>0 – 23</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TextInput
                  style={[setStyles.paramInput, { minWidth: 44 }]}
                  value={inputJam}
                  onChangeText={v => {
                    const raw = v.replace(/[^0-9]/g, '');
                    if (raw === '') { setInputJam(''); return; }
                    const num = parseInt(raw, 10);
                    if (num > 23) return;
                    setInputJam(raw);
                  }}
                  onBlur={() => {
                    const num = parseInt(inputJam, 10);
                    if (isNaN(num) || inputJam === '') { setInputJam('0'); return; }
                    if (num > 23) setInputJam('23');
                    else setInputJam(num.toString());
                  }}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="0"
                  placeholderTextColor={COLORS.muted}
                />
                <Text style={setStyles.paramUnit}>jam</Text>
              </View>
            </View>

            <View style={setStyles.paramDivider} />

            <View style={setStyles.paramRow}>
              <View style={setStyles.paramLeft}>
                <MaterialCommunityIcons name="timer-outline" size={18} color={COLORS.accent} />
                <View>
                  <Text style={setStyles.paramName}>Menit</Text>
                  <Text style={{ color: COLORS.muted, fontSize: 10, marginTop: 1 }}>0 – 59</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TextInput
                  style={[setStyles.paramInput, { minWidth: 44 }]}
                  value={inputMenit}
                  onChangeText={v => {
                    const raw = v.replace(/[^0-9]/g, '');
                    if (raw === '') { setInputMenit(''); return; }
                    const num = parseInt(raw, 10);
                    if (num > 59) return;
                    setInputMenit(raw);
                  }}
                  onBlur={() => {
                    const num = parseInt(inputMenit, 10);
                    if (isNaN(num) || inputMenit === '') { setInputMenit('0'); return; }
                    if (num > 59) setInputMenit('59');
                    else setInputMenit(num.toString());
                  }}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="20"
                  placeholderTextColor={COLORS.muted}
                />
                <Text style={setStyles.paramUnit}>menit</Text>
              </View>
            </View>
          </View>

          {/* Parameter Target */}
          <Text style={setStyles.sectionLabel}>Parameter Target</Text>
          <View style={setStyles.paramCard}>
            <View style={setStyles.paramRow}>
              <View style={setStyles.paramLeft}>
                <MaterialCommunityIcons name="thermometer-high" size={18} color={COLORS.fire} />
                <View>
                  <Text style={setStyles.paramName}>Suhu Target</Text>
                  <Text style={{ color: COLORS.muted, fontSize: 10, marginTop: 1 }}>100 – 150 °C</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TextInput
                  style={[setStyles.paramInput, { color: COLORS.fire, minWidth: 44 }]}
                  value={inputSuhu}
                  onChangeText={v => {
                    const raw = v.replace(/[^0-9]/g, '');
                    if (raw === '') { setInputSuhu(''); return; }
                    const num = parseInt(raw, 10);
                    if (num > 150) return;
                    setInputSuhu(raw);
                  }}
                  onBlur={() => {
                    const num = parseInt(inputSuhu, 10);
                    if (isNaN(num) || inputSuhu === '') { setInputSuhu('121'); return; }
                    if (num < 100) setInputSuhu('100');
                    else if (num > 150) setInputSuhu('150');
                    else setInputSuhu(num.toString());
                  }}
                  keyboardType="numeric"
                  maxLength={3}
                  placeholder="121"
                  placeholderTextColor={COLORS.muted}
                />
                <Text style={setStyles.paramUnit}>°C</Text>
              </View>
            </View>

            <View style={setStyles.paramDivider} />

            <View style={setStyles.paramRow}>
              <View style={setStyles.paramLeft}>
                <MaterialCommunityIcons name="gauge" size={18} color={COLORS.accent} />
                <View>
                  <Text style={setStyles.paramName}>Tekanan Target</Text>
                  <Text style={{ color: COLORS.muted, fontSize: 10, marginTop: 1 }}>0.5 – 3.0 bar</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TextInput
                  style={[setStyles.paramInput, { minWidth: 44 }]}
                  value={inputTekanan}
                  onChangeText={v => {
                    const clean = v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                    if (clean === '' || clean === '.') { setInputTekanan(clean); return; }
                    const num = parseFloat(clean);
                    if (isNaN(num)) return;
                    if (num > 3.0) return;
                    setInputTekanan(clean);
                  }}
                  onBlur={() => {
                    const num = parseFloat(inputTekanan);
                    if (isNaN(num) || inputTekanan === '' || inputTekanan === '.') {
                      setInputTekanan('1.2'); return;
                    }
                    if (num < 0.5) setInputTekanan('0.5');
                    else if (num > 3.0) setInputTekanan('3.0');
                    else setInputTekanan(num.toFixed(1));
                  }}
                  keyboardType="decimal-pad"
                  maxLength={4}
                  placeholder="1.2"
                  placeholderTextColor={COLORS.muted}
                />
                <Text style={setStyles.paramUnit}>bar</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[setStyles.startBtn, waitingForBackend && { opacity: 0.4 }]}
            onPress={handleMulaiProses}
            disabled={waitingForBackend}
          >
            <MaterialCommunityIcons name="play" size={18} color={COLORS.bg} />
            <Text style={setStyles.startBtnText}>Mulai Proses</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Loading overlay — muncul setelah Mulai ditekan, menunggu backend */}
      {waitingForBackend && (
        <View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(8,12,16,0.88)',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
        }}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={{
            color: COLORS.white,
            fontSize: 15,
            fontWeight: '700',
            letterSpacing: 0.5,
          }}>
            Menunggu konfirmasi backend...
          </Text>
          <Text style={{
            color: COLORS.muted,
            fontSize: 12,
            textAlign: 'center',
            paddingHorizontal: 40,
            lineHeight: 18,
          }}>
            Proses akan dimulai saat backend mengirim sinyal countdown
          </Text>

          <TouchableOpacity
            style={[bottomStyles.stopBtn, { marginTop: 12 }]}
            onPress={handleBatalTunggu}
          >
            <MaterialCommunityIcons name="close-circle-outline" size={20} color={COLORS.danger} />
            <Text style={bottomStyles.stopBtnText}>Batalkan</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
