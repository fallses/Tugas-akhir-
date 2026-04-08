import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  SafeAreaView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../styles/DashboardScreen.styles';

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
  const [modalVisible, setModalVisible] = useState(false);
  const [inputNama, setInputNama] = useState('');
  const [inputId, setInputId] = useState('');
  const [namaError, setNamaError] = useState('');
  const [idError, setIdError] = useState('');

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
    if (namaError && formatted.trim()) {
      setNamaError('');
    }
  }

  function handleIdChange(text: string) {
    const formatted = formatIdAlat(text);
    setInputId(formatted);
    if (idError && isValidIdAlat(formatted)) {
      setIdError('');
    }
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

    setDaftarAlat(prev => [...prev, alatBaru]);
    tutupModal();
  }

  function renderItem({ item }: { item: Alat }) {
    return (
      <TouchableOpacity
        style={styles.alatCard}
        onPress={() =>
          navigation.navigate('ProcessScreen', {
            namaAlat: item.nama,
            idAlat: item.idAlat,
          })
        }
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
        <MaterialCommunityIcons name="chevron-right" size={20} color="#555580" />
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

        {daftarAlat.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <MaterialCommunityIcons name="hardware-chip-outline" size={48} color="#2A2A4A" />
            <Text style={styles.emptyText}>Belum ada alat terdaftar.</Text>
            <Text style={styles.emptySubtext}>Tekan + untuk menambahkan alat.</Text>
          </View>
        ) : (
          <FlatList
            data={daftarAlat}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
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