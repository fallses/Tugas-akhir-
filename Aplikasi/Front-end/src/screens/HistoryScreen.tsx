import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';
import {
  COLORS,
  topBarStyles,
  listStyles,
  filterStyles,
  detailModalStyles,
} from '../styles/HistoryScreen.styles';
import { fetchHistories, HistoriesData, deleteHistory, updateHistoryNotes, fetchHistoryDetail } from '../services/backendService';

const STORAGE_KEY = '@daftar_alat';

interface Alat {
  id: string;
  nama: string;
  idAlat: string;
}

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
export interface HistoryEntry {
  id:           string;
  namaAlat:     string;
  idAlat:       string;
  suhu:         number;
  tekanan:      number;
  durasi:       string;
  tanggal:      string;
  mulaiPukul:   string;
  selesaiPukul: string;
  status:       'Berhasil' | 'Dihentikan';
  notes?:       string;
  batch_id?:    string | null; // ID unik untuk membedakan proses
}

type FilterType = 'Semua' | 'Berhasil' | 'Dihentikan';

interface Props {
  navigation: any;
  route: {
    params?: {
      history?: HistoryEntry[];
      idAlat?: string;
    };
  };
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function convertHistoriesDataToEntry(data: HistoriesData[], alatMap: Map<string, string>): HistoryEntry[] {
  return data.map((item, index) => {
    const createdAt = item.createdAt ? new Date(item.createdAt) : new Date();
    const tanggal = createdAt.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const selesaiPukul = createdAt.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Hitung mulai pukul dari waktu durasi
    let mulaiPukul = selesaiPukul;
    if (item.waktu) {
      const parts = item.waktu.split(':');
      if (parts.length === 2) {
        const durasiMenit = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        const mulaiTime = new Date(createdAt.getTime() - durasiMenit * 60 * 1000);
        mulaiPukul = mulaiTime.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    }

    const namaAlat = item.namaAlat || alatMap.get(item.device) || item.device;

    // Mapping status
    let status: 'Berhasil' | 'Dihentikan' = 'Berhasil';
    
    if (item.status === 'stopped' || item.action === 'stop') {
      status = 'Dihentikan';
    } else if (item.status === 'completed' || item.action === 'finish') {
      status = 'Berhasil';
    } else if (item.status === 'running') {
      status = 'Dihentikan'; // Proses yang belum selesai dianggap dihentikan
    }

    console.log(`[HistoryScreen] Mapping entry ${item._id}: batch_id = ${item.batch_id}, status=${status}`);

    return {
      id: item._id,
      namaAlat,
      idAlat: item.device,
      suhu: item.suhu ?? 0,
      tekanan: item.tekanan ?? 0,
      durasi: item.waktu ?? '00:00',
      tanggal,
      mulaiPukul,
      selesaiPukul,
      status,
      notes: item.notes ?? '',
      batch_id: item.batch_id, // Selalu ada karena dari collection histories
    };
  });
}

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
  const idAlatFilter = route.params?.idAlat; // ID alat untuk filter
  
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [filter, setFilter]   = useState<FilterType>('Semua');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Fetch data dari backend
  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Load daftar alat dari AsyncStorage untuk mapping nama
      let alatMap = new Map<string, string>();
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const daftarAlat: Alat[] = JSON.parse(stored);
          // Buat map: idAlat -> nama
          daftarAlat.forEach(alat => {
            alatMap.set(alat.idAlat, alat.nama);
          });
        }
      } catch (err) {
        console.error('[HistoryScreen] Error loading alat data:', err);
      }

      // Fetch histories dari backend (collection baru)
      console.log('[HistoryScreen] 🔍 Fetching histories from API...');
      const res = await fetchHistories();
      if (res.status === 'success' && res.data) {
        console.log(`[HistoryScreen] ✅ Received ${res.data.length} histories`);
        const converted = convertHistoriesDataToEntry(res.data, alatMap);
        // Filter berdasarkan idAlat jika ada parameter
        const filtered = idAlatFilter 
          ? converted.filter(entry => entry.idAlat === idAlatFilter)
          : converted;
        setEntries(filtered);
        console.log(`[HistoryScreen] ✅ Loaded ${filtered.length} entries`);
      } else {
        console.log('[HistoryScreen] ⚠️ No data received');
        setEntries([]);
      }
    } catch (err) {
      console.error('[HistoryScreen] ❌ Error loading history:', err);
      setError('Gagal memuat riwayat');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [idAlatFilter]);

  // Refresh data setiap kali screen difokuskan
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  // Detail modal
  const [selected, setSelected]         = useState<HistoryEntry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Chart data (data real dari database berdasarkan batch_id)
  const [chartData, setChartData] = useState<{
    suhuData: number[];
    tekananData: number[];
    labels: string[];
  } | null>(null);
  const [loadingChart, setLoadingChart] = useState(false);

  // Notes editing
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText]       = useState('');
  const [savingNotes, setSavingNotes]   = useState(false);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  function openModal(entry: HistoryEntry) {
    setSelected(entry);
    setNotesText(entry.notes ?? '');
    setEditingNotes(false);
    setShowDeleteConfirm(false);
    setModalVisible(true);
    
    // Load chart data berdasarkan batch_id
    loadChartData(entry);
  }

  function closeModal() {
    setModalVisible(false);
    setShowDeleteConfirm(false);
    setChartData(null); // Reset chart data
    setTimeout(() => setSelected(null), 300);
  }

  // Load chart data dari database berdasarkan batch_id
  async function loadChartData(entry: HistoryEntry) {
    // Cek apakah ada batch_id
    const batchId = entry.batch_id;
    
    console.log('[HistoryScreen] loadChartData called for entry:', {
      id: entry.id,
      namaAlat: entry.namaAlat,
      batch_id: batchId,
      hasBatchId: !!batchId
    });
    
    if (!batchId) {
      console.log('[HistoryScreen] ❌ Tidak ada batch_id, grafik tidak tersedia');
      setChartData(null);
      return;
    }

    setLoadingChart(true);
    try {
      console.log(`[HistoryScreen] 🔍 Mengambil detail history untuk batch_id: ${batchId}`);
      const response = await fetchHistoryDetail(batchId);
      
      console.log(`[HistoryScreen] 📦 Response status: ${response.status}`);
      
      if (response.status === 'success' && response.data && response.data.runningData && response.data.runningData.length > 0) {
        const runningData = response.data.runningData;
        console.log(`[HistoryScreen] ✅ Data running ditemukan: ${runningData.length} data points`);
        console.log('[HistoryScreen] 📊 Sample data:', runningData.slice(0, 3)); // Log 3 data pertama
        
        // Extract data untuk grafik
        const suhuData = runningData.map(item => item.suhu ?? 0);
        const tekananData = runningData.map(item => item.tekanan ?? 0);
        
        console.log('[HistoryScreen] 🌡️ Suhu data:', suhuData.slice(0, 5)); // Log 5 data pertama
        console.log('[HistoryScreen] 💨 Tekanan data:', tekananData.slice(0, 5)); // Log 5 data pertama
        
        // Generate labels dari timer atau timestamp
        const labels = runningData.map((item, index) => {
          if (item.timer) {
            // Ambil menit:detik dari timer (format: HH:MM:SS)
            const parts = item.timer.split(':');
            if (parts.length === 3) {
              return `${parts[1]}:${parts[2]}`; // MM:SS
            }
            return item.timer;
          }
          // Fallback: gunakan index
          return index === 0 ? 'Mulai' : (index === runningData.length - 1 ? 'Selesai' : '');
        });
        
        setChartData({ suhuData, tekananData, labels });
        console.log('[HistoryScreen] ✅ Chart data berhasil diload:', { 
          suhuPoints: suhuData.length, 
          tekananPoints: tekananData.length,
          labelCount: labels.length
        });
      } else {
        console.log('[HistoryScreen] ⚠️ Tidak ada data running, grafik tidak tersedia');
        setChartData(null);
      }
    } catch (error) {
      console.error('[HistoryScreen] ❌ Error loading chart data:', error);
      setChartData(null);
    } finally {
      setLoadingChart(false);
    }
  }

  async function saveNotes() {
    if (!selected) return;
    setSavingNotes(true);
    try {
      // Simpan ke database
      await updateHistoryNotes(selected.id, notesText);
      
      // Update state lokal
      const updated = entries.map(e =>
        e.id === selected.id ? { ...e, notes: notesText } : e
      );
      setEntries(updated);
      setSelected(prev => prev ? { ...prev, notes: notesText } : prev);
      setEditingNotes(false);
    } catch (err) {
      console.error('[HistoryScreen] Error saving notes:', err);
      Alert.alert('Gagal', 'Gagal menyimpan catatan');
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleDeleteHistory() {
    if (!selected) return;
    setDeleting(true);
    try {
      await deleteHistory(selected.id);
      // Hapus dari state lokal
      const updated = entries.filter(e => e.id !== selected.id);
      setEntries(updated);
      closeModal();
    } catch (err) {
      console.error('[HistoryScreen] Error deleting history:', err);
      Alert.alert('Gagal', 'Gagal menghapus riwayat');
    } finally {
      setDeleting(false);
    }
  }

  async function handleDeleteAllHistory() {
    if (!idAlatFilter || entries.length === 0) return;
    setDeletingAll(true);
    try {
      // Hapus semua riwayat satu per satu
      await Promise.all(entries.map(entry => deleteHistory(entry.id)));
      // Kosongkan state lokal
      setEntries([]);
      setShowDeleteAllConfirm(false);
    } catch (err) {
      console.error('[HistoryScreen] Error deleting all history:', err);
      Alert.alert('Gagal', 'Gagal menghapus semua riwayat');
    } finally {
      setDeletingAll(false);
    }
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
    const subtitle = idAlatFilter 
      ? `${entries.length} proses untuk ${idAlatFilter}`
      : `${entries.length} proses tercatat`;
    
    return (
      <View style={topBarStyles.container}>
        <View style={{ width: 80, alignItems: 'flex-start' }}>
          <Pressable
            style={topBarStyles.backBtn}
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard')}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={18} color={COLORS.muted} />
          </Pressable>
        </View>
        <View style={topBarStyles.titleBlock}>
          <Text style={topBarStyles.title}>Riwayat Sterilisasi</Text>
          <Text style={topBarStyles.subtitle}>{subtitle}</Text>
        </View>
        <View style={{ width: 80, alignItems: 'flex-end' }}>
          {idAlatFilter && entries.length > 0 ? (
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: COLORS.danger + '22',
                borderWidth: 1,
                borderColor: COLORS.danger + '44',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => setShowDeleteAllConfirm(true)}
            >
              <MaterialCommunityIcons name="delete-outline" size={20} color={COLORS.danger} />
            </TouchableOpacity>
          ) : null}
        </View>
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
    if (loading) {
      return (
        <View style={listStyles.emptyWrapper}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={listStyles.emptySubtitle}>Memuat riwayat...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={listStyles.emptyWrapper}>
          <View style={listStyles.emptyIconRing}>
            <MaterialCommunityIcons name="alert-circle-outline" size={40} color={COLORS.danger} />
          </View>
          <Text style={listStyles.emptyTitle}>Gagal Memuat</Text>
          <Text style={listStyles.emptySubtitle}>{error}</Text>
          <TouchableOpacity
            style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.accent, borderRadius: 8 }}
            onPress={loadHistory}
          >
            <Text style={{ color: COLORS.bg, fontWeight: '600' }}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      );
    }

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
    const color  = statusColor(entry.status);
    const isOk   = entry.status === 'Berhasil';

    return (
      <TouchableOpacity
        key={entry.id}
        style={listStyles.card}
        onPress={() => openModal(entry)}
        activeOpacity={0.75}
      >
        {/* Left accent strip */}
        <View style={[listStyles.cardAccent, { backgroundColor: color }]} />

        <View style={listStyles.cardInner}>
          {/* Content */}
          <View style={listStyles.cardContent}>
            <Text style={listStyles.cardDeviceName} numberOfLines={1}>{entry.namaAlat}</Text>
            <Text style={listStyles.cardDate}>{entry.tanggal}</Text>
            <Text style={listStyles.cardTime}>
              {entry.mulaiPukul} – {entry.selesaiPukul}
            </Text>
          </View>

          {/* Status badge */}
          <View style={[listStyles.statusBadge, { borderColor: color + '66' }]}>
            <Text style={[listStyles.statusText, { color }]}>
              {isOk ? '✓ Berhasil' : '✗ Dihentikan'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  function renderList() {
    if (loading || error || filtered.length === 0) return renderEmpty();
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

              {/* ── Grafik Perubahan Suhu dan Tekanan */}
              <View style={{
                backgroundColor: COLORS.surface,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                  gap: 6,
                }}>
                  <MaterialCommunityIcons name="chart-areaspline" size={16} color={COLORS.muted} />
                  <Text style={{
                    color: COLORS.white,
                    fontSize: 14,
                    fontWeight: '600',
                  }}>
                    Grafik Perubahan
                  </Text>
                  {loadingChart && (
                    <ActivityIndicator size="small" color={COLORS.accent} style={{ marginLeft: 8 }} />
                  )}
                </View>

                {/* Loading state */}
                {loadingChart && (
                  <View style={{
                    height: 200,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                    <Text style={{
                      color: COLORS.muted,
                      fontSize: 12,
                      marginTop: 12,
                    }}>
                      Memuat data grafik...
                    </Text>
                  </View>
                )}

                {/* Data real dari database */}
                {!loadingChart && chartData && (
                  <>
                    {/* Legend */}
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      marginBottom: 12,
                      gap: 16,
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: COLORS.fire,
                        }} />
                        <Text style={{ color: COLORS.muted, fontSize: 12 }}>Suhu (°C)</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: COLORS.accent,
                        }} />
                        <Text style={{ color: COLORS.muted, fontSize: 12 }}>Tekanan (bar)</Text>
                      </View>
                    </View>

                    {/* Grafik dengan data real */}
                    <LineChart
                      data={{
                        labels: chartData.labels.length > 6 
                          ? chartData.labels.filter((_, i) => i % Math.ceil(chartData.labels.length / 6) === 0) 
                          : chartData.labels,
                        datasets: [
                          {
                            data: chartData.suhuData.length > 0 ? chartData.suhuData : [0],
                            color: () => COLORS.fire,
                            strokeWidth: 2,
                          },
                          {
                            data: chartData.tekananData.length > 0 ? chartData.tekananData : [0],
                            color: () => COLORS.accent,
                            strokeWidth: 2,
                          },
                        ],
                      }}
                      width={Dimensions.get('window').width - 84}
                      height={200}
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

                    <Text style={{
                      color: COLORS.green,
                      fontSize: 11,
                      textAlign: 'center',
                      marginTop: 8,
                      fontWeight: '600',
                    }}>
                      ✓ Grafik real dari database ({chartData.suhuData.length} data points)
                    </Text>
                  </>
                )}

                {/* Tidak ada data atau batch_id */}
                {!loadingChart && !chartData && (
                  <View style={{
                    height: 200,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: COLORS.surface2,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderStyle: 'dashed',
                  }}>
                    <MaterialCommunityIcons 
                      name="chart-line-variant" 
                      size={48} 
                      color={COLORS.muted2} 
                    />
                    <Text style={{
                      color: COLORS.muted,
                      fontSize: 13,
                      marginTop: 12,
                      textAlign: 'center',
                      paddingHorizontal: 24,
                    }}>
                      Grafik tidak tersedia
                    </Text>
                    <Text style={{
                      color: COLORS.muted2,
                      fontSize: 11,
                      marginTop: 4,
                      textAlign: 'center',
                      paddingHorizontal: 24,
                    }}>
                      Tidak ada data running untuk proses ini
                    </Text>
                  </View>
                )}
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
                      editable={!savingNotes}
                    />
                    <TouchableOpacity
                      style={[
                        detailModalStyles.notesSaveBtn,
                        savingNotes && { opacity: 0.6 }
                      ]}
                      onPress={saveNotes}
                      disabled={savingNotes}
                    >
                      {savingNotes ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <ActivityIndicator size="small" color={COLORS.bg} />
                          <Text style={detailModalStyles.notesSaveBtnText}>Menyimpan...</Text>
                        </View>
                      ) : (
                        <Text style={detailModalStyles.notesSaveBtnText}>Simpan Catatan</Text>
                      )}
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
              {!showDeleteConfirm ? (
                <>
                  <TouchableOpacity 
                    style={[detailModalStyles.closeBtn, { 
                      backgroundColor: COLORS.accent, 
                      marginBottom: 12,
                    }]} 
                    onPress={() => {
                      closeModal();
                      // Reset navigation stack agar back dari SetScreen langsung ke Dashboard
                      navigation.reset({
                        index: 1,
                        routes: [
                          { name: 'Dashboard' },
                          { 
                            name: 'SetScreen',
                            params: {
                              namaAlat: selected.namaAlat,
                              idAlat: selected.idAlat,
                              prefilledData: {
                                waktu: selected.durasi,
                                suhu: selected.suhu.toString(),
                                tekanan: selected.tekanan.toString(),
                              }
                            }
                          }
                        ],
                      });
                    }}
                  >
                    <MaterialCommunityIcons name="refresh" size={18} color={COLORS.bg} />
                    <Text style={[detailModalStyles.closeBtnText, { color: COLORS.bg, marginLeft: 8 }]}>
                      Gunakan Data
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[detailModalStyles.closeBtn, { 
                      backgroundColor: COLORS.danger + '22', 
                      borderColor: COLORS.danger + '44',
                      borderWidth: 1,
                      marginBottom: 12,
                    }]} 
                    onPress={() => setShowDeleteConfirm(true)}
                  >
                    <MaterialCommunityIcons name="delete-outline" size={18} color={COLORS.danger} />
                    <Text style={[detailModalStyles.closeBtnText, { color: COLORS.danger, marginLeft: 8 }]}>
                      Hapus Riwayat
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={detailModalStyles.closeBtn} onPress={closeModal}>
                    <Text style={detailModalStyles.closeBtnText}>Tutup</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={{
                    backgroundColor: COLORS.danger + '11',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: COLORS.danger + '33',
                  }}>
                    <Text style={{
                      color: COLORS.danger,
                      fontSize: 14,
                      fontWeight: '600',
                      marginBottom: 6,
                      textAlign: 'center',
                    }}>
                      Hapus riwayat ini?
                    </Text>
                    <Text style={{
                      color: COLORS.muted,
                      fontSize: 12,
                      textAlign: 'center',
                      lineHeight: 18,
                    }}>
                      Tindakan ini tidak dapat dibatalkan
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity 
                      style={[detailModalStyles.closeBtn, { 
                        flex: 1,
                        backgroundColor: COLORS.surface,
                      }]} 
                      onPress={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                    >
                      <Text style={detailModalStyles.closeBtnText}>Batal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[detailModalStyles.closeBtn, { 
                        flex: 1,
                        backgroundColor: COLORS.danger,
                      }]} 
                      onPress={handleDeleteHistory}
                      disabled={deleting}
                    >
                      {deleting ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="delete" size={18} color={COLORS.white} />
                          <Text style={[detailModalStyles.closeBtnText, { marginLeft: 8 }]}>
                            Hapus
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
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
      
      {/* Modal konfirmasi hapus semua */}
      <Modal
        visible={showDeleteAllConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteAllConfirm(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: COLORS.surface,
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}>
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: COLORS.danger + '22',
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              marginBottom: 16,
              borderWidth: 2,
              borderColor: COLORS.danger + '44',
            }}>
              <MaterialCommunityIcons name="delete-alert" size={28} color={COLORS.danger} />
            </View>
            
            <Text style={{
              color: COLORS.white,
              fontSize: 18,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: 8,
            }}>
              Hapus Semua Riwayat?
            </Text>
            
            <Text style={{
              color: COLORS.muted,
              fontSize: 13,
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: 24,
            }}>
              Anda akan menghapus {entries.length} riwayat untuk {idAlatFilter}.{'\n'}
              Tindakan ini tidak dapat dibatalkan.
            </Text>
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: COLORS.bg,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
                onPress={() => setShowDeleteAllConfirm(false)}
                disabled={deletingAll}
              >
                <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: '600' }}>
                  Batal
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: COLORS.danger,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                }}
                onPress={handleDeleteAllHistory}
                disabled={deletingAll}
              >
                {deletingAll ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="delete" size={18} color={COLORS.white} />
                    <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: '600' }}>
                      Hapus Semua
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}