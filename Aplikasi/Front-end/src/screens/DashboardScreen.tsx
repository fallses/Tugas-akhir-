import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../styles/DashboardScreen.styles';

const STORAGE_KEY = '@daftar_alat';

interface Alat {
  id: string;
  nama: string;
  idAlat: string;
}

interface Props {
  navigation: any;
}

function formatNamaAlat(text: string): string {
  return text.replace(/\b\w/g, c => c.toUpperCase());
}

function formatIdAlat(text: string): string {
  return text.toUpperCase().replace(/[^A-Z0-9-]/g, '');
}

function isValidIdAlat(id: string): boolean {
  return /^[A-Z][A-Z0-9]*(-[0-9]+)+$/.test(id);
}

export default function DashboardScreen({ navigation }: Props) {
  const [daftarAlat, setDaftarAlat] = useState<Alat[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputNama, setInputNama] = useState('');
  const [inputId, setInputId]     = useState('');
  const [namaError, setNamaError] = useState('');
  const [idError, setIdError]     = useState('');

  // ── Load dari AsyncStorage saat pertama kali mount
  useEffect(() => {
    async function loadAlat() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setDaftarAlat(JSON.parse(raw));
      } catch {
        // Gagal load — mulai dengan list kosong
      } finally {
        setLoading(false);
      }
    }
    loadAlat();
  }, []);

  // ── Simpan ke AsyncStorage setiap kali daftarAlat berubah
  const saveAlat = useCallback(async (list: Alat[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Gagal simpan — tidak perlu crash
    }
  }, []);

  function bukaModal() {
    setInputNama('');
    setInputId('');
    setNamaError('');
    setIdError('');
    setModalVisible(true);
  }

  function tutupModal() {
    setInputNama('');
    setInputId('');
    setNamaError('');
    setIdError('');
    setModalVisible(false);
  }

  function handleNamaChange(text: string) {
    const formatted = formatNamaAlat(text);
    setInputNama(formatted);
    if (namaError && formatted.trim()) setNamaError('');
  }

  function handleIdChange(text: string) {
    const formatted = formatIdAlat(text);
    setInputId(formatted);
    if (idError && isValidIdAlat(formatted)) setIdError('');
  }

  function tambahAlat() {
    let valid = true;

    if (!inputNama.trim()) {
      setNamaError('Nama alat tidak boleh kosong.');
      valid = false;
    } else {
      setNamaError('');
    }

    if (!inputId.trim()) {
      setIdError('ID alat tidak boleh kosong.');
      valid = false;
    } else if (!isValidIdAlat(inputId.trim())) {
      setIdError('Format salah. Contoh yang benar: AUTOCLAVE-1, MESIN-42');
      valid = false;
    } else {
      setIdError('');
    }

    if (!valid) return;

    const alatBaru: Alat = {
      id: Date.now().toString(),
      nama: inputNama.trim(),
      idAlat: inputId.trim(),
    };

    const updated = [...daftarAlat, alatBaru];
    setDaftarAlat(updated);
    saveAlat(updated);
    tutupModal();
  }

  function hapusAlat(id: string, nama: string) {
    Alert.alert(
      'Hapus Alat',
      `Hapus "${nama}" dari daftar?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            const updated = daftarAlat.filter(a => a.id !== id);
            setDaftarAlat(updated);
            saveAlat(updated);
          },
        },
      ]
    );
  }

  function renderItem({ item }: { item: Alat }) {
    return (
      <TouchableOpacity
        style={styles.alatCard}
        onPress={() =>
          navigation.navigate('SetScreen', {
            namaAlat: item.nama,
            idAlat: item.idAlat,
          })
        }
        onLongPress={() => hapusAlat(item.id, item.nama)}
        delayLongPress={500}
      >
        <View style={styles.alatLeft}>
          <View style={[styles.alatIcon, styles.alatIconOff]}>
            <MaterialCommunityIcons name="chip" size={22} color="#00E5FF" />
          </View>
          <View>
            <Text style={styles.alatNama}>{item.nama}</Text>
            <Text style={styles.alatId}>ID: {item.idAlat}</Text>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color="#4A5E78" />
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <View style={styles.greetingCard}>
          <Text style={styles.greetingTitle}>Hello, User!</Text>
          <Text style={styles.greetingSubtitle}>Kendalikan panas, jaga kualitas.</Text>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Daftar Alat</Text>
          <TouchableOpacity style={styles.addBtn} onPress={bukaModal}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.emptyWrapper}>
            <ActivityIndicator size="large" color="#00E5FF" />
          </View>
        ) : daftarAlat.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <MaterialCommunityIcons name="hardware-chip-outline" size={48} color="#1E2D42" />
            <Text style={styles.emptyText}>Belum ada alat terdaftar.</Text>
            <Text style={styles.emptySubtext}>Tekan + untuk menambahkan alat.</Text>
          </View>
        ) : (
          <FlatList
            data={daftarAlat}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              <Text style={{ color: '#333355', fontSize: 11, textAlign: 'center', marginTop: 12 }}>
                Tahan lama pada kartu untuk menghapus alat
              </Text>
            }
          />
        )}

      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={tutupModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Daftarkan Alat</Text>

            <Text style={styles.modalLabel}>Nama Alat</Text>
            <TextInput
              style={[
                styles.modalInput,
                namaError ? { borderColor: '#FF4444', borderWidth: 1 } : {},
              ]}
              placeholder="Contoh: Autoclave A1"
              placeholderTextColor="#333366"
              value={inputNama}
              onChangeText={handleNamaChange}
              autoCapitalize="words"
            />
            {namaError ? (
              <Text style={{ color: '#FF4444', fontSize: 11, marginTop: -6, marginBottom: 8 }}>
                {namaError}
              </Text>
            ) : null}

            <Text style={styles.modalLabel}>ID Alat</Text>
            <TextInput
              style={[
                styles.modalInput,
                idError ? { borderColor: '#FF4444', borderWidth: 1 } : {},
              ]}
              placeholder="Contoh: AUTOCLAVE-1"
              placeholderTextColor="#333366"
              value={inputId}
              onChangeText={handleIdChange}
              autoCapitalize="characters"
              keyboardType="default"
            />
            {idError ? (
              <Text style={{ color: '#FF4444', fontSize: 11, marginTop: -6, marginBottom: 8 }}>
                {idError}
              </Text>
            ) : null}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalBtnBatal} onPress={tutupModal}>
                <Text style={styles.modalBtnBatalText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnTambah} onPress={tambahAlat}>
                <Text style={styles.modalBtnTambahText}>Tambah</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
