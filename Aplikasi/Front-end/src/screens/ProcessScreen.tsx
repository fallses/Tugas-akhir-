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
} from '../styles/ProcessScreen.styles';

type Phase = 'set' | 'countdown' | 'ignition' | 'running' | 'finish';

interface Props {
  route: {
    params: {
      namaAlat: string;
      idAlat: string;
    };
  };
  navigation: any;
}

const PHASES: { key: Phase; label: string; color: string }[] = [
  { key: 'set',       label: 'SET',     color: COLORS.accent },
  { key: 'countdown', label: 'HITUNG',  color: COLORS.accent },
  { key: 'ignition',  label: 'NYALA',   color: COLORS.fire   },
  { key: 'running',   label: 'STERIL',  color: COLORS.green  },
  { key: 'finish',    label: 'SELESAI', color: COLORS.gold   },
];

const IGNITION_MS = 3000;

// Preset konfigurasi sterilisasi (jam, menit, suhu, tekanan)
const PRESETS = [
  { label: 'Cepat',    jam: 0, menit: 15, suhu: 121, tekanan: 1.0 },
  { label: 'Standar',  jam: 0, menit: 20, suhu: 121, tekanan: 1.2 },
  { label: 'Intensif', jam: 0, menit: 30, suhu: 134, tekanan: 2.0 },
];

