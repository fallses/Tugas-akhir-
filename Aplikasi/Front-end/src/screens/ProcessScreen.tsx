import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Pressable,
  Animated,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import sharedStyles, {
  COLORS,
  topBarStyles,
  stepStyles,
  setStyles,
  countStyles,
  ignitionStyles,
  runningStyles,
  finishStyles,
  bottomStyles,
  historyStyles,
} from '../styles/ProcessScreen.styles';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
type Phase = 'set' | 'countdown' | 'ignition' | 'running' | 'finish';

<<<<<<< aplikasi3
export interface HistoryEntry {
=======
interface HistoryEntry {
>>>>>>> main
  id: string;
  namaAlat: string;
  idAlat: string;
  suhu: string;
  tekanan: string;
  durasi: string;        // formatted HH:MM:SS
  selesaiPukul: string;
  tanggal: string;
  status: 'Berhasil' | 'Dihentikan';
<<<<<<< aplikasi3
  notes?: string;
=======
>>>>>>> main
}

interface Props {
  route: {
    params: {
      namaAlat: string;
      idAlat: string;
    };
  };
  navigation: any;
}

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────
const PHASES: { key: Phase; label: string; color: string }[] = [
  { key: 'set',       label: 'SET',     color: COLORS.accent },
  { key: 'countdown', label: 'HITUNG',  color: COLORS.accent },
  { key: 'ignition',  label: 'NYALA',   color: COLORS.fire   },
  { key: 'running',   label: 'STERIL',  color: COLORS.green  },
  { key: 'finish',    label: 'SELESAI', color: COLORS.gold   },
];

const IGNITION_MS = 3000;
// Each ignition session attempts to connect to MQTT for this duration
const IGNITION_SESSION_MS = 3000;
const MAX_IGNITION_SESSIONS = 3;

const PRESETS = [
  { label: 'Cepat',    jam: 0, menit: 15, suhu: 121, tekanan: 1.0 },
  { label: 'Standar',  jam: 0, menit: 20, suhu: 121, tekanan: 1.2 },
  { label: 'Intensif', jam: 0, menit: 30, suhu: 134, tekanan: 2.0 },
];

<<<<<<< aplikasi3
// In-memory global history (gunakan AsyncStorage di produksi)
export let globalHistory: HistoryEntry[] = [];

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────
export default function ProcessScreen({ route, navigation }: Props) {
  const { namaAlat, idAlat } = route.params;

  // Phase
  const [phase, setPhase] = useState<Phase>('set');

  // Countdown
  const [countValue, setCountValue] = useState(3);

  // Running
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sterilDetik, setSterilDetik]       = useState(20 * 60);

  // Finish
  const [finishedAt, setFinishedAt] = useState('');

  // History list + detail/notes modal
  const [history, setHistory]               = useState<HistoryEntry[]>(globalHistory);
  const [showHistory, setShowHistory]       = useState(false);
  const [selectedEntry, setSelectedEntry]   = useState<HistoryEntry | null>(null);
  const [showDetail, setShowDetail]         = useState(false);
  const [editingNotes, setEditingNotes]     = useState(false);
  const [notesText, setNotesText]           = useState('');

  // Ignition retry
  const [ignitionSession, setIgnitionSession] = useState(1);
  const [ignitionError, setIgnitionError]     = useState('');
  const MAX_IGNITION_SESSIONS = 3;
  const IGNITION_SESSION_MS   = IGNITION_MS;

  // Preset + parameter inputs
  const [selectedPreset, setSelectedPreset] = useState(1);
  const [inputJam, setInputJam]             = useState('0');
  const [inputMenit, setInputMenit]         = useState('20');
  const [inputSuhu, setInputSuhu]           = useState('121');
  const [inputTekanan, setInputTekanan]     = useState('1.2');

  // Realtime monitoring simulation
  const [monitorSuhu, setMonitorSuhu]       = useState(28);
  const [monitorTekanan, setMonitorTekanan] = useState(1.0);

  // Ref to track elapsed for stop (avoids stale closure)
  const elapsedRef = useRef(0);
  useEffect(() => { elapsedRef.current = elapsedSeconds; }, [elapsedSeconds]);

  // ── Animated values
=======
// In-memory history store (use AsyncStorage in production)
let globalHistory: HistoryEntry[] = [];

export default function ProcessScreen({ route, navigation }: Props) {
  const { namaAlat, idAlat } = route.params;

  const [phase, setPhase]                   = useState<Phase>('set');
  const [countValue, setCountValue]         = useState(3);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finishedAt, setFinishedAt]         = useState('');
  const [finishStatus, setFinishStatus]     = useState<'Berhasil' | 'Dihentikan'>('Berhasil');
  const [showHistory, setShowHistory]       = useState(false);
  const [history, setHistory]               = useState<HistoryEntry[]>(globalHistory);

  // Ignition session state
  const [ignitionSession, setIgnitionSession] = useState(1);
  const [ignitionError, setIgnitionError]     = useState('');

  const [selectedPreset, setSelectedPreset] = useState(1);
  const [inputJam, setInputJam]             = useState('0');
  const [inputMenit, setInputMenit]         = useState('20');
  // Suhu & tekanan are fixed defaults (no longer editable in SET screen)
  const [inputSuhu]                         = useState('121');
  const [inputTekanan]                      = useState('1.2');
  const [sterilDetik, setSterilDetik]       = useState(20 * 60);

  const [monitorSuhu, setMonitorSuhu]       = useState(28);
  const [monitorTekanan, setMonitorTekanan] = useState(1.0);

  // Refs for elapsed at stop (to record correct duration)
  const elapsedRef = useRef(0);
  useEffect(() => { elapsedRef.current = elapsedSeconds; }, [elapsedSeconds]);

>>>>>>> main
  const numberScale    = useRef(new Animated.Value(1)).current;
  const numberOpacity  = useRef(new Animated.Value(1)).current;
  const ringScale      = useRef(new Animated.Value(0.8)).current;
  const ringOpacity    = useRef(new Animated.Value(0)).current;
  const ringOuterScale = useRef(new Animated.Value(0.8)).current;
  const mulaiOpacity   = useRef(new Animated.Value(0)).current;
  const mulaiScale     = useRef(new Animated.Value(0.5)).current;
  const pulseAnim      = useRef(new Animated.Value(1)).current;
  const ignitionBar    = useRef(new Animated.Value(0)).current;
  const ignitionFlame  = useRef(new Animated.Value(1)).current;
  const fadeIn         = useRef(new Animated.Value(1)).current;
  const checkScale     = useRef(new Animated.Value(0)).current;

