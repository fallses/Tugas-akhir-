import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Animated,
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

const IGNITION_MS   = 3000;
const STERIL_DETIK  = 20;

export default function ProcessScreen({ route, navigation }: Props) {
  const { namaAlat, idAlat } = route.params;

  const [phase, setPhase]                   = useState<Phase>('set');
  const [countValue, setCountValue]         = useState(3);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finishedAt, setFinishedAt]         = useState('');

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
        if (next >= STERIL_DETIK) {
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
  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function phaseColor() {
    return PHASES.find(p => p.key === phase)?.color ?? COLORS.accent;
  }

  function goBack() {
    navigation.goBack();
  }

  // ── RENDERS

  function renderTopBar() {
    const color  = phaseColor();
    const isLive = phase === 'running' || phase === 'ignition';
    const label  = isLive ? 'LIVE' : phase === 'finish' ? 'DONE' : 'READY';
    return (
      <View style={topBarStyles.container}>
        <TouchableOpacity style={topBarStyles.backBtn} onPress={goBack}>
          <MaterialCommunityIcons name="arrow-left" size={18} color={COLORS.muted} />
        </TouchableOpacity>
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
    return (
      <Animated.View style={[setStyles.wrapper, { opacity: fadeIn }]}>
        <View style={setStyles.iconBox}>
          <MaterialCommunityIcons name="flask-outline" size={48} color={COLORS.accent} />
        </View>
        <Text style={setStyles.title}>Set Steril</Text>
        <Text style={setStyles.subtitle}>
          Pastikan alat sudah terpasang dengan benar dan siap untuk proses sterilisasi.
        </Text>
        <View style={setStyles.infoRow}>
          <View style={setStyles.infoPill}>
            <Text style={setStyles.infoPillLabel}>Alat</Text>
            <Text style={setStyles.infoPillValue}>{namaAlat}</Text>
          </View>
          <View style={setStyles.infoPill}>
            <Text style={setStyles.infoPillLabel}>ID</Text>
            <Text style={setStyles.infoPillValue}>{idAlat}</Text>
          </View>
        </View>
        <TouchableOpacity style={setStyles.startBtn} onPress={() => setPhase('countdown')}>
          <MaterialCommunityIcons name="play" size={18} color={COLORS.bg} />
          <Text style={setStyles.startBtnText}>Mulai Proses</Text>
        </TouchableOpacity>
      </Animated.View>
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
    const progress = Math.min(elapsedSeconds / STERIL_DETIK, 1);
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
            <Text style={runningStyles.statValue}>121°C</Text>
            <Text style={runningStyles.statLabel}>Suhu</Text>
          </View>
          <View style={runningStyles.statCard}>
            <MaterialCommunityIcons name="gauge" size={20} color={COLORS.accent} />
            <Text style={runningStyles.statValue}>1.2 atm</Text>
            <Text style={runningStyles.statLabel}>Tekanan</Text>
          </View>
          <View style={runningStyles.statCard}>
            <MaterialCommunityIcons name="water-percent" size={20} color={COLORS.green} />
            <Text style={runningStyles.statValue}>98%</Text>
            <Text style={runningStyles.statLabel}>Uap</Text>
          </View>
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
      <View style={[sharedStyles.flex1, sharedStyles.center]}>
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