import { StyleSheet } from 'react-native';

export const COLORS = {
  bg:         '#080C10',
  surface:    '#0F1520',
  border:     '#1E2D42',
  dim:        '#1E2D42',
  accent:     '#00D4FF',
  accentDim:  '#003A4D',
  fire:       '#FF6B1A',
  fireDim:    '#2A1500',
  green:      '#00E587',
  greenDim:   '#003D1E',
  gold:       '#FFD166',
  goldDim:    '#2A1F00',
  white:      '#F0F4FF',
  muted:      '#4A5E78',
  danger:     '#FF4455',
  text:       '#F0F4FF',
};

const shared = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flex1: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─────────────────────────────────────────────────────────
// Top bar
// ─────────────────────────────────────────────────────────
export const topBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    alignItems: 'center',
  },
  title: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  historyBtnText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

// ─────────────────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────────────────
export const stepStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  stepItem: {
    alignItems: 'center',
    width: 52,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepLine: {
    flex: 1,
    height: 1,
  },
  stepLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 4,
    textAlign: 'center',
  },
});

// ─────────────────────────────────────────────────────────
// SET phase
// ─────────────────────────────────────────────────────────
export const setStyles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 32,
    paddingTop: 4,
  },

  // Monitor card
  monitorCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monitorTitle: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  monitorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monitorItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  monitorValue: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  monitorLabel: {
    color: COLORS.muted,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  monitorTrack: {
    width: '80%',
    height: 4,
    backgroundColor: COLORS.dim,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  monitorFill: {
    height: 4,
    borderRadius: 2,
  },
  monitorPct: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 3,
    letterSpacing: 0.3,
  },
  monitorDivider: {
    width: 1,
    height: 64,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },

  // Section label
  sectionLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },

  // Preset row
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    gap: 3,
  },
  presetBtnActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentDim,
  },
  presetLabel: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  presetLabelActive: {
    color: COLORS.accent,
  },
  presetDetail: {
    color: COLORS.dim,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  presetDetailActive: {
    color: COLORS.accent,
    opacity: 0.6,
  },

  // Parameter card
  paramCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  paramLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paramName: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  paramInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // paramStepBtn dihapus — tidak ada lagi tombol plus/minus
  paramInput: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
    minWidth: 36,
    textAlign: 'center',
    padding: 0,
  },
  // ── Input ketik langsung — bersih, rata kanan, besar
  paramInputClean: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'right',
    minWidth: 52,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  paramUnit: {
    color: COLORS.muted,
    fontSize: 13,
    letterSpacing: 0.3,
    minWidth: 36,
  },
  paramDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },

  // Start button
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
  },
  startBtnText: {
    color: COLORS.bg,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Legacy styles kept for compatibility
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconBox: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 36,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  infoPill: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
  },
  infoPillLabel: {
    color: COLORS.muted,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  infoPillValue: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
});

// ─────────────────────────────────────────────────────────
// Countdown phase
// ─────────────────────────────────────────────────────────
export const countStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: COLORS.muted,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 32,
  },
  centerBox: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 2.5,
    borderColor: COLORS.accent,
  },
  ringOuter: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: COLORS.accentDim,
  },
  number: {
    fontSize: 130,
    fontWeight: '900',
    color: COLORS.white,
    lineHeight: 140,
  },
  mulai: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.accent,
    letterSpacing: 2,
  },
});

// ─────────────────────────────────────────────────────────
// Ignition phase
// ─────────────────────────────────────────────────────────
export const ignitionStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2.5,
    borderColor: COLORS.fire,
    backgroundColor: COLORS.fireDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  flameRingOuter: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: COLORS.fire,
    opacity: 0.3,
    top: -15,
    left: -15,
  },
  title: {
    color: COLORS.fire,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 13,
    letterSpacing: 0.5,
    marginBottom: 32,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  barTrack: {
    width: 220,
    height: 4,
    backgroundColor: COLORS.dim,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  barFill: {
    height: 4,
    backgroundColor: COLORS.fire,
    borderRadius: 2,
  },
  barLabel: {
    color: COLORS.muted,
    fontSize: 11,
    letterSpacing: 1,
    textAlign: 'center',
  },
});

// ─────────────────────────────────────────────────────────
// Running phase
// ─────────────────────────────────────────────────────────
export const runningStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: COLORS.green,
    backgroundColor: COLORS.greenDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  label: {
    color: COLORS.muted,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  timer: {
    color: COLORS.white,
    fontSize: 68,
    fontWeight: '900',
    letterSpacing: 5,
  },
  timerSub: {
    color: COLORS.muted,
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 2,
    marginBottom: 28,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.dim,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 0,
  },
  progressFill: {
    height: 6,
    backgroundColor: COLORS.green,
    borderRadius: 3,
  },
  progressPct: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.green,
    letterSpacing: -1,
    marginTop: 10,
    lineHeight: 46,
  },
  progressLabel: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 2,
    letterSpacing: 0.5,
  },
});

// ─────────────────────────────────────────────────────────
// Finish phase
// ─────────────────────────────────────────────────────────
export const finishStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  checkRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.gold,
    backgroundColor: COLORS.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    color: COLORS.gold,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  summaryBox: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    marginBottom: 28,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryKey: {
    color: COLORS.muted,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  summaryValue: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
    width: '100%',
    marginBottom: 10,
  },
  doneBtnText: {
    color: COLORS.bg,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
    width: '100%',
  },
  secondaryBtnText: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

// ─────────────────────────────────────────────────────────
// Bottom bar (stop button)
// ─────────────────────────────────────────────────────────
export const bottomStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: 'center',
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    gap: 8,
  },
  stopBtnText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

// ─────────────────────────────────────────────────────────
// History modal
// ─────────────────────────────────────────────────────────
export const historyStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 12,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardLeft: {
    gap: 2,
  },
  cardAlat: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  cardId: {
    color: COLORS.muted,
    fontSize: 11,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardDetails: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    color: COLORS.muted,
    fontSize: 12,
  },
  cardDate: {
    color: COLORS.dim,
    fontSize: 11,
    marginTop: 4,
  },
});

export default shared;