  const enterFade = useCallback(() => {
    fadeIn.setValue(0);
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeIn]);

<<<<<<< aplikasi3
  // ─────────────────────────────────────────────────────
  // Monitoring simulation (SET phase only)
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'set') return;
    const interval = setInterval(() => {
      setMonitorSuhu(prev =>
        parseFloat(Math.max(26, Math.min(32, prev + (Math.random() - 0.5) * 0.4)).toFixed(1))
      );
      setMonitorTekanan(prev =>
        parseFloat(Math.max(0.95, Math.min(1.05, prev + (Math.random() - 0.5) * 0.02)).toFixed(2))
      );
=======
  // Monitoring simulation in 'set' phase
  useEffect(() => {
    if (phase !== 'set') return;
    const interval = setInterval(() => {
      setMonitorSuhu(prev => parseFloat(Math.max(26, Math.min(32, prev + (Math.random() - 0.5) * 0.4)).toFixed(1)));
      setMonitorTekanan(prev => parseFloat(Math.max(0.95, Math.min(1.05, prev + (Math.random() - 0.5) * 0.02)).toFixed(2)));
>>>>>>> main
    }, 1500);
    return () => clearInterval(interval);
  }, [phase]);

<<<<<<< aplikasi3
  // ─────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────
  function totalDetik(jam: string, menit: string): number {
    const j = parseInt(jam, 10)   || 0;
    const m = parseInt(menit, 10) || 0;
    return Math.max(60, j * 3600 + m * 60);
  }

  function clampJam(v: number)    { return Math.max(0,   Math.min(23,  v)); }
  function clampMenit(v: number)  { return Math.max(0,   Math.min(59,  v)); }
=======
  function totalDetik(jam: string, menit: string): number {
    const j = parseInt(jam, 10)   || 0;
    const m = parseInt(menit, 10) || 0;
    const total = j * 3600 + m * 60;
    return total > 0 ? total : 60;
  }

  function clampJam(val: number)   { return Math.max(0, Math.min(23, val)); }
  function clampMenit(val: number) { return Math.max(0, Math.min(59, val)); }
>>>>>>> main

  function formatTime(secs: number) {
    const h  = Math.floor(secs / 3600);
    const m  = Math.floor((secs % 3600) / 60);
    const s  = secs % 60;
    const mm = m.toString().padStart(2, '0');
    const ss = s.toString().padStart(2, '0');
    return h > 0 ? `${h.toString().padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`;
  }

  function formatDurasiLabel(jam: string, menit: string) {
    const j = parseInt(jam, 10)   || 0;
    const m = parseInt(menit, 10) || 0;
    if (j > 0 && m > 0) return `${j}j ${m}m`;
    if (j > 0)          return `${j} jam`;
    return `${m} menit`;
  }

  function phaseColor() {
    return PHASES.find(p => p.key === phase)?.color ?? COLORS.accent;
  }

  function goBack() {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Dashboard');
  }

  // ─────────────────────────────────────────────────────
  // Preset + input handlers
  // ─────────────────────────────────────────────────────
  function applyPreset(index: number) {
    setSelectedPreset(index);
    const p = PRESETS[index];
    setInputJam(p.jam.toString());
    setInputMenit(p.menit.toString());
  }

  function handleMulaiProses() {
    setSterilDetik(totalDetik(inputJam, inputMenit));
    setIgnitionSession(1);
    setIgnitionError('');
    setPhase('countdown');
  }

<<<<<<< aplikasi3
  // ─────────────────────────────────────────────────────
  // History helpers
  // ─────────────────────────────────────────────────────
=======
  /** Save a history entry */
>>>>>>> main
  function saveHistory(status: 'Berhasil' | 'Dihentikan', durasiDetik: number) {
    const now = new Date();
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      namaAlat,
      idAlat,
      suhu: inputSuhu,
      tekanan: inputTekanan,
      durasi: formatTime(durasiDetik),
      selesaiPukul: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      tanggal: now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      status,
    };
    globalHistory = [entry, ...globalHistory].slice(0, 50);
    setHistory([...globalHistory]);
  }

  function handleStop() {
    saveHistory('Dihentikan', elapsedRef.current);
    setPhase('set');
    setElapsedSeconds(0);
  }

<<<<<<< aplikasi3
  function openDetail(entry: HistoryEntry) {
    setSelectedEntry(entry);
    setNotesText(entry.notes ?? '');
    setEditingNotes(false);
    setShowDetail(true);
  }

  function saveNotes() {
    if (!selectedEntry) return;
    const updated = globalHistory.map(e =>
      e.id === selectedEntry.id ? { ...e, notes: notesText } : e
    );
    globalHistory = updated;
    setHistory([...updated]);
    setSelectedEntry(prev => prev ? { ...prev, notes: notesText } : prev);
    setEditingNotes(false);
  }

  // ─────────────────────────────────────────────────────
  // Phase effects
  // ─────────────────────────────────────────────────────

  // COUNTDOWN
=======
  // ── COUNTDOWN
>>>>>>> main
  useEffect(() => {
    if (phase !== 'countdown') return;
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
  }, [phase]);

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
    ]).start(() => setTimeout(() => setPhase('ignition'), 800));
  }

<<<<<<< aplikasi3
  // IGNITION — dengan retry hingga MAX_IGNITION_SESSIONS
=======
  // ── IGNITION — 3 sesi retry dengan simulasi MQTT
  // ignitionSession tracks current attempt (1, 2, 3)
