import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#080C10',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
  },

  // Greeting
  greetingCard: {
    backgroundColor: '#0F1520',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#1E2D42',
  },
  greetingTitle: {
    color: '#F0F4FF',
    fontSize: 20,
    fontWeight: '700',
  },
  greetingSubtitle: {
    color: '#4A5E78',
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
    fontSize: 15,
    fontWeight: '700',
    color: '#F0F4FF',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#003A4D',
    borderWidth: 1,
    borderColor: '#00D4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#00D4FF',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
  },

  // Empty
  emptyWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#4A5E78',
    fontSize: 15,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#1E2D42',
    fontSize: 13,
  },

  // Alat Card
  alatCard: {
    backgroundColor: '#0F1520',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1E2D42',
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
    fontWeight: '700',
    color: '#F0F4FF',
  },
  alatId: {
    fontSize: 12,
    color: '#4A5E78',
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
    backgroundColor: '#0F1520',
    borderRadius: 18,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#1E2D42',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F0F4FF',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4A5E78',
    marginBottom: 6,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#1E2D42',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#F0F4FF',
    marginBottom: 16,
    backgroundColor: '#080C10',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  modalBtnBatal: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E2D42',
    alignItems: 'center',
  },
  modalBtnBatalText: {
    color: '#4A5E78',
    fontWeight: '700',
    fontSize: 14,
  },
  modalBtnTambah: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#003A4D',
    borderWidth: 1,
    borderColor: '#00D4FF',
    alignItems: 'center',
  },
  modalBtnTambahText: {
    color: '#00D4FF',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default styles;