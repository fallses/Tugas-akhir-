import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart } from 'react-native-chart-kit';
import sharedStyles, {
  COLORS,
  topBarStyles,
} from '../styles/ProcessScreen.styles';
import styles from '../styles/ManualControlScreen.styles';
import { sendManual, fetchLastManual } from '../services/backendService';
import { POLL_INTERVAL_MS } from '../config';

// ── Types ─────────────────────────────────────────────────
type ValveState   = 'OPEN' | 'CLOSE';
type GasState     = 'TUTUP' | 'KECIL' | 'SEDANG' | 'BESAR';
type StarterState = 'ON' | 'OFF';

interface Props {
  route: { params: { namaAlat: string; idAlat: string } };
  navigation: any;
}

const DEBOUNCE_MS = 400; // jeda sebelum kirim setelah tap terakhir

// ── Component ─────────────────────────────────────────────
export default function ManualControlScreen({ route, navigation }: Props) {
  const { idAlat } = route.params;

  const [valve,   setValve]   = useState<ValveState>('CLOSE');
  const [gas,     setGas]     = useState<GasState>('TUTUP');
  const [starter, setStarter] = useState<StarterState>('OFF');

  const [sending,      setSending]      = useState(false);
  const [sendStatus,   setSendStatus]   = useState<'idle' | 'success' | 'error'>('idle');

  // ── Monitor suhu & tekanan real-time ──────────────────
  const [suhu,           setSuhu]           = useState<number | null>(null);
  const [tekanan,        setTekanan]        = useState<number | null>(null);
  const [monitorLoading, setMonitorLoading] = useState(true);

  // ── Data untuk grafik (menyimpan history 20 data point terakhir) ──
  const [suhuData,    setSuhuData]    = useState<number[]>([0]);
  const [tekananData, setTekananData] = useState<number[]>([0]);
  const [labels,      setLabels]      = useState<string[]>(['0s']);
  const dataPointCounter = useRef(0);
  const MAX_DATA_POINTS = 20;
  
  // Tracking nilai terakhir untuk deteksi perubahan
  const lastSuhuValue = useRef<number | null>(null);
  const lastTekananValue = useRef<number | null>(null);

  // Ref untuk debounce timer
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref untuk state terbaru — dipakai di dalam closure debounce
  const valveRef   = useRef(valve);
  const gasRef     = useRef(gas);
  const starterRef = useRef(starter);

  // ── Polling suhu & tekanan real-time ──────────────────
  useEffect(() => {
    async function poll() {
      try {
        const res = await fetchLastManual();
        if (res.status === 'success' && res.data) {
          console.log('[Chart] Polling data:', { suhu: res.data.suhureal, tekanan: res.data.tekananreal });
          
          let suhuChanged = false;
          let tekananChanged = false;
          
          // Update suhu & tekanan
          if (res.data.suhureal != null) {
            setSuhu(res.data.suhureal);
            
            // Deteksi perubahan suhu
            if (lastSuhuValue.current !== res.data.suhureal) {
              console.log(`[Chart] Suhu berubah: ${lastSuhuValue.current} → ${res.data.suhureal}`);
              lastSuhuValue.current = res.data.suhureal;
              suhuChanged = true;
            }
          }
          
          if (res.data.tekananreal != null) {
            setTekanan(res.data.tekananreal);
            
            // Deteksi perubahan tekanan
            if (lastTekananValue.current !== res.data.tekananreal) {
              console.log(`[Chart] Tekanan berubah: ${lastTekananValue.current} → ${res.data.tekananreal}`);
              lastTekananValue.current = res.data.tekananreal;
              tekananChanged = true;
            }
          }

          // Jika ada perubahan pada salah satu atau keduanya, update grafik
          if (suhuChanged || tekananChanged) {
            console.log(`[Chart] ✅ GRAFIK UPDATE! - Suhu: ${suhuChanged ? 'YA' : 'TIDAK'}, Tekanan: ${tekananChanged ? 'YA' : 'TIDAK'}`);
            console.log(`[Chart] Nilai terbaru - Suhu: ${lastSuhuValue.current}°C, Tekanan: ${lastTekananValue.current} bar`);
            
            // Update data suhu (gunakan nilai terbaru atau nilai terakhir jika tidak berubah)
            setSuhuData(prev => {
              const currentValue = lastSuhuValue.current ?? 0;
              const newData = prev.length === 1 && prev[0] === 0 
                ? [currentValue] // Initial data
                : [...prev, currentValue]; // Tambah data baru
              const trimmed = newData.length > MAX_DATA_POINTS ? newData.slice(-MAX_DATA_POINTS) : newData;
              console.log(`[Chart] Suhu data points: ${trimmed.length}`, trimmed);
              return trimmed;
            });
            
            // Update data tekanan (gunakan nilai terbaru atau nilai terakhir jika tidak berubah)
            setTekananData(prev => {
              const currentValue = lastTekananValue.current ?? 0;
              const newData = prev.length === 1 && prev[0] === 0 
                ? [currentValue] // Initial data
                : [...prev, currentValue]; // Tambah data baru
              const trimmed = newData.length > MAX_DATA_POINTS ? newData.slice(-MAX_DATA_POINTS) : newData;
              console.log(`[Chart] Tekanan data points: ${trimmed.length}`, trimmed);
              return trimmed;
            });
            
            // Update label waktu
            dataPointCounter.current += 1;
            const now = new Date();
            const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            
            setLabels(prev => {
              const newLabels = prev.length === 1 && prev[0] === '0s'
                ? [timeLabel] // Initial label
                : [...prev, timeLabel]; // Tambah label baru
              const trimmed = newLabels.length > MAX_DATA_POINTS ? newLabels.slice(-MAX_DATA_POINTS) : newLabels;
              console.log(`[Chart] Labels: ${trimmed.length}`, trimmed);
              return trimmed;
            });
          } else {
            console.log('[Chart] ⏸️  Tidak ada perubahan data, grafik tidak diupdate');
          }
          
          // Update status aktuator dari alat (realtime)
          if (res.data.valve != null) {
            const valveValue = res.data.valve.toUpperCase() as ValveState;
            if (valveValue === 'OPEN' || valveValue === 'CLOSE') {
              setValve(valveValue);
              valveRef.current = valveValue;
            }
          }
          
          if (res.data.gas != null) {
            const gasValue = res.data.gas.toUpperCase() as GasState;
            if (['TUTUP', 'KECIL', 'SEDANG', 'BESAR'].includes(gasValue)) {
              setGas(gasValue);
              gasRef.current = gasValue;
            }
          }
          
          if (res.data.starter != null) {
            const starterValue = res.data.starter.toUpperCase() as StarterState;
            if (starterValue === 'ON' || starterValue === 'OFF') {
              setStarter(starterValue);
              starterRef.current = starterValue;
            }
          }
        }
      } catch (err) {
        console.error('[Chart] Error polling:', err);
      } finally {
        setMonitorLoading(false);
      }
    }
    
    // Run poll immediately on mount
    console.log('[Chart] 🚀 Memulai polling data sensor...');
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      console.log('[Chart] 🛑 Berhenti polling data sensor');
      clearInterval(interval);
    };
  }, []);

  // ── Kirim ke backend ──────────────────────────────────
  const dispatchSend = useCallback(async (
    v: ValveState,
    g: GasState,
    s: StarterState,
  ) => {
    setSending(true);
    setSendStatus('idle');
    try {
      await sendManual({ valve: v, gas: g, starter: s, device: idAlat });
      setSendStatus('success');
    } catch (err: any) {
      setSendStatus('error');
    } finally {
      setSending(false);
    }
  }, [idAlat]);

  // ── Debounced trigger ─────────────────────────────────
  const scheduleSend = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      dispatchSend(valveRef.current, gasRef.current, starterRef.current);
    }, DEBOUNCE_MS);
  }, [dispatchSend]);

  // ── Handlers per kontrol ──────────────────────────────
  function handleValve(value: ValveState) {
    setValve(value);
    valveRef.current = value;
    scheduleSend();
  }

  function handleGas(value: GasState) {
    setGas(value);
    gasRef.current = value;
    scheduleSend();
  }

  function handleStarter(value: StarterState) {
    setStarter(value);
    starterRef.current = value;
    scheduleSend();
  }

  // ── Render helpers ────────────────────────────────────
  function renderValveOption(value: ValveState, label: string) {
    const isActive = valve === value;
    return (
      <TouchableOpacity
        key={value}
        style={[
          styles.optionBtn,
          isActive && (value === 'OPEN' ? styles.optionBtnAccent : styles.optionBtnDanger),
        ]}
        onPress={() => handleValve(value)}
        activeOpacity={0.75}
        disabled={sending}
      >
        <Text style={[
          styles.optionBtnText,
          isActive && (value === 'OPEN' ? styles.optionBtnAccentText : styles.optionBtnDangerText),
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderGasOption(value: GasState, label: string) {
    const isActive = gas === value;
    return (
      <TouchableOpacity
        key={value}
        style={[
          styles.optionBtn,
          isActive && styles.optionBtnFire,
        ]}
        onPress={() => handleGas(value)}
        activeOpacity={0.75}
        disabled={sending}
      >
        <Text style={[
          styles.optionBtnText,
          isActive && styles.optionBtnFireText,
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderStarterOption(value: StarterState, label: string) {
    const isActive = starter === value;
    return (
      <TouchableOpacity
        key={value}
        style={[
          styles.optionBtn,
          isActive && (value === 'ON' ? styles.optionBtnGreen : styles.optionBtnDanger),
        ]}
        onPress={() => handleStarter(value)}
        activeOpacity={0.75}
        disabled={sending}
      >
        <Text style={[
          styles.optionBtnText,
          isActive && (value === 'ON' ? styles.optionBtnGreenText : styles.optionBtnDangerText),
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={sharedStyles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Top bar */}
      <View style={topBarStyles.container}>
        <View style={{ width: 80, alignItems: 'flex-start' }}>
          <TouchableOpacity
            style={topBarStyles.backBtn}
            onPress={() =>
              navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard')
            }
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={18} color={COLORS.muted} />
          </TouchableOpacity>
        </View>
        <View style={topBarStyles.titleBlock}>
          <Text style={topBarStyles.title}>Kontrol Manual</Text>
          <Text style={topBarStyles.subtitle}>ID: {idAlat}</Text>
        </View>
        {/* Indikator pengiriman */}
        <View style={{ width: 80, alignItems: 'flex-end', paddingRight: 4 }}>
          {sending ? (
            <ActivityIndicator size="small" color={COLORS.accent} />
          ) : sendStatus === 'success' ? (
            <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.green} />
          ) : sendStatus === 'error' ? (
            <MaterialCommunityIcons name="alert-circle" size={20} color={COLORS.danger} />
          ) : null}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Monitor card — suhu & tekanan real-time */}
        <View style={styles.monitorCard}>
          <View style={styles.monitorHeader}>
            <MaterialCommunityIcons name="chart-line" size={14} color={COLORS.muted} />
            <Text style={styles.monitorTitle}>Monitor Real-Time</Text>
          </View>
          <View style={styles.monitorRow}>
            {/* Suhu */}
            <View style={styles.monitorItem}>
              <MaterialCommunityIcons name="thermometer" size={22} color={COLORS.fire} />
              <Text style={styles.monitorLabel}>Suhu</Text>
              {monitorLoading ? (
                <ActivityIndicator size="small" color={COLORS.fire} />
              ) : (
                <Text style={[styles.monitorValue, { color: COLORS.fire }]}>
                  {suhu != null ? `${suhu}` : '--'}
                </Text>
              )}
              <Text style={styles.monitorUnit}>°C</Text>
            </View>

            <View style={styles.monitorDivider} />

            {/* Tekanan */}
            <View style={styles.monitorItem}>
              <MaterialCommunityIcons name="gauge" size={22} color={COLORS.accent} />
              <Text style={styles.monitorLabel}>Tekanan</Text>
              {monitorLoading ? (
                <ActivityIndicator size="small" color={COLORS.accent} />
              ) : (
                <Text style={[styles.monitorValue, { color: COLORS.accent }]}>
                  {tekanan != null ? `${tekanan}` : '--'}
                </Text>
              )}
              <Text style={styles.monitorUnit}>bar</Text>
            </View>
          </View>
        </View>

        {/* Grafik Perubahan Suhu dan Tekanan */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <MaterialCommunityIcons name="chart-areaspline" size={16} color={COLORS.muted} />
            <Text style={styles.chartTitle}>Grafik Perubahan</Text>
          </View>

          {/* Legend */}
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.fire }]} />
              <Text style={styles.legendText}>Suhu (°C)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.accent }]} />
              <Text style={styles.legendText}>Tekanan (bar)</Text>
            </View>
          </View>

          {/* Grafik Gabungan */}
          <View style={[styles.chartSection, { marginLeft: -12 }]}>
            <LineChart
              data={{
                labels: labels.length > 6 ? labels.filter((_, i) => i % Math.ceil(labels.length / 6) === 0) : labels,
                datasets: [
                  {
                    data: suhuData.length > 0 ? suhuData : [0],
                    color: () => COLORS.fire,
                    strokeWidth: 2,
                  },
                  {
                    data: tekananData.length > 0 ? tekananData : [0],
                    color: () => COLORS.accent,
                    strokeWidth: 2,
                  },
                ],
              }}
              width={Dimensions.get('window').width - 80}
              height={220}
              chartConfig={{
                backgroundColor: COLORS.surface,
                backgroundGradientFrom: COLORS.surface,
                backgroundGradientTo: COLORS.surface,
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: () => COLORS.muted,
                style: { borderRadius: 12 },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                },
                propsForBackgroundLines: {
                  strokeDasharray: '',
                  stroke: COLORS.border,
                  strokeWidth: 1,
                },
              }}
              bezier
              style={{
                borderRadius: 12,
              }}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              withDots={true}
              withShadow={false}
            />
          </View>
        </View>

        {/* Card: Katup Uap */}
        <View style={[styles.card, sending && styles.cardDisabled]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="pipe-valve" size={18} color={COLORS.accent} />
            <Text style={styles.cardTitle}>Katup Uap</Text>
          </View>
          <View style={styles.optionRow}>
            {renderValveOption('OPEN',  'OPEN')}
            {renderValveOption('CLOSE', 'CLOSE')}
          </View>
        </View>

        {/* Card: Kontrol Gas */}
        <View style={[styles.card, sending && styles.cardDisabled]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="fire" size={18} color={COLORS.fire} />
            <Text style={styles.cardTitle}>Kontrol Gas</Text>
          </View>
          <View style={styles.optionRow}>
            {renderGasOption('TUTUP',  'TUTUP')}
            {renderGasOption('KECIL',  'KECIL')}
            {renderGasOption('SEDANG', 'SEDANG')}
            {renderGasOption('BESAR',  'BESAR')}
          </View>
        </View>

        {/* Card: Starter */}
        <View style={[styles.card, sending && styles.cardDisabled]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="power" size={18} color={COLORS.green} />
            <Text style={styles.cardTitle}>Starter</Text>
          </View>
          <View style={styles.optionRow}>
            {renderStarterOption('ON',  'ON')}
            {renderStarterOption('OFF', 'OFF')}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