>>>>>>> main
  useEffect(() => {
    if (phase !== 'ignition') return;
    enterFade();
    ignitionBar.setValue(0);

<<<<<<< aplikasi3
    Animated.timing(ignitionBar, {
      toValue: 1,
      duration: IGNITION_SESSION_MS,
      useNativeDriver: false,
    }).start();
=======
    // Animate the progress bar for this session
    Animated.timing(ignitionBar, { toValue: 1, duration: IGNITION_SESSION_MS, useNativeDriver: false }).start();
>>>>>>> main

    const flicker = Animated.loop(
      Animated.sequence([
        Animated.timing(ignitionFlame, { toValue: 1.2,  duration: 200, useNativeDriver: true }),
        Animated.timing(ignitionFlame, { toValue: 0.85, duration: 200, useNativeDriver: true }),
      ])
    );
    flicker.start();

<<<<<<< aplikasi3
    // Simulasi MQTT: ~60% sukses per sesi
    const mqttSuccess = Math.random() > 0.4;
=======
    // Simulate MQTT response: randomly succeed or fail (in production replace with real MQTT check)
    const mqttSuccess = Math.random() > 0.4; // ~60% chance success per session for demo
>>>>>>> main

    const timer = setTimeout(() => {
      flicker.stop();
      if (mqttSuccess) {
<<<<<<< aplikasi3
        setIgnitionError('');
        setPhase('running');
      } else {
        if (ignitionSession < MAX_IGNITION_SESSIONS) {
          setIgnitionSession(s => s + 1);
          // useEffect re-runs karena ignitionSession berubah
        } else {
          setIgnitionError(
            `Gagal terhubung ke perangkat setelah ${MAX_IGNITION_SESSIONS} percobaan. Periksa koneksi MQTT.`
          );
=======
        // MQTT connected — proceed to running
        setIgnitionError('');
        setPhase('running');
      } else {
        // MQTT failed this session
        if (ignitionSession < MAX_IGNITION_SESSIONS) {
          // Retry next session
          setIgnitionSession(s => s + 1);
          // Stay in ignition phase — useEffect will re-run due to ignitionSession change
        } else {
          // All 3 sessions failed — kembali ke SET dengan pesan error
          setIgnitionError('Gagal terhubung ke perangkat setelah 3 percobaan. Periksa koneksi MQTT.');
>>>>>>> main
          setIgnitionSession(1);
          setPhase('set');
        }
      }
    }, IGNITION_SESSION_MS);

    return () => { clearTimeout(timer); flicker.stop(); };
  }, [phase, ignitionSession]);

<<<<<<< aplikasi3
  // RUNNING — countdown dari sterilDetik → 0
=======
  // ── RUNNING — countdown (sterilDetik → 0)
>>>>>>> main
  useEffect(() => {
    if (phase !== 'running') return;
    enterFade();
    setElapsedSeconds(sterilDetik);

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();

    const tick = setInterval(() => {
      setElapsedSeconds(s => {
        const next = s - 1;
        if (next <= 0) {
          clearInterval(tick);
          pulse.stop();
          const now = new Date();
<<<<<<< aplikasi3
          setFinishedAt(
            now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          );
=======
          const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setFinishedAt(timeStr);
          setFinishStatus('Berhasil');
>>>>>>> main
          saveHistory('Berhasil', sterilDetik);
          setPhase('finish');
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => { clearInterval(tick); pulse.stop(); };
  }, [phase, sterilDetik]);

  // FINISH
  useEffect(() => {
    if (phase !== 'finish') return;
    enterFade();
    checkScale.setValue(0);
    Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, tension: 50, friction: 5 }).start();
  }, [phase]);

<<<<<<< aplikasi3
  // ─────────────────────────────────────────────────────
  // Renders
  // ─────────────────────────────────────────────────────

  function renderTopBar() {
    const color  = phaseColor();
    const isLive = phase === 'running' || phase === 'ignition';
    const label  = isLive ? 'LIVE' : phase === 'finish' ? 'DONE' : 'READY';

=======
  // ── HELPERS
  function formatTime(secs: number) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const mm = m.toString().padStart(2, '0');
    const ss = s.toString().padStart(2, '0');
    if (h > 0) return `${h.toString().padStart(2, '0')}:${mm}:${ss}`;
    return `${mm}:${ss}`;
  }

  function formatDurasiLabel(jam: string, menit: string) {
    const j = parseInt(jam, 10)   || 0;
    const m = parseInt(menit, 10) || 0;
    if (j > 0 && m > 0) return `${j}j ${m}m`;
    if (j > 0)          return `${j} jam`;
    return `${m} menit`;
  }

  function phaseColor() {
    return PHASES.find(p => p.key === phase)?.color ?? COLORS.accent;
  }

  function goBack() {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Dashboard');
  }

  // ── RENDERS

  function renderTopBar() {
    // Removed LIVE/DONE badge — only show history button on SET phase
>>>>>>> main
    return (
      <View style={topBarStyles.container}>
        <Pressable
          style={topBarStyles.backBtn}
          onPress={goBack}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={18} color={COLORS.muted} />
        </Pressable>

        <View style={topBarStyles.titleBlock}>
          <Text style={topBarStyles.title}>{namaAlat}</Text>
          <Text style={topBarStyles.subtitle}>ID: {idAlat}</Text>
        </View>

        {phase === 'set' ? (
          <TouchableOpacity
            style={topBarStyles.historyBtn}
            onPress={() => setShowHistory(true)}
          >
            <MaterialCommunityIcons name="history" size={16} color={COLORS.muted} />
            <Text style={topBarStyles.historyBtnText}>Riwayat</Text>
          </TouchableOpacity>
        ) : (
<<<<<<< aplikasi3
          <View style={[topBarStyles.badge, isLive && { borderColor: color }]}>
            <View style={[topBarStyles.badgeDot, { backgroundColor: color }]} />
            <Text style={[topBarStyles.badgeText, { color }]}>{label}</Text>
          </View>
=======
          // Empty placeholder to keep layout balanced
          <View style={{ width: 70 }} />
>>>>>>> main
        )}
      </View>
    );
  }

  function renderSteps() {
    const currentIndex = PHASES.findIndex(p => p.key === phase);
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

  function renderSet() {
    const suhuTarget    = 121;
    const tekananTarget = 1.2;
    const suhuPct       = Math.min((monitorSuhu / suhuTarget) * 100, 100);
    const tekananPct    = Math.min((monitorTekanan / tekananTarget) * 100, 100);

    return (
      <ScrollView
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={setStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Error banner dari ignition gagal */}
        {ignitionError !== '' && (
          <View style={{
            backgroundColor: '#3a1010',
            borderColor: COLORS.danger,
            borderWidth: 1,
            borderRadius: 10,
            padding: 12,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color={COLORS.danger} />
            <Text style={{ color: COLORS.danger, fontSize: 13, flex: 1 }}>{ignitionError}</Text>
          </View>
        )}

        {/* Monitoring Realtime */}
        <View style={setStyles.monitorCard}>
          <Text style={setStyles.monitorTitle}>Monitoring Saat Ini</Text>
          <View style={setStyles.monitorRow}>
            <View style={setStyles.monitorItem}>
              <MaterialCommunityIcons name="thermometer" size={20} color={COLORS.fire} />
              <Text style={setStyles.monitorValue}>{monitorSuhu}°C</Text>
              <Text style={setStyles.monitorLabel}>Suhu</Text>
              <View style={setStyles.monitorTrack}>
                <View style={[setStyles.monitorFill, { width: `${suhuPct}%`, backgroundColor: COLORS.fire }]} />
              </View>
              <Text style={setStyles.monitorPct}>{suhuPct.toFixed(0)}% target</Text>
            </View>
            <View style={setStyles.monitorDivider} />
            <View style={setStyles.monitorItem}>
              <MaterialCommunityIcons name="gauge" size={20} color={COLORS.accent} />
              <Text style={setStyles.monitorValue}>{monitorTekanan} bar</Text>
              <Text style={setStyles.monitorLabel}>Tekanan</Text>
              <View style={setStyles.monitorTrack}>
                <View style={[setStyles.monitorFill, { width: `${tekananPct}%`, backgroundColor: COLORS.accent }]} />
              </View>
              <Text style={setStyles.monitorPct}>{tekananPct.toFixed(0)}% target</Text>
            </View>
          </View>
        </View>

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

        {/* Parameter — hanya Durasi Steril, full ketik, tanpa plus/minus */}
        <Text style={setStyles.sectionLabel}>Durasi Steril</Text>
        <View style={setStyles.paramCard}>
<<<<<<< aplikasi3

          {/* Durasi */}
=======
          {/* Baris: icon + label kiri, input kanan */}
>>>>>>> main
          <View style={setStyles.paramRow}>
            <View style={setStyles.paramLeft}>
              <MaterialCommunityIcons name="timer-outline" size={18} color={COLORS.accent} />
              <Text style={setStyles.paramName}>Jam</Text>
            </View>
<<<<<<< aplikasi3
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={setStyles.paramInputWrap}>
                {/* <TouchableOpacity
                  style={setStyles.paramStepBtn}
                  onPress={() => setInputJam(j => clampJam((parseInt(j) || 0) - 1).toString())}
                >
                  <MaterialCommunityIcons name="minus" size={14} color={COLORS.muted} />
                </TouchableOpacity> */}
                <TextInput
                  style={setStyles.paramInput}
                  value={inputJam}
                  onChangeText={v => setInputJam(clampJam(parseInt(v.replace(/[^0-9]/g, '')) || 0).toString())}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={setStyles.paramUnit}>j</Text>
                {/* <TouchableOpacity
                  style={setStyles.paramStepBtn}
                  onPress={() => setInputJam(j => clampJam((parseInt(j) || 0) + 1).toString())}
                >
                  <MaterialCommunityIcons name="plus" size={14} color={COLORS.muted} />
                </TouchableOpacity> */}
              </View>
              <Text style={{ color: COLORS.muted, fontSize: 16, fontWeight: 'bold' }}>:</Text>
              <View style={setStyles.paramInputWrap}>
                {/* <TouchableOpacity
                  style={setStyles.paramStepBtn}
                  onPress={() => setInputMenit(m => clampMenit((parseInt(m) || 0) - 1).toString())}
                >
                  <MaterialCommunityIcons name="minus" size={14} color={COLORS.muted} />
                </TouchableOpacity> */}
                <TextInput
                  style={setStyles.paramInput}
                  value={inputMenit}
                  onChangeText={v => setInputMenit(clampMenit(parseInt(v.replace(/[^0-9]/g, '')) || 0).toString())}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={setStyles.paramUnit}>m</Text>
                {/* <TouchableOpacity
                  style={setStyles.paramStepBtn}
                  onPress={() => setInputMenit(m => clampMenit((parseInt(m) || 0) + 1).toString())}
                >
                  <MaterialCommunityIcons name="plus" size={14} color={COLORS.muted} />
                </TouchableOpacity> */}
              </View>
=======
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TextInput
                style={setStyles.paramInputClean}
                value={inputJam}
                onChangeText={v => {
                  const num = parseInt(v.replace(/[^0-9]/g, ''), 10);
                  setInputJam(isNaN(num) ? '' : clampJam(num).toString());
                }}
                keyboardType="numeric"
                maxLength={2}
                placeholder="0"
                placeholderTextColor={COLORS.muted}
              />
              <Text style={setStyles.paramUnit}>jam</Text>
>>>>>>> main
            </View>
          </View>

          <View style={setStyles.paramDivider} />

          <View style={setStyles.paramRow}>
            <View style={setStyles.paramLeft}>
<<<<<<< aplikasi3
              <MaterialCommunityIcons name="thermometer-high" size={18} color={COLORS.fire} />
              <View>
                <Text style={setStyles.paramName}>Suhu Target</Text>
                <Text style={{ color: COLORS.muted, fontSize: 10, marginTop: 1 }}>100 – 150 °C</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {/* <TouchableOpacity
                style={setStyles.paramStepBtn}
                onPress={() => setInputSuhu(s => Math.max(100, (parseInt(s) || 121) - 1).toString())}
              >
                <MaterialCommunityIcons name="minus" size={14} color={COLORS.muted} />
              </TouchableOpacity> */}
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
                }}
                keyboardType="numeric"
                maxLength={3}
                placeholder="121"
                placeholderTextColor={COLORS.muted}
              />
              <Text style={setStyles.paramUnit}>°C</Text>
              {/* <TouchableOpacity
                style={setStyles.paramStepBtn}
                onPress={() => setInputSuhu(s => Math.min(150, (parseInt(s) || 121) + 1).toString())}
              >
                <MaterialCommunityIcons name="plus" size={14} color={COLORS.muted} />
              </TouchableOpacity> */}
            </View>
          </View>

          <View style={setStyles.paramDivider} />

          {/* Tekanan */}
          <View style={setStyles.paramRow}>
            <View style={setStyles.paramLeft}>
              <MaterialCommunityIcons name="gauge" size={18} color={COLORS.accent} />
              <View>
                <Text style={setStyles.paramName}>Tekanan Target</Text>
                <Text style={{ color: COLORS.muted, fontSize: 10, marginTop: 1 }}>0.5 – 3.0 bar</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {/* <TouchableOpacity
                style={setStyles.paramStepBtn}
                onPress={() =>
                  setInputTekanan(t =>
                    Math.max(0.5, parseFloat((parseFloat(t) - 0.1).toFixed(1))).toString()
                  )
                }
              >
                <MaterialCommunityIcons name="minus" size={14} color={COLORS.muted} />
              </TouchableOpacity> */}
              <TextInput
                style={[setStyles.paramInput, { minWidth: 44 }]}
                value={inputTekanan}
                onChangeText={v => {
                  const clean = v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                  if (clean === '' || clean === '.') { setInputTekanan(clean); return; }
                  const num = parseFloat(clean);
                  if (isNaN(num) || num > 3.0) return;
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
              <TouchableOpacity
                // style={setStyles.paramStepBtn}
                onPress={() =>
                  setInputTekanan(t =>
                    Math.min(3.0, parseFloat((parseFloat(t) + 0.1).toFixed(1))).toString()
                  )
                }
              >
                {/* <MaterialCommunityIcons name="plus" size={14} color={COLORS.muted} /> */}
              </TouchableOpacity>
=======
              <MaterialCommunityIcons name="timer-outline" size={18} color={COLORS.accent} />
              <Text style={setStyles.paramName}>Menit</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TextInput
                style={setStyles.paramInputClean}
                value={inputMenit}
                onChangeText={v => {
                  const num = parseInt(v.replace(/[^0-9]/g, ''), 10);
                  setInputMenit(isNaN(num) ? '' : clampMenit(num).toString());
                }}
                keyboardType="numeric"
                maxLength={2}
                placeholder="20"
                placeholderTextColor={COLORS.muted}
              />
              <Text style={setStyles.paramUnit}>menit</Text>
>>>>>>> main
            </View>
          </View>
        </View>

        <TouchableOpacity style={setStyles.startBtn} onPress={handleMulaiProses}>
          <MaterialCommunityIcons name="play" size={18} color={COLORS.bg} />
          <Text style={setStyles.startBtnText}>Mulai Proses</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function renderCountdown() {
    return (
      <Animated.View style={[countStyles.wrapper, { opacity: fadeIn }]}>
        <Text style={countStyles.label}>Memulai dalam</Text>
        <View style={countStyles.centerBox}>
          <Animated.View style={[countStyles.ringOuter, { transform: [{ scale: ringOuterScale }] }]} />
          <Animated.View style={[countStyles.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
          <Animated.Text
            style={[countStyles.number, { transform: [{ scale: numberScale }], opacity: numberOpacity }]}
          >
            {countValue > 0 ? countValue : ''}
          </Animated.Text>
          <Animated.Text
            style={[countStyles.mulai, { opacity: mulaiOpacity, transform: [{ scale: mulaiScale }], position: 'absolute' }]}
          >
            Mulai!
          </Animated.Text>
        </View>
      </Animated.View>
    );
  }

  function renderIgnition() {
    const barWidth = ignitionBar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
    return (
      <Animated.View style={[ignitionStyles.wrapper, { opacity: fadeIn }]}>
        <View>
          <Animated.View style={[ignitionStyles.flameRingOuter, { transform: [{ scale: ignitionFlame }] }]} />
          <Animated.View style={[ignitionStyles.flameRing, { transform: [{ scale: ignitionFlame }] }]}>
            <MaterialCommunityIcons name="fire" size={56} color={COLORS.fire} />
          </Animated.View>
        </View>
        <Text style={ignitionStyles.title}>Ignition</Text>
        <Text style={ignitionStyles.subtitle}>
          Menghubungkan ke perangkat... (Sesi {ignitionSession}/{MAX_IGNITION_SESSIONS})
        </Text>
        <View style={ignitionStyles.barTrack}>
          <Animated.View style={[ignitionStyles.barFill, { width: barWidth }]} />
        </View>
        <Text style={ignitionStyles.barLabel}>
          {ignitionSession > 1
            ? `Percobaan ${ignitionSession} dari ${MAX_IGNITION_SESSIONS}`
            : 'Menginisialisasi sistem'}
        </Text>
      </Animated.View>
    );
  }

  function renderRunning() {
    const remaining = elapsedSeconds;
    const progress  = Math.min(1 - remaining / sterilDetik, 1);
    const pct       = Math.round(progress * 100);

    return (
      <Animated.View style={[runningStyles.wrapper, { opacity: fadeIn }]}>
        <Animated.View style={[runningStyles.iconRing, { transform: [{ scale: pulseAnim }] }]}>
          <MaterialCommunityIcons name="atom" size={50} color={COLORS.green} />
        </Animated.View>
        <Text style={runningStyles.label}>Sterilisasi Berjalan</Text>
        <Text style={runningStyles.timer}>{formatTime(remaining)}</Text>
        <Text style={runningStyles.timerSub}>Sisa waktu</Text>
        <View style={runningStyles.statsRow}>
          <View style={runningStyles.statCard}>
            <MaterialCommunityIcons name="thermometer-high" size={20} color={COLORS.fire} />
            <Text style={runningStyles.statValue}>{inputSuhu}°C</Text>
            <Text style={runningStyles.statLabel}>Suhu</Text>
          </View>
          <View style={runningStyles.statCard}>
            <MaterialCommunityIcons name="gauge" size={20} color={COLORS.accent} />
            <Text style={runningStyles.statValue}>{inputTekanan} bar</Text>
            <Text style={runningStyles.statLabel}>Tekanan</Text>
          </View>
        </View>
        <View style={runningStyles.progressTrack}>
          <View style={[runningStyles.progressFill, { width: `${pct}%` }]} />
        </View>
<<<<<<< aplikasi3
        <Text style={runningStyles.progressPct}>{pct}%</Text>
        <Text style={runningStyles.progressLabel}>selesai</Text>
=======
        {/* Enlarged percentage display */}
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
>>>>>>> main
      </Animated.View>
    );
  }

  function renderFinish() {
    return (
      <Animated.View style={[finishStyles.wrapper, { opacity: fadeIn }]}>
        <Animated.View style={[finishStyles.checkRing, { transform: [{ scale: checkScale }] }]}>
          <MaterialCommunityIcons name="check-bold" size={56} color={COLORS.gold} />
        </Animated.View>
        <Text style={finishStyles.title}>Steril Selesai</Text>
        <Text style={finishStyles.subtitle}>
          Proses sterilisasi telah berhasil diselesaikan. Alat siap digunakan.
        </Text>
        <View style={finishStyles.summaryBox}>
<<<<<<< aplikasi3
          {[
            { key: 'Alat',         value: namaAlat },
            { key: 'Suhu',         value: `${inputSuhu}°C` },
            { key: 'Tekanan',      value: `${inputTekanan} bar` },
            { key: 'Durasi Total', value: formatTime(sterilDetik) },
            { key: 'Selesai Pukul',value: finishedAt },
            { key: 'Status',       value: '✓ Berhasil', color: COLORS.green },
          ].map((row, i, arr) => (
            <React.Fragment key={row.key}>
              <View style={finishStyles.summaryRow}>
                <Text style={finishStyles.summaryKey}>{row.key}</Text>
                <Text style={[finishStyles.summaryValue, row.color ? { color: row.color } : undefined]}>
                  {row.value}
                </Text>
              </View>
              {i < arr.length - 1 && <View style={finishStyles.divider} />}
            </React.Fragment>
          ))}
=======
          <View style={finishStyles.summaryRow}>
            <Text style={finishStyles.summaryKey}>Alat</Text>
            <Text style={finishStyles.summaryValue}>{namaAlat}</Text>
          </View>
          <View style={finishStyles.divider} />
          <View style={finishStyles.summaryRow}>
            <Text style={finishStyles.summaryKey}>Suhu</Text>
            <Text style={finishStyles.summaryValue}>{inputSuhu}°C</Text>
          </View>
          <View style={finishStyles.divider} />
          <View style={finishStyles.summaryRow}>
            <Text style={finishStyles.summaryKey}>Tekanan</Text>
            <Text style={finishStyles.summaryValue}>{inputTekanan} bar</Text>
          </View>
          <View style={finishStyles.divider} />
          <View style={finishStyles.summaryRow}>
            <Text style={finishStyles.summaryKey}>Durasi Total</Text>
            <Text style={finishStyles.summaryValue}>{formatTime(sterilDetik)}</Text>
          </View>
          <View style={finishStyles.divider} />
          <View style={finishStyles.summaryRow}>
            <Text style={finishStyles.summaryKey}>Selesai Pukul</Text>
            <Text style={finishStyles.summaryValue}>{finishedAt}</Text>
          </View>
          <View style={finishStyles.divider} />
          <View style={finishStyles.summaryRow}>
            <Text style={finishStyles.summaryKey}>Status</Text>
            <Text style={[finishStyles.summaryValue, { color: COLORS.green }]}>✓ Berhasil</Text>
          </View>
>>>>>>> main
        </View>

        <TouchableOpacity
          style={finishStyles.doneBtn}
          onPress={() => setPhase('set')}
        >
          <MaterialCommunityIcons name="refresh" size={18} color={COLORS.bg} />
          <Text style={finishStyles.doneBtnText}>Proses Baru</Text>
        </TouchableOpacity>

        <TouchableOpacity
<<<<<<< aplikasi3
          style={[finishStyles.doneBtn, {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: COLORS.border,
            marginTop: 10,
          }]}
          onPress={goBack}
        >
          <MaterialCommunityIcons name="home-outline" size={18} color={COLORS.muted} />
          <Text style={[finishStyles.doneBtnText, { color: COLORS.muted }]}>Kembali ke Dashboard</Text>
=======
          style={finishStyles.secondaryBtn}
          onPress={goBack}
        >
          <MaterialCommunityIcons name="home-outline" size={18} color={COLORS.muted} />
          <Text style={finishStyles.secondaryBtnText}>Kembali ke Dashboard</Text>
>>>>>>> main
        </TouchableOpacity>
      </Animated.View>
    );
  }

<<<<<<< aplikasi3
  // ─────────────────────────────────────────────────────
  // History Modal (list + detail/notes)
  // ─────────────────────────────────────────────────────
  function renderHistoryModal() {
    return (
      <>
        {/* LIST MODAL */}
        <Modal
          visible={showHistory}
          transparent
          animationType="slide"
          onRequestClose={() => setShowHistory(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'flex-end',
          }}>
            <View style={{
              backgroundColor: COLORS.bg,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: '80%',
              borderTopWidth: 1,
              borderColor: COLORS.border,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '700' }}>Riwayat Proses</Text>
                <TouchableOpacity onPress={() => setShowHistory(false)}>
                  <MaterialCommunityIcons name="close" size={22} color={COLORS.muted} />
                </TouchableOpacity>
              </View>

              {history.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 48, gap: 12 }}>
                  <MaterialCommunityIcons name="history" size={48} color={COLORS.dim} />
                  <Text style={{ color: COLORS.muted, fontSize: 14 }}>Belum ada riwayat proses</Text>
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {history.map(entry => {
                    const hasNotes = (entry.notes ?? '').trim().length > 0;
                    const color    = entry.status === 'Berhasil' ? COLORS.green : COLORS.danger;
                    return (
                      <TouchableOpacity
                        key={entry.id}
                        style={{
                          backgroundColor: COLORS.surface,
                          borderRadius: 12,
                          padding: 14,
                          marginBottom: 10,
                          borderWidth: 1,
                          borderColor: COLORS.border,
                        }}
                        onPress={() => openDetail(entry)}
                        activeOpacity={0.75}
                      >
                        {/* Header row */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: '600' }}>{entry.namaAlat}</Text>
                            <Text style={{ color: COLORS.muted, fontSize: 11, marginTop: 2 }}>{entry.idAlat}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            {hasNotes && (
                              <MaterialCommunityIcons name="note-text-outline" size={14} color={COLORS.gold} />
                            )}
                            <View style={{ borderWidth: 1, borderColor: color, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                              <Text style={{ color, fontSize: 11, fontWeight: '600' }}>{entry.status}</Text>
                            </View>
                          </View>
                        </View>

                        {/* Detail chips */}
                        <View style={{ flexDirection: 'row', gap: 14, marginBottom: hasNotes ? 8 : 0 }}>
                          {[
                            { icon: 'thermometer-high', text: `${entry.suhu}°C`,       color: COLORS.fire },
                            { icon: 'gauge',            text: `${entry.tekanan} bar`,  color: COLORS.accent },
                            { icon: 'timer-outline',    text: entry.durasi,            color: COLORS.muted },
                          ].map(d => (
                            <View key={d.icon} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <MaterialCommunityIcons name={d.icon as any} size={13} color={d.color} />
                              <Text style={{ color: COLORS.muted, fontSize: 12 }}>{d.text}</Text>
                            </View>
                          ))}
                        </View>

                        {/* Notes preview */}
                        {hasNotes && (
                          <View style={{
                            backgroundColor: '#1F1800',
                            borderWidth: 1,
                            borderColor: '#3A2E00',
                            borderRadius: 6,
                            paddingHorizontal: 8,
                            paddingVertical: 5,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                            marginBottom: 6,
                          }}>
                            <MaterialCommunityIcons name="note-text-outline" size={11} color={COLORS.gold} />
                            <Text style={{ color: COLORS.gold, fontSize: 11, flex: 1, opacity: 0.9 }} numberOfLines={1}>
                              {entry.notes}
                            </Text>
                          </View>
                        )}

                        {/* Date */}
                        <Text style={{ color: COLORS.dim, fontSize: 11, marginTop: hasNotes ? 0 : 4 }}>
                          {entry.tanggal} · {entry.selesaiPukul}
                        </Text>

                        {/* Quick-add notes bar */}
                        {!hasNotes && (
                          <TouchableOpacity
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 5,
                              marginTop: 10,
                              paddingTop: 8,
                              borderTopWidth: 1,
                              borderTopColor: COLORS.border,
                            }}
                            onPress={() => {
                              openDetail(entry);
                              setTimeout(() => setEditingNotes(true), 350);
                            }}
                          >
                            <MaterialCommunityIcons name="plus-circle-outline" size={13} color={COLORS.muted} />
                            <Text style={{ color: COLORS.muted, fontSize: 11, fontStyle: 'italic' }}>
                              Tambah catatan
                            </Text>
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* DETAIL + NOTES MODAL */}
        {selectedEntry && (
          <Modal
            visible={showDetail}
            transparent
            animationType="slide"
            onRequestClose={() => setShowDetail(false)}
          >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }}>
              <View style={{
                backgroundColor: COLORS.bg,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                maxHeight: '92%',
                borderTopWidth: 1,
                borderColor: COLORS.border,
              }}>
                {/* Drag handle */}
                <View style={{
                  width: 36, height: 4, borderRadius: 2,
                  backgroundColor: COLORS.muted,
                  alignSelf: 'center', marginTop: 12, marginBottom: 4, opacity: 0.4,
                }} />

                <ScrollView
                  contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Status header */}
                  <View style={{ alignItems: 'center', marginBottom: 20, gap: 6 }}>
                    <View style={{
                      width: 64, height: 64, borderRadius: 32,
                      borderWidth: 2,
                      borderColor: selectedEntry.status === 'Berhasil' ? COLORS.green : COLORS.danger,
                      backgroundColor: selectedEntry.status === 'Berhasil' ? COLORS.greenDim : '#2A1010',
                      alignItems: 'center', justifyContent: 'center', marginBottom: 4,
                    }}>
                      <MaterialCommunityIcons
                        name={selectedEntry.status === 'Berhasil' ? 'check-bold' : 'stop'}
                        size={28}
                        color={selectedEntry.status === 'Berhasil' ? COLORS.green : COLORS.danger}
                      />
                    </View>
                    <Text style={{
                      color: selectedEntry.status === 'Berhasil' ? COLORS.green : COLORS.danger,
                      fontSize: 18, fontWeight: '900', letterSpacing: 1,
                    }}>
                      {selectedEntry.status === 'Berhasil' ? 'Steril Selesai' : 'Proses Dihentikan'}
                    </Text>
                    <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                      {selectedEntry.namaAlat} · {selectedEntry.idAlat}
                    </Text>
                  </View>

                  {/* Detail info */}
                  <View style={{
                    backgroundColor: COLORS.surface, borderRadius: 16,
                    padding: 16, marginBottom: 14,
                    borderWidth: 1, borderColor: COLORS.border,
                  }}>
                    <Text style={{ color: COLORS.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>
                      Detail Proses
                    </Text>
                    {[
                      { icon: 'tag-outline',        label: 'Nama Alat',     value: selectedEntry.namaAlat },
                      { icon: 'identifier',          label: 'ID Alat',       value: selectedEntry.idAlat },
                      { icon: 'thermometer-high',    label: 'Suhu',          value: `${selectedEntry.suhu}°C`,       iconColor: COLORS.fire },
                      { icon: 'gauge',               label: 'Tekanan',       value: `${selectedEntry.tekanan} bar`,  iconColor: COLORS.accent },
                      { icon: 'timer-outline',       label: 'Durasi',        value: selectedEntry.durasi },
                      { icon: 'calendar-outline',    label: 'Tanggal',       value: selectedEntry.tanggal },
                      { icon: 'clock-outline',       label: 'Selesai Pukul', value: selectedEntry.selesaiPukul },
                      { icon: 'shield-check-outline',label: 'Status',        value: selectedEntry.status,
                        valueColor: selectedEntry.status === 'Berhasil' ? COLORS.green : COLORS.danger },
                    ].map((row, i, arr) => (
                      <React.Fragment key={row.label}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <MaterialCommunityIcons name={row.icon as any} size={14} color={row.iconColor ?? COLORS.muted} />
                            <Text style={{ color: COLORS.muted, fontSize: 13 }}>{row.label}</Text>
                          </View>
                          <Text style={{ color: row.valueColor ?? COLORS.white, fontSize: 13, fontWeight: '700' }}>
                            {row.value}
                          </Text>
                        </View>
                        {i < arr.length - 1 && <View style={{ height: 1, backgroundColor: COLORS.border }} />}
                      </React.Fragment>
                    ))}
                  </View>

                  {/* Notes card */}
                  <View style={{
                    backgroundColor: COLORS.surface, borderRadius: 16,
                    padding: 16, marginBottom: 16,
                    borderWidth: 1, borderColor: COLORS.border,
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <MaterialCommunityIcons name="note-text-outline" size={15} color={COLORS.gold} />
                        <Text style={{ color: COLORS.white, fontSize: 13, fontWeight: '700' }}>Catatan</Text>
                      </View>
                      {!editingNotes && (
                        <TouchableOpacity
                          style={{
                            flexDirection: 'row', alignItems: 'center', gap: 4,
                            paddingHorizontal: 10, paddingVertical: 5,
                            borderRadius: 8, backgroundColor: '#141E2E',
                            borderWidth: 1, borderColor: COLORS.border,
                          }}
                          onPress={() => setEditingNotes(true)}
                        >
                          <MaterialCommunityIcons name="pencil-outline" size={12} color={COLORS.muted} />
                          <Text style={{ color: COLORS.muted, fontSize: 11, fontWeight: '600' }}>
                            {(selectedEntry.notes ?? '').trim().length > 0 ? 'Edit' : 'Tambah'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {editingNotes ? (
                      <>
                        <TextInput
                          style={{
                            color: COLORS.white,
                            fontSize: 14,
                            lineHeight: 22,
                            minHeight: 120,
                            textAlignVertical: 'top',
                            backgroundColor: '#141E2E',
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: COLORS.accent,
                            padding: 12,
                            marginBottom: 10,
                          }}
                          value={notesText}
                          onChangeText={setNotesText}
                          placeholder="Tulis catatan, observasi, atau hasil pengamatan..."
                          placeholderTextColor={COLORS.muted}
                          multiline
                          autoFocus
                          selectionColor={COLORS.accent}
                        />
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity
                            style={{
                              flex: 1, paddingVertical: 12, borderRadius: 10,
                              borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
                            }}
                            onPress={() => {
                              setEditingNotes(false);
                              setNotesText(selectedEntry.notes ?? '');
                            }}
                          >
                            <Text style={{ color: COLORS.muted, fontSize: 13, fontWeight: '700' }}>Batal</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={{
                              flex: 2, paddingVertical: 12, borderRadius: 10,
                              backgroundColor: COLORS.accent, alignItems: 'center',
                            }}
                            onPress={saveNotes}
                          >
                            <Text style={{ color: COLORS.bg, fontSize: 13, fontWeight: '800' }}>Simpan Catatan</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    ) : (selectedEntry.notes ?? '').trim().length > 0 ? (
                      <Text style={{
                        color: COLORS.white, fontSize: 14, lineHeight: 22,
                        backgroundColor: '#141E2E', borderRadius: 10,
                        padding: 12, borderWidth: 1, borderColor: COLORS.border,
                      }}>
                        {selectedEntry.notes}
                      </Text>
                    ) : (
                      <TouchableOpacity
                        style={{
                          borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
                          borderStyle: 'dashed', padding: 16, alignItems: 'center', gap: 6,
                        }}
                        onPress={() => setEditingNotes(true)}
                      >
                        <MaterialCommunityIcons name="plus-circle-outline" size={22} color={COLORS.muted} />
                        <Text style={{ color: COLORS.muted, fontSize: 13 }}>Ketuk untuk menambah catatan</Text>
                        <Text style={{ color: COLORS.dim, fontSize: 11, textAlign: 'center' }}>
                          Catat observasi, hasil pengamatan, atau catatan lainnya
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Close */}
                  <TouchableOpacity
                    style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
                    onPress={() => setShowDetail(false)}
                  >
                    <Text style={{ color: COLORS.muted, fontSize: 14, fontWeight: '700' }}>Tutup</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
      </>
    );
  }

  // ─────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────
=======
  // ── HISTORY MODAL
  function renderHistoryModal() {
    return (
      <Modal
        visible={showHistory}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={historyStyles.overlay}>
          <View style={historyStyles.sheet}>
            <View style={historyStyles.header}>
              <Text style={historyStyles.headerTitle}>Riwayat Proses</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <MaterialCommunityIcons name="close" size={22} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            {history.length === 0 ? (
              <View style={historyStyles.empty}>
                <MaterialCommunityIcons name="history" size={48} color={COLORS.dim} />
                <Text style={historyStyles.emptyText}>Belum ada riwayat proses</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {history.map((entry) => (
                  <View key={entry.id} style={historyStyles.card}>
                    <View style={historyStyles.cardHeader}>
                      <View style={historyStyles.cardLeft}>
                        <Text style={historyStyles.cardAlat}>{entry.namaAlat}</Text>
                        <Text style={historyStyles.cardId}>{entry.idAlat}</Text>
                      </View>
                      <View style={[
                        historyStyles.statusBadge,
                        { borderColor: entry.status === 'Berhasil' ? COLORS.green : COLORS.danger }
                      ]}>
                        <Text style={[
                          historyStyles.statusText,
                          { color: entry.status === 'Berhasil' ? COLORS.green : COLORS.danger }
                        ]}>
                          {entry.status}
                        </Text>
                      </View>
                    </View>
                    <View style={historyStyles.cardDetails}>
                      <View style={historyStyles.detailItem}>
                        <MaterialCommunityIcons name="thermometer-high" size={14} color={COLORS.fire} />
                        <Text style={historyStyles.detailText}>{entry.suhu}°C</Text>
                      </View>
                      <View style={historyStyles.detailItem}>
                        <MaterialCommunityIcons name="gauge" size={14} color={COLORS.accent} />
                        <Text style={historyStyles.detailText}>{entry.tekanan} bar</Text>
                      </View>
                      <View style={historyStyles.detailItem}>
                        <MaterialCommunityIcons name="timer-outline" size={14} color={COLORS.muted} />
                        <Text style={historyStyles.detailText}>{entry.durasi}</Text>
                      </View>
                    </View>
                    <Text style={historyStyles.cardDate}>
                      {entry.tanggal} · {entry.selesaiPukul}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  // ── MAIN RENDER
>>>>>>> main
  return (
    <SafeAreaView style={sharedStyles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      {renderTopBar()}
      {renderSteps()}
      <View style={[
        sharedStyles.flex1,
        phase === 'set'
          ? { width: '100%', paddingHorizontal: 20 }
          : sharedStyles.center,
      ]}>
        {phase === 'set'       && renderSet()}
        {phase === 'countdown' && renderCountdown()}
        {phase === 'ignition'  && renderIgnition()}
        {phase === 'running'   && renderRunning()}
        {phase === 'finish'    && renderFinish()}
      </View>

      {phase === 'running' && (
        <View style={bottomStyles.container}>
          <TouchableOpacity style={bottomStyles.stopBtn} onPress={handleStop}>
            <MaterialCommunityIcons name="stop-circle-outline" size={20} color={COLORS.danger} />
            <Text style={bottomStyles.stopBtnText}>Hentikan Proses</Text>
          </TouchableOpacity>
        </View>
      )}

      {renderHistoryModal()}
    </SafeAreaView>
  );
}