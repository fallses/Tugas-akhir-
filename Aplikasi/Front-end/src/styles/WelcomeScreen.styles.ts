import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandWrapper: {
    alignItems: 'center',
    marginBottom: height * 0.06,
  },
  brandText: {
    fontSize: 56,
    fontWeight: '900',
    color: '#00D4FF',
    letterSpacing: 6,
    lineHeight: 64,
    textTransform: 'uppercase',
    fontFamily: 'Orbitron-Black',
  },
  cursor: {
    marginLeft: 4,
    opacity: 1,
  },
  btnWrapper: {
    alignItems: 'center',
    gap: 12,
  },
  btn: {
    backgroundColor: '#1A1A1A',
    width: width * 0.58,
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});