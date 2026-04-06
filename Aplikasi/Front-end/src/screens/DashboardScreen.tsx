import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  SafeAreaView,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../styles/DashboardScreen.styles';

interface Alat {
  id: string;
  nama: string;
  idAlat: string;
  status: boolean;
}

interface Props {
  navigation: any;
}

export default function DashboardScreen({ navigation }: Props) {
  const [daftarAlat, setDaftarAlat] = useState<Alat[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputNama, setInputNama] = useState('');
  const [inputId, setInputId] = useState('');

  function bukaModal() {
    setInputNama('');
    setInputId('');
    setModalVisible(true);
  }

  function tutupModal() {
    setInputNama('');
    setInputId('');
    setModalVisible(false);
  }

  function tambahAlat() {
    if (!inputNama.trim()) {
      Alert.alert('Gagal', 'Nama alat tidak boleh kosong.');
      return;
    }
    if (!inputId.trim()) {
      Alert.alert('Gagal', 'ID alat tidak boleh kosong.');
      return;
    }
    const alatBaru: Alat = {
      id: Date.now().toString(),
      nama: inputNama.trim(),
      idAlat: inputId.trim(),
      status: false,
    };
    setDaftarAlat(prev => [...prev, alatBaru]);
    tutupModal();
  }

  function toggleStatus(item: Alat) {
    if (!item.status) {
      setDaftarAlat(prev =>
        prev.map(a => (a.id === item.id ? { ...a, status: true } : a))
      );
      navigation.navigate('ProcessScreen', {
        namaAlat: item.nama,
        idAlat: item.idAlat,
      });
    } else {
      setDaftarAlat(prev =>
        prev.map(a => (a.id === item.id ? { ...a, status: false } : a))
      );
    }
  }

  function renderItem({ item }: { item: Alat }) {
    return (
      <View style={styles.alatCard}>
        <View style={styles.alatLeft}>
          <View style={[styles.alatIcon, item.status ? styles.alatIconOn : styles.alatIconOff]}>
            <MaterialCommunityIcons
              name="chip"
              size={22}
              color={item.status ? '#2E7D32' : '#888888'}
            />
          </View>
          <View>
            <Text style={styles.alatNama}>{item.nama}</Text>
            <Text style={styles.alatId}>ID: {item.idAlat}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.statusBtn, item.status ? styles.statusOn : styles.statusOff]}
          onPress={() => toggleStatus(item)}
        >
          <Text style={[styles.statusText, item.status ? styles.statusTextOn : styles.statusTextOff]}>
            {item.status ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
      </View>
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
            <MaterialCommunityIcons name="hardware-chip-outline" size={48} color="#CCCCCC" />
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
              style={styles.modalInput}
              placeholder="Contoh: Autoclave A1"
              placeholderTextColor="#AAAAAA"
              value={inputNama}
              onChangeText={setInputNama}
            />

            <Text style={styles.modalLabel}>ID Alat</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Contoh: 12345"
              placeholderTextColor="#AAAAAA"
              value={inputId}
              onChangeText={setInputId}
              keyboardType="default"
            />

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