export default function ProcessScreen({ route, navigation }: Props) {
  const { namaAlat, idAlat } = route.params;

  const [phase, setPhase]                   = useState<Phase>('set');
  const [countValue, setCountValue]         = useState(3);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finishedAt, setFinishedAt]         = useState('');

  // Setting state
  const [selectedPreset, setSelectedPreset] = useState(1); // default Standar

  // ── Durasi: jam + menit
  const [inputJam, setInputJam]     = useState('0');
  const [inputMenit, setInputMenit] = useState('20');

  const [inputSuhu, setInputSuhu]         = useState('121');
  const [inputTekanan, setInputTekanan]   = useState('1.2');
  const [sterilDetik, setSterilDetik]     = useState(20 * 60);

  // Simulasi monitoring suhu & tekanan (bergerak naik perlahan)
  const [monitorSuhu, setMonitorSuhu]       = useState(28);
  const [monitorTekanan, setMonitorTekanan] = useState(1.0);

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

  // Simulasi monitoring di fase set
  useEffect(() => {
    if (phase !== 'set') return;
    const interval = setInterval(() => {
      setMonitorSuhu(prev => {
        const delta = (Math.random() - 0.5) * 0.4;
        return parseFloat(Math.max(26, Math.min(32, prev + delta)).toFixed(1));
      });
      setMonitorTekanan(prev => {
        const delta = (Math.random() - 0.5) * 0.02;
        return parseFloat(Math.max(0.95, Math.min(1.05, prev + delta)).toFixed(2));
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [phase]);

  // ── Helper: total durasi dalam detik
  function totalDetik(jam: string, menit: string): number {
    const j = parseInt(jam, 10)   || 0;
    const m = parseInt(menit, 10) || 0;
    const total = j * 3600 + m * 60;
    return total > 0 ? total : 60; // minimal 1 menit
  }

  // ── Clamp helpers
  function clampJam(val: number)   { return Math.max(0, Math.min(23, val)); }
  function clampMenit(val: number) { return Math.max(0, Math.min(59, val)); }

  function applyPreset(index: number) {
    setSelectedPreset(index);
    const p = PRESETS[index];
    setInputJam(p.jam.toString());
    setInputMenit(p.menit.toString());
    setInputSuhu(p.suhu.toString());
    setInputTekanan(p.tekanan.toString());
  }

  function handleMulaiProses() {
    const suhu    = parseFloat(inputSuhu)    || 121;
    const tekanan = parseFloat(inputTekanan) || 1.2;
    setSterilDetik(totalDetik(inputJam, inputMenit));
    setInputSuhu(suhu.toString());
    setInputTekanan(tekanan.toString());
    setPhase('countdown');
  }

  // ── COUNTDOWN
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

  // ── IGNITION
  useEffect(() => {
    if (phase !== 'ignition') return;
    enterFade();
    ignitionBar.setValue(0);

    Animated.timing(ignitionBar, {
      toValue: 1,
      duration: IGNITION_MS,
      useNativeDriver: false,
    }).start();

    const flicker = Animated.loop(
      Animated.sequence([
        Animated.timing(ignitionFlame, { toValue: 1.2,  duration: 200, useNativeDriver: true }),
        Animated.timing(ignitionFlame, { toValue: 0.85, duration: 200, useNativeDriver: true }),
      ])
    );
    flicker.start();

    const timer = setTimeout(() => {
      flicker.stop();
      setPhase('running');
    }, IGNITION_MS);

    return () => { clearTimeout(timer); flicker.stop(); };
  }, [phase]);

  // ── RUNNING
  useEffect(() => {
    if (phase !== 'running') return;
    enterFade();
    setElapsedSeconds(0);

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();

    const tick = setInterval(() => {
      setElapsedSeconds(s => {
        const next = s + 1;
        if (next >= sterilDetik) {
          clearInterval(tick);
          pulse.stop();
          const now = new Date();
          setFinishedAt(
            now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          );
          setPhase('finish');
        }
        return next;
      });
    }, 1000);

    return () => { clearInterval(tick); pulse.stop(); };
  }, [phase]);

  // ── FINISH
  useEffect(() => {
    if (phase !== 'finish') return;
    enterFade();
    checkScale.setValue(0);
    Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, tension: 50, friction: 5 }).start();
  }, [phase]);

  // ── HELPERS
  /** Format detik → HH:MM:SS (jika ≥ 1 jam) atau MM:SS */
  function formatTime(secs: number) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const mm = m.toString().padStart(2, '0');
    const ss = s.toString().padStart(2, '0');
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${mm}:${ss}`;
    }
    return `${mm}:${ss}`;
  }

  /** Format durasi singkat untuk label, misal "1j 30m" atau "20m" */
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
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Dashboard');
    }
  }

  // ── RENDERS

  function renderTopBar() {
    const color  = phaseColor();
    const isLive = phase === 'running' || phase === 'ignition';
    const label  = isLive ? 'LIVE' : phase === 'finish' ? 'DONE' : 'READY';
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
        <View style={[topBarStyles.badge, isLive && { borderColor: color }]}>
          <View style={[topBarStyles.badgeDot, { backgroundColor: color }]} />
          <Text style={[topBarStyles.badgeText, { color }]}>{label}</Text>
        </View>
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
    const suhuTarget    = parseFloat(inputSuhu)    || 121;
    const tekananTarget = parseFloat(inputTekanan) || 1.2;
    const suhuPct       = Math.min((monitorSuhu / suhuTarget) * 100, 100);
    const tekananPct    = Math.min((monitorTekanan / tekananTarget) * 100, 100);

    return (
      <ScrollView
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={setStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Monitoring Realtime */}
        <View style={setStyles.monitorCard}>
          <Text style={setStyles.monitorTitle}>Monitoring Saat Ini</Text>
          <View style={setStyles.monitorRow}>

            {/* Suhu */}
            <View style={setStyles.monitorItem}>
              <MaterialCommunityIcons name="thermometer" size={20} color={COLORS.fire} />
              <Text style={setStyles.monitorValue}>{monitorSuhu}°C</Text>
              <Text style={setStyles.monitorLabel}>Suhu</Text>
              <View style={setStyles.monitorTrack}>
                <View style={[setStyles.monitorFill, {
                  width: `${suhuPct}%`,
                  backgroundColor: COLORS.fire,
                }]} />
              </View>
              <Text style={setStyles.monitorPct}>{suhuPct.toFixed(0)}% target</Text>
            </View>

            <View style={setStyles.monitorDivider} />

            {/* Tekanan */}
            <View style={setStyles.monitorItem}>
              <MaterialCommunityIcons name="gauge" size={20} color={COLORS.accent} />
              <Text style={setStyles.monitorValue}>{monitorTekanan} bar</Text>
              <Text style={setStyles.monitorLabel}>Tekanan</Text>
              <View style={setStyles.monitorTrack}>
                <View style={[setStyles.monitorFill, {
                  width: `${tekananPct}%`,
                  backgroundColor: COLORS.accent,
                }]} />
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
                {formatDurasiLabel(p.jam.toString(), p.menit.toString())} · {p.suhu}°C
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Parameter Manual */}
        <Text style={setStyles.sectionLabel}>Parameter</Text>
        <View style={setStyles.paramCard}>

          {/* ── Durasi: JAM + MENIT ── */}
          <View style={setStyles.paramRow}>
            <View style={setStyles.paramLeft}>
              <MaterialCommunityIcons name="timer-outline" size={18} color={COLORS.accent} />
              <Text style={setStyles.paramName}>Durasi Steril</Text>
            </View>

            {/* Kontrol Jam */}
            <View style={setStyles.paramInputWrap}>
              <TouchableOpacity
                style={setStyles.paramStepBtn}
                onPress={() => setInputJam(j => clampJam((parseInt(j) || 0) - 1).toString())}
              >
                <MaterialCommunityIcons name="minus" size={14} color={COLORS.muted} />
              </TouchableOpacity>
              <TextInput
                style={setStyles.paramInput}
                value={inputJam}
                onChangeText={v => setInputJam(clampJam(parseInt(v) || 0).toString())}
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={setStyles.paramUnit}>jam</Text>
              <TouchableOpacity
                style={setStyles.paramStepBtn}
                onPress={() => setInputJam(j => clampJam((parseInt(j) || 0) + 1).toString())}
              >
                <MaterialCommunityIcons name="plus" size={14} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            {/* Separator titik dua */}
            <Text style={{ color: COLORS.muted, marginHorizontal: 4, fontSize: 16, fontWeight: 'bold' }}>:</Text>

            {/* Kontrol Menit */}
            <View style={setStyles.paramInputWrap}>
              <TouchableOpacity
                style={setStyles.paramStepBtn}
                onPress={() => setInputMenit(m => clampMenit((parseInt(m) || 0) - 1).toString())}
              >
                <MaterialCommunityIcons name="minus" size={14} color={COLORS.muted} />
              </TouchableOpacity>
              <TextInput
                style={setStyles.paramInput}
                value={inputMenit}
                onChangeText={v => setInputMenit(clampMenit(parseInt(v) || 0).toString())}
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={setStyles.paramUnit}>menit</Text>
              <TouchableOpacity
                style={setStyles.paramStepBtn}
                onPress={() => setInputMenit(m => clampMenit((parseInt(m) || 0) + 1).toString())}
              >
                <MaterialCommunityIcons name="plus" size={14} color={COLORS.muted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={setStyles.paramDivider} />

          {/* Suhu */}
          <View style={setStyles.paramRow}>
            <View style={setStyles.paramLeft}>
              <MaterialCommunityIcons name="thermometer-high" size={18} color={COLORS.fire} />
              <Text style={setStyles.paramName}>Suhu Target</Text>
            </View>
            <View style={setStyles.paramInputWrap}>
              <TouchableOpacity
                style={setStyles.paramStepBtn}
                onPress={() => setInputSuhu(s => Math.max(100, (parseInt(s) || 100) - 1).toString())}
              >
                <MaterialCommunityIcons name="minus" size={14} color={COLORS.muted} />
              </TouchableOpacity>
              <TextInput
                style={setStyles.paramInput}
                value={inputSuhu}
                onChangeText={setInputSuhu}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={setStyles.paramUnit}>°C</Text>
              <TouchableOpacity
                style={setStyles.paramStepBtn}
                onPress={() => setInputSuhu(s => Math.min(150, (parseInt(s) || 100) + 1).toString())}
              >
                <MaterialCommunityIcons name="plus" size={14} color={COLORS.muted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={setStyles.paramDivider} />

          {/* Tekanan */}
          <View style={setStyles.paramRow}>
            <View style={setStyles.paramLeft}>
              <MaterialCommunityIcons name="gauge" size={18} color={COLORS.accent} />
              <Text style={setStyles.paramName}>Tekanan Target</Text>
            </View>
            <View style={setStyles.paramInputWrap}>
              <TouchableOpacity
                style={setStyles.paramStepBtn}
                onPress={() => setInputTekanan(t => Math.max(0.5, parseFloat((parseFloat(t) - 0.1).toFixed(1))).toString())}
              >
                <MaterialCommunityIcons name="minus" size={14} color={COLORS.muted} />
              </TouchableOpacity>
              <TextInput
                style={setStyles.paramInput}
                value={inputTekanan}
                onChangeText={setInputTekanan}
                keyboardType="decimal-pad"
                maxLength={4}
              />
              <Text style={setStyles.paramUnit}>bar</Text>
              <TouchableOpacity
                style={setStyles.paramStepBtn}
                onPress={() => setInputTekanan(t => Math.min(3.0, parseFloat((parseFloat(t) + 0.1).toFixed(1))).toString())}
              >
                <MaterialCommunityIcons name="plus" size={14} color={COLORS.muted} />
              </TouchableOpacity>
            </View>
          </View>

        </View>

        {/* Tombol Mulai */}
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
          <Animated.Text style={[countStyles.number, { transform: [{ scale: numberScale }], opacity: numberOpacity }]}>
            {countValue > 0 ? countValue : ''}
          </Animated.Text>
          <Animated.Text style={[countStyles.mulai, { opacity: mulaiOpacity, transform: [{ scale: mulaiScale }], position: 'absolute' }]}>
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
        <Text style={ignitionStyles.subtitle}>Menyalakan pemanas...</Text>
        <View style={ignitionStyles.barTrack}>
          <Animated.View style={[ignitionStyles.barFill, { width: barWidth }]} />
        </View>
        <Text style={ignitionStyles.barLabel}>Menginisialisasi sistem</Text>
      </Animated.View>
    );
  }

  function renderRunning() {
    const progress = Math.min(elapsedSeconds / sterilDetik, 1);
    return (
      <Animated.View style={[runningStyles.wrapper, { opacity: fadeIn }]}>
        <Animated.View style={[runningStyles.iconRing, { transform: [{ scale: pulseAnim }] }]}>
          <MaterialCommunityIcons name="atom" size={50} color={COLORS.green} />
        </Animated.View>
        <Text style={runningStyles.label}>Sterilisasi Berjalan</Text>
        <Text style={runningStyles.timer}>{formatTime(elapsedSeconds)}</Text>
        <Text style={runningStyles.timerSub}>Durasi aktif</Text>
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
          {/* <View style={runningStyles.statCard}> */}
            {/* <MaterialCommunityIcons name="water-percent" size={20} color={COLORS.green} /> */}
            {/* <Text style={runningStyles.statValue}>98%</Text> */}
            {/* <Text style={runningStyles.statLabel}>Uap</Text> */}
          {/* </View> */}
        </View>
        <View style={runningStyles.progressTrack}>
          <View style={[runningStyles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Text style={runningStyles.progressLabel}>{Math.round(progress * 100)}% selesai</Text>
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
            <Text style={finishStyles.summaryValue}>{formatTime(elapsedSeconds)}</Text>
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
        </View>
        <TouchableOpacity style={finishStyles.doneBtn} onPress={goBack}>
          <MaterialCommunityIcons name="home-outline" size={18} color={COLORS.bg} />
          <Text style={finishStyles.doneBtnText}>Kembali ke Dashboard</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // ── MAIN RENDER
  return (
    <SafeAreaView style={sharedStyles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      {renderTopBar()}
      {renderSteps()}
      <View style={[sharedStyles.flex1, phase === 'set' ? { width: '100%', paddingHorizontal: 20 } : sharedStyles.center]}>
        {phase === 'set'       && renderSet()}
        {phase === 'countdown' && renderCountdown()}
        {phase === 'ignition'  && renderIgnition()}
        {phase === 'running'   && renderRunning()}
        {phase === 'finish'    && renderFinish()}
      </View>
      {phase === 'running' && (
        <View style={bottomStyles.container}>
          <TouchableOpacity style={bottomStyles.stopBtn} onPress={goBack}>
            <MaterialCommunityIcons name="stop-circle-outline" size={20} color={COLORS.danger} />
            <Text style={bottomStyles.stopBtnText}>Hentikan Proses</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}