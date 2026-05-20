import { StyleSheet } from 'react-native';
import { COLORS } from './ProcessScreen.styles';

const manualStyles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
    gap: 16,
  },

  // ── Monitor card ──────────────────────────────────────
  monitorCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  monitorHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 14,
  },
  monitorTitle: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  monitorRefreshBtn: {
    marginLeft: 'auto' as any,
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accent + '44',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  monitorRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  monitorItem: {
    flex: 1,
    alignItems: 'center' as const,
    gap: 4,
  },
  monitorLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  monitorValue: {
    fontSize: 36,
    fontWeight: '900' as const,
    letterSpacing: -0.5,
  },
  monitorUnit: {
    color: COLORS.muted,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  monitorDivider: {
    width: 1,
    height: 72,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },

  // ── Card ──────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },

  // ── Option buttons ────────────────────────────────────
  optionRow: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  optionBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    color: COLORS.muted,
  },

  // Active — accent (biru)
  optionBtnAccent: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentDim,
  },
  optionBtnAccentText: {
    color: COLORS.accent,
  },

  // Active — fire (oranye)
  optionBtnFire: {
    borderColor: COLORS.fire,
    backgroundColor: COLORS.fireDim,
  },
  optionBtnFireText: {
    color: COLORS.fire,
  },

  // Active — green (hijau)
  optionBtnGreen: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.greenDim,
  },
  optionBtnGreenText: {
    color: COLORS.green,
  },

  // Active — danger (merah)
  optionBtnDanger: {
    borderColor: COLORS.danger,
    backgroundColor: '#2A0008',
  },
  optionBtnDangerText: {
    color: COLORS.danger,
  },

  // ── Card saat sedang mengirim ─────────────────────────
  cardDisabled: {
    opacity: 0.55,
  },

  // ── Status card ───────────────────────────────────────
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 8,
  },
  statusHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  statusLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  statusSuccess: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  statusError: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
});

export default manualStyles;
