import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Greeting
  greetingCard: {
    backgroundColor: '#111127',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 0.5,
    borderColor: '#2A2A4A',
  },
  greetingTitle: {
    color: '#E0E0FF',
    fontSize: 20,
    fontWeight: '500',
  },
  greetingSubtitle: {
    color: '#6666AA',
    fontSize: 13,
    marginTop: 4,
  },

  // List Header
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#C0C0E0',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 229, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#00E5FF',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '400',
  },

  // Empty
  emptyWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#555580',
    fontSize: 15,
    fontWeight: '500',
  },
  emptySubtext: {
    color: '#333355',
    fontSize: 13,
  },

  // Alat Card
  alatCard: {
    backgroundColor: '#111127',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0.5,
    borderColor: '#2A2A4A',
  },
  alatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  alatIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alatIconOn: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  alatIconOff: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  alatNama: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E0E0FF',
  },
  alatId: {
    fontSize: 12,
    color: '#555580',
    marginTop: 2,
  },

  // Status Button
  statusBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 56,
    alignItems: 'center',
  },
  statusOn: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 229, 255, 0.4)',
  },
  statusOff: {
    backgroundColor: '#0A0A1A',
    borderWidth: 0.5,
    borderColor: '#2A2A4A',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  statusTextOn: {
    color: '#00E5FF',
  },
  statusTextOff: {
    color: '#555580',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#111127',
    borderRadius: 18,
    padding: 24,
    width: '100%',
    borderWidth: 0.5,
    borderColor: '#2A2A4A',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#E0E0FF',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#555580',
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  modalInput: {
    borderWidth: 0.5,
    borderColor: '#2A2A4A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#C0C0E0',
    marginBottom: 16,
    backgroundColor: '#0A0A1A',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  modalBtnBatal: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#2A2A4A',
    alignItems: 'center',
  },
  modalBtnBatalText: {
    color: '#555580',
    fontWeight: '500',
    fontSize: 14,
  },
  modalBtnTambah: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 229, 255, 0.4)',
    alignItems: 'center',
  },
  modalBtnTambahText: {
    color: '#00E5FF',
    fontWeight: '500',
    fontSize: 14,
  },
});

export default styles;