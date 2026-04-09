import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
  Animated,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  COLORS,
  topBarStyles,
  listStyles,
  filterStyles,
  detailModalStyles,
} from '../styles/HistoryScreen.styles';

// ─────────────────────────────────────────────────────────
// Types — matches HistoryEntry from ProcessScreen
// ─────────────────────────────────────────────────────────
export interface HistoryEntry {
  id: string;
  namaAlat: string;
  idAlat: string;
  suhu: string;
  tekanan: string;
  durasi: string;         // formatted HH:MM:SS
  selesaiPukul: string;
  tanggal: string;
  status: 'Berhasil' | 'Dihentikan';
  notes?: string;         // user-added notes, persisted locally
}

type FilterType = 'Semua' | 'Berhasil' | 'Dihentikan';

interface Props {
  navigation: any;
  /**
   * Pass the shared globalHistory array from ProcessScreen,
   * or use a shared store / AsyncStorage in production.
   */
  route: {
    params?: {
      history?: HistoryEntry[];
      onUpdateNotes?: (id: string, notes: string) => void;
    };
  };
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function groupByDate(entries: HistoryEntry[]): { label: string; items: HistoryEntry[] }[] {
  const map = new Map<string, HistoryEntry[]>();
  for (const e of entries) {
    const key = e.tanggal;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

function statusColor(status: HistoryEntry['status']) {
  return status === 'Berhasil' ? COLORS.green : COLORS.danger;
}

function statusIcon(status: HistoryEntry['status']): string {
  return status === 'Berhasil' ? 'check-circle-outline' : 'stop-circle-outline';
}

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────
export default function HistoryScreen({ route, navigation }: Props) {
  const passedHistory: HistoryEntry[] = route.params?.history ?? [];
  const onUpdateNotes = route.params?.onUpdateNotes;

  // Local state — notes edits are stored here (use AsyncStorage in production)
  const [entries, setEntries] = useState<HistoryEntry[]>(passedHistory);
  const [filter, setFilter]   = useState<FilterType>('Semua');

  // Detail modal
  const [selected, setSelected]         = useState<HistoryEntry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Notes editing
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText]       = useState('');

  // Animation for modal
  const sheetAnim = useRef(new Animated.Value(0)).current;

  function openModal(entry: HistoryEntry) {
    setSelected(entry);
    setNotesText(entry.notes ?? '');
    setEditingNotes(false);
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setTimeout(() => setSelected(null), 300);
  }

  function saveNotes() {
    if (!selected) return;
    const updated = entries.map(e =>
      e.id === selected.id ? { ...e, notes: notesText } : e
    );
    setEntries(updated);
    setSelected(prev => prev ? { ...prev, notes: notesText } : prev);
    onUpdateNotes?.(selected.id, notesText);
    setEditingNotes(false);
  }

  // Filter logic
  const filtered = entries.filter(e =>
    filter === 'Semua' ? true : e.status === filter
  );
  const grouped = groupByDate(filtered);

  const countBerhasil   = entries.filter(e => e.status === 'Berhasil').length;
  const countDihentikan = entries.filter(e => e.status === 'Dihentikan').length;

  // ── Renders
  function renderTopBar() {
    return (
      <View style={topBarStyles.container}>
        <Pressable
          style={topBarStyles.backBtn}
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard')}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={18} color={COLORS.muted} />
        </Pressable>
        <View style={topBarStyles.titleBlock}>
          <Text style={topBarStyles.title}>Riwayat Sterilisasi</Text>
          <Text style={topBarStyles.subtitle}>{entries.length} proses tercatat</Text>
        </View>
        <View style={topBarStyles.spacer} />
      </View>
    );
  }

  function renderFilters() {
    const filters: { key: FilterType; count?: number }[] = [
      { key: 'Semua',      count: entries.length },
      { key: 'Berhasil',   count: countBerhasil },
      { key: 'Dihentikan', count: countDihentikan },
    ];
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={filterStyles.container}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
      >
        {filters.map(f => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[filterStyles.chip, active && filterStyles.chipActive]}
              onPress={() => setFilter(f.key)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[filterStyles.chipText, active && filterStyles.chipTextActive]}>
                  {f.key}
                </Text>
                {f.count !== undefined && (
                  <View style={[filterStyles.countBadge, { backgroundColor: active ? COLORS.accent : COLORS.muted2, marginLeft: 6 }]}>
                    <Text style={[filterStyles.countBadgeText, { color: active ? COLORS.bg : COLORS.bg }]}>
                      {f.count}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  }

  function renderEmpty() {
    return (
      <View style={listStyles.emptyWrapper}>
        <View style={listStyles.emptyIconRing}>
          <MaterialCommunityIcons name="history" size={40} color={COLORS.muted} />
        </View>
        <Text style={listStyles.emptyTitle}>Belum ada riwayat</Text>
        <Text style={listStyles.emptySubtitle}>
          Proses sterilisasi yang selesai akan muncul di sini
        </Text>
      </View>
    );
  }

  function renderCard(entry: HistoryEntry) {
    const color    = statusColor(entry.status);
    const icon     = statusIcon(entry.status);
    const iconBg   = entry.status === 'Berhasil' ? COLORS.greenDim : '#2A1010';
    const hasNotes = (entry.notes ?? '').trim().length > 0;

    return (
      <TouchableOpacity
        key={entry.id}
        style={listStyles.card}
        onPress={() => openModal(entry)}
        activeOpacity={0.75}
      >
        <View style={listStyles.cardInner}>
          {/* Left accent strip */}
          <View style={[listStyles.cardAccent, { backgroundColor: color }]} />

          {/* Icon */}
          <View style={[listStyles.iconRing, { backgroundColor: iconBg, borderColor: color + '44' }]}>
            <MaterialCommunityIcons name={icon} size={22} color={color} />
          </View>

          {/* Content */}
          <View style={listStyles.cardContent}>
            <Text style={listStyles.cardDeviceName} numberOfLines={1}>{entry.namaAlat}</Text>
            <Text style={listStyles.cardDeviceId}>{entry.idAlat}</Text>
            <View style={listStyles.cardMeta}>
              <MaterialCommunityIcons name="clock-outline" size={11} color={COLORS.muted} />
              <Text style={listStyles.cardTime}>{entry.selesaiPukul}</Text>
              <View style={listStyles.cardDot} />
              <MaterialCommunityIcons name="timer-outline" size={11} color={COLORS.muted} />
              <Text style={listStyles.cardDurasi}>{entry.durasi}</Text>
            </View>
            <View style={[listStyles.statusBadge, { borderColor: color + '66' }]}>
              <Text style={[listStyles.statusText, { color }]}>{entry.status}</Text>
            </View>

            {/* Notes preview — shown only if notes exist */}
            {hasNotes && (
              <View style={listStyles.notesPreview}>
                <MaterialCommunityIcons name="note-text-outline" size={11} color={COLORS.gold} />
                <Text style={listStyles.notesPreviewText} numberOfLines={1}>
                  {entry.notes}
                </Text>
              </View>
            )}
          </View>

          {/* Right side: notes indicator dot + chevron */}
          <View style={{ alignItems: 'center', gap: 6 }}>
            {hasNotes && (
              <View style={listStyles.notesDot} />
            )}
            <View style={listStyles.cardChevron}>
              <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.muted} />
            </View>
          </View>
        </View>

        {/* Quick-add notes bar — shown when no notes yet */}
        {!hasNotes && (
          <TouchableOpacity
            style={listStyles.addNotesBar}
            onPress={() => {
              openModal(entry);
              // Auto-trigger edit mode after modal opens
              setTimeout(() => setEditingNotes(true), 350);
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="plus" size={12} color={COLORS.muted} />
            <Text style={listStyles.addNotesBarText}>Tambah catatan</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }

  function renderList() {
    if (filtered.length === 0) return renderEmpty();
    return (
      <ScrollView
        style={listStyles.container}
        contentContainerStyle={listStyles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {grouped.map(group => (
          <View key={group.label}>
            <View style={listStyles.groupHeader}>
              <View style={listStyles.groupLine} />
              <Text style={listStyles.groupLabel}>{group.label}</Text>
              <View style={listStyles.groupLine} />
            </View>
            {group.items.map(renderCard)}
          </View>
        ))}
      </ScrollView>
    );
  }

  // ── Detail Modal
  function renderDetailModal() {
    if (!selected) return null;
    const color    = statusColor(selected.status);
    const bgColor  = selected.status === 'Berhasil' ? COLORS.greenDim : '#2A1010';
    const hasNotes = (selected.notes ?? '').trim().length > 0;

    return (
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={detailModalStyles.overlay}>
          <View style={detailModalStyles.sheet}>
            {/* Drag handle */}
            <View style={detailModalStyles.handle} />

            <ScrollView
              contentContainerStyle={detailModalStyles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* ── Status header */}
              <View style={detailModalStyles.statusHeader}>
                <View style={[
                  detailModalStyles.statusIconRing,
                  { backgroundColor: bgColor, borderColor: color }
                ]}>
                  <MaterialCommunityIcons
                    name={selected.status === 'Berhasil' ? 'check-bold' : 'stop'}
                    size={32}
                    color={color}
                  />
                </View>
                <Text style={[detailModalStyles.statusTitle, { color }]}>
                  {selected.status === 'Berhasil' ? 'Steril Selesai' : 'Proses Dihentikan'}
                </Text>
                <Text style={detailModalStyles.statusSubtitle}>
                  {selected.namaAlat} · {selected.idAlat}
                </Text>
              </View>

              {/* ── Detail info card */}
              <View style={detailModalStyles.detailCard}>
                <Text style={detailModalStyles.detailCardTitle}>Detail Proses</Text>

                {[
                  { icon: 'tag-outline',         label: 'Nama Alat',     value: selected.namaAlat },
                  { icon: 'identifier',           label: 'ID Alat',       value: selected.idAlat },
                  { icon: 'thermometer-high',     label: 'Suhu',          value: `${selected.suhu}°C`,       color: COLORS.fire },
                  { icon: 'gauge',                label: 'Tekanan',       value: `${selected.tekanan} bar`,  color: COLORS.accent },
                  { icon: 'timer-outline',        label: 'Durasi Total',  value: selected.durasi },
                  { icon: 'calendar-outline',     label: 'Tanggal',       value: selected.tanggal },
                  { icon: 'clock-check-outline',  label: 'Selesai Pukul', value: selected.selesaiPukul },
                  { icon: 'shield-check-outline', label: 'Status',        value: selected.status, valueColor: color },
                ].map((row, idx, arr) => (
                  <React.Fragment key={row.label}>
                    <View style={detailModalStyles.detailRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <MaterialCommunityIcons
                          name={row.icon as any}
                          size={15}
                          color={row.color ?? COLORS.muted}
                        />
                        <Text style={detailModalStyles.detailKeyText}>{row.label}</Text>
                      </View>
                      <Text style={[detailModalStyles.detailValue, row.valueColor ? { color: row.valueColor } : undefined]}>
                        {row.value}
                      </Text>
                    </View>
                    {idx < arr.length - 1 && <View style={detailModalStyles.detailDivider} />}
                  </React.Fragment>
                ))}
              </View>

              {/* ── Notes card */}
              <View style={detailModalStyles.notesCard}>
                <View style={detailModalStyles.notesHeader}>
                  <Text style={detailModalStyles.notesTitle}>Catatan</Text>
                  {!editingNotes && (
                    <TouchableOpacity
                      style={detailModalStyles.notesEditBtn}
                      onPress={() => setEditingNotes(true)}
                    >
                      <MaterialCommunityIcons name="pencil-outline" size={13} color={COLORS.muted} />
                      <Text style={detailModalStyles.notesEditBtnText}>
                        {hasNotes ? 'Edit' : 'Tambah'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {editingNotes ? (
                  <>
                    <TextInput
                      style={detailModalStyles.notesInput}
                      value={notesText}
                      onChangeText={setNotesText}
                      placeholder="Tambahkan catatan tentang proses ini..."
                      placeholderTextColor={COLORS.muted}
                      multiline
                      autoFocus
                      selectionColor={COLORS.accent}
                    />
                    <TouchableOpacity
                      style={detailModalStyles.notesSaveBtn}
                      onPress={saveNotes}
                    >
                      <Text style={detailModalStyles.notesSaveBtnText}>Simpan Catatan</Text>
                    </TouchableOpacity>
                  </>
                ) : hasNotes ? (
                  <Text style={detailModalStyles.notesInput}>{selected.notes}</Text>
                ) : (
                  <Text style={detailModalStyles.notesPlaceholder}>
                    Belum ada catatan. Ketuk "Tambah" untuk menulis catatan.
                  </Text>
                )}
              </View>

              {/* ── Close */}
              <TouchableOpacity style={detailModalStyles.closeBtn} onPress={closeModal}>
                <Text style={detailModalStyles.closeBtnText}>Tutup</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  // ── Main render
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      {renderTopBar()}
      {renderFilters()}
      {renderList()}
      {renderDetailModal()}
    </SafeAreaView>
  );
}