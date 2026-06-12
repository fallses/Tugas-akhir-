/**
 * notificationService.ts
 * 
 * Service untuk mengelola notifikasi progress sterilisasi
 */

import notifee, { AndroidStyle, AndroidImportance } from '@notifee/react-native';

const CHANNEL_ID = 'sterilisasi-progress';
const NOTIFICATION_ID = 'sterilisasi-running';

/**
 * Setup notification channel (hanya untuk Android)
 */
export async function createNotificationChannel() {
  console.log('[NotificationService] Creating notification channel...');
  try {
    const channelId = await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Proses Sterilisasi',
      importance: AndroidImportance.LOW, // LOW = tidak ada suara/getaran
      description: 'Notifikasi progress sterilisasi',
    });
    console.log('[NotificationService] Channel created:', channelId);
    return channelId;
  } catch (error) {
    console.error('[NotificationService] Failed to create channel:', error);
    throw error;
  }
}

/**
 * Tampilkan notifikasi progress sterilisasi
 */
export async function showSterilisasiProgress(
  namaAlat: string,
  remainingTime: string,
  progress: number,
  suhu?: number | null,
  tekanan?: number | null
) {
  console.log('[NotificationService] Showing progress notification:', {
    namaAlat,
    remainingTime,
    progress: Math.round(progress * 100),
    suhu,
    tekanan,
  });

  try {
    const progressPct = Math.round(progress * 100);
    
    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title: 'RUNNING',
      body: `${namaAlat}\n${remainingTime}`,
      android: {
        channelId: CHANNEL_ID,
        importance: AndroidImportance.LOW,
        ongoing: true,
        autoCancel: false, // Jangan auto-dismiss saat di-tap
        onlyAlertOnce: true,
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        style: {
          type: AndroidStyle.BIGTEXT,
          text: [
            namaAlat,
            `⏱️ ${remainingTime}`,
            `📊 ${progressPct}%`,
            suhu != null ? `🌡️ ${suhu}°C` : null,
            tekanan != null ? `⚙️ ${tekanan} bar` : null,
          ]
            .filter(Boolean)
            .join(' • '),
        },
        smallIcon: 'ic_launcher',
        color: '#4ECDC4',
      },
      ios: {
        subtitle: namaAlat,
        body: `${remainingTime} • ${progressPct}%`,
      },
    });
    console.log('[NotificationService] Progress notification displayed successfully');
  } catch (error) {
    console.error('[NotificationService] Failed to show progress notification:', error);
    throw error;
  }
}

/**
 * Tampilkan notifikasi countdown
 */
export async function showCountdownNotification(
  namaAlat: string,
  countValue: number
) {
  console.log('[NotificationService] Showing countdown notification:', countValue);
  try {
    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title: 'COUNTDOWN',
      body: `${namaAlat}\nMemulai dalam ${countValue}...`,
      android: {
        channelId: CHANNEL_ID,
        importance: AndroidImportance.LOW,
        ongoing: true,
        autoCancel: false, // Jangan auto-dismiss saat di-tap
        onlyAlertOnce: true,
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        style: {
          type: AndroidStyle.BIGTEXT,
          text: `${namaAlat}\nMemulai dalam ${countValue} detik...`,
        },
        smallIcon: 'ic_launcher',
        color: '#4ECDC4',
      },
      ios: {
        subtitle: namaAlat,
        body: `Memulai dalam ${countValue}...`,
      },
    });
  } catch (error) {
    console.error('[NotificationService] Failed to show countdown notification:', error);
  }
}

/**
 * Tampilkan notifikasi ignition
 */
export async function showIgnitionNotification(
  namaAlat: string,
  session: number,
  maxSessions: number
) {
  console.log('[NotificationService] Showing ignition notification:', session);
  try {
    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title: 'IGNITION',
      body: `${namaAlat}\nMenghubungkan... (${session}/${maxSessions})`,
      android: {
        channelId: CHANNEL_ID,
        importance: AndroidImportance.LOW,
        ongoing: true,
        autoCancel: false, // Jangan auto-dismiss saat di-tap
        onlyAlertOnce: true,
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        style: {
          type: AndroidStyle.BIGTEXT,
          text: `${namaAlat}\nMenghubungkan ke perangkat...\nPercobaan ${session} dari ${maxSessions}`,
        },
        smallIcon: 'ic_launcher',
        color: '#FF6B6B', // Warna fire/ignition
      },
      ios: {
        subtitle: namaAlat,
        body: `Menghubungkan... (${session}/${maxSessions})`,
      },
    });
  } catch (error) {
    console.error('[NotificationService] Failed to show ignition notification:', error);
  }
}

/**
 * Tampilkan notifikasi selesai
 */
export async function showSterilisasiComplete(
  namaAlat: string,
  status: 'Berhasil' | 'Dihentikan'
) {
  await notifee.displayNotification({
    id: NOTIFICATION_ID,
    title: status === 'Berhasil' ? '✅ Sterilisasi Selesai' : '⚠️ Sterilisasi Dihentikan',
    body: `${namaAlat} - Proses ${status.toLowerCase()}`,
    android: {
      channelId: CHANNEL_ID,
      importance: AndroidImportance.HIGH, // HIGH = ada suara/getaran
      smallIcon: 'ic_launcher',
      color: status === 'Berhasil' ? '#4ECDC4' : '#FF6B6B',
    },
  });
}

/**
 * Hapus notifikasi progress
 */
export async function clearSterilisasiNotification() {
  await notifee.cancelNotification(NOTIFICATION_ID);
}

/**
 * Request permission untuk notifikasi (iOS only)
 */
export async function requestNotificationPermission() {
  console.log('[NotificationService] Requesting notification permission...');
  try {
    const settings = await notifee.requestPermission();
    console.log('[NotificationService] Permission result:', JSON.stringify(settings));
    const granted = settings.authorizationStatus >= 1; // 1 = authorized, 2 = provisional
    console.log('[NotificationService] Permission granted:', granted);
    
    if (!granted) {
      console.warn('[NotificationService] ⚠️ Notification permission NOT granted!');
    }
    
    return granted;
  } catch (error) {
    console.error('[NotificationService] Failed to request permission:', error);
    return false;
  }
}
