import React, { useEffect, useState } from 'react';
import { View, Text, TouchableWithoutFeedback } from 'react-native';
import styles from '../styles/WelcomeScreen.styles';

export default function WelcomeScreen({ navigation }: any) {
  const [displayText1, setDisplayText1] = useState('');
  const [displayText2, setDisplayText2] = useState('');
  const [showCursor1, setShowCursor1] = useState(true);
  const [showCursor2, setShowCursor2] = useState(false);
  const [skipped, setSkipped] = useState(false);

  const text1 = 'BAGLOG';
  const text2 = 'CARE';
  const typingSpeed = 80; // ms per karakter (lebih cepat)
  const delayBetweenLines = 100; // delay antara baris 1 dan 2
  const delayAfterComplete = 600; // delay setelah animasi selesai (lebih cepat)

  // Fungsi untuk skip animasi
  const handleSkip = () => {
    if (!skipped) {
      setSkipped(true);
      navigation.replace('Dashboard');
    }
  };

  useEffect(() => {
    if (skipped) return; // Jangan jalankan animasi jika sudah skip

    let currentIndex1 = 0;
    let currentIndex2 = 0;
    let timeout1: any;
    let timeout2: any;
    let cursorInterval: any;
    let navigationTimeout: any;

    // Animasi cursor berkedip
    cursorInterval = setInterval(() => {
      if (currentIndex1 < text1.length) {
        setShowCursor1(prev => !prev);
      } else if (currentIndex2 < text2.length) {
        setShowCursor1(false);
        setShowCursor2(prev => !prev);
      } else {
        setShowCursor2(false);
      }
    }, 500);

    // Typing animasi untuk baris pertama (BAGLOG)
    const typeText1 = () => {
      if (currentIndex1 < text1.length) {
        setDisplayText1(text1.substring(0, currentIndex1 + 1));
        currentIndex1++;
        timeout1 = setTimeout(typeText1, typingSpeed);
      } else {
        // Selesai baris 1, mulai baris 2 setelah delay
        setShowCursor1(false);
        timeout2 = setTimeout(typeText2, delayBetweenLines);
      }
    };

    // Typing animasi untuk baris kedua (CARE)
    const typeText2 = () => {
      if (currentIndex2 < text2.length) {
        setDisplayText2(text2.substring(0, currentIndex2 + 1));
        currentIndex2++;
        timeout2 = setTimeout(typeText2, typingSpeed);
      } else {
        // Selesai semua, tunggu sebentar lalu navigate
        setShowCursor2(false);
        navigationTimeout = setTimeout(() => {
          navigation.replace('Dashboard');
        }, delayAfterComplete);
      }
    };

    // Mulai animasi
    typeText1();

    // Cleanup
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(navigationTimeout);
      clearInterval(cursorInterval);
    };
  }, [navigation, skipped]);

  return (
    <TouchableWithoutFeedback onPress={handleSkip}>
      <View style={styles.container}>
        <Brand 
          text1={displayText1} 
          text2={displayText2}
          showCursor1={showCursor1}
          showCursor2={showCursor2}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

function Brand({ 
  text1, 
  text2, 
  showCursor1, 
  showCursor2 
}: { 
  text1: string; 
  text2: string;
  showCursor1: boolean;
  showCursor2: boolean;
}) {
  return (
    <View style={styles.brandWrapper}>
      <View style={{ flexDirection: 'row' }}>
        <Text style={styles.brandText}>{text1}</Text>
        {showCursor1 && <Text style={[styles.brandText, styles.cursor]}>|</Text>}
      </View>
      <View style={{ flexDirection: 'row' }}>
        <Text style={styles.brandText}>{text2}</Text>
        {showCursor2 && <Text style={[styles.brandText, styles.cursor]}>|</Text>}
      </View>
    </View>
  );
}