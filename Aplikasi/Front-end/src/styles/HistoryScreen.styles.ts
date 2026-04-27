import { StyleSheet } from 'react-native';

export const COLORS = {
  bg:         '#080C10',
  surface:    '#0F1520',
  surface2:   '#141E2E',
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
  muted2:     '#2A3A50',
  danger:     '#FF4455',
  text:       '#F0F4FF',
};

// ─────────────────────────────────────────────────────────
// Top Bar
// ─────────────────────────────────────────────────────────
export const topBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
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
  spacer: {
    width: 40,
  },
});

// ─────────────────────────────────────────────────────────
// Filter chips
// ─────────────────────────────────────────────────────────
export const filterStyles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    maxHeight: 52,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignSelf: 'flex-start',
  },
  chipActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentDim,
  },
  chipText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  chipTextActive: {
    color: COLORS.accent,
  },
  countBadge: {
    borderRadius: 8,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
});

// ─────────────────────────────────────────────────────────
// List cards
// ─────────────────────────────────────────────────────────
export const listStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },

  // ── Empty state
  emptyWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  emptySubtitle: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Date group header
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    marginTop: 16,
  },
  groupLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  groupLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // ── Card container
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    paddingLeft: 18,
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  cardDeviceName: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  cardDate: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 1,
  },
  cardTime: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

// ─────────────────────────────────────────────────────────
// Detail modal (bottom sheet)
// ─────────────────────────────────────────────────────────
export const detailModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  // Drag handle pill at top of sheet
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.muted2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // ── Status header (icon + title + subtitle)
  statusHeader: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  statusIconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statusSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    letterSpacing: 0.5,
  },

  // ── Detail info card
  detailCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailCardTitle: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailKeyText: {
    color: COLORS.muted,
    fontSize: 13,
  },
  detailValue: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    maxWidth: '55%',
  },
  detailDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  // ── Notes card
  notesCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  notesTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  notesEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notesEditBtnText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  // ── Notes textarea — dipakai untuk edit maupun tampilkan teks
  notesInput: {
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 10,
  },
  // ── Placeholder teks saat notes kosong dan tidak sedang edit
  notesPlaceholder: {
    color: COLORS.muted,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 20,
    minHeight: 60,
    paddingVertical: 4,
  },
  notesSaveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  notesSaveBtnText: {
    color: COLORS.bg,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // ── Close button
  closeBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});