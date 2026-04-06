import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import styles from '../styles/WelcomeScreen.styles';

export default function WelcomeScreen({ navigation }: any) {
  useEffect(() => {
    navigation.replace('Dashboard');
  }, []);

  return (
    <View style={styles.container}>
      <Brand />
    </View>
  );
}

function Brand() {
  return (
    <View style={styles.brandWrapper}>
      <Text style={styles.brandText}>BAGLOG</Text>
      <Text style={styles.brandText}>CARE</Text>
    </View>
  );
}