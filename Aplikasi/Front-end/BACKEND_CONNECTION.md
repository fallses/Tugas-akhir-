# Koneksi Frontend ke Backend

## Backend Production URL

Backend sudah di-deploy di Railway:
```
https://backend-sterilisasi.com
```

## Konfigurasi

File yang sudah diupdate:
- ✅ `src/config.ts` - BACKEND_URL diset ke production
- ✅ `.env` - BACKEND_URL diset ke production

## Testing Koneksi

### 1. Test dari Browser/Postman

```bash
# Test root endpoint
curl https://backend-sterilisasi.com/

# Test API endpoint
curl https://backend-sterilisasi.com/sterilisasi/running/last
```

### 2. Test dari Aplikasi

1. Rebuild aplikasi React Native:
   ```bash
   # Stop Metro bundler (Ctrl+C)
   
   # Clear cache
   npx react-native start --reset-cache
   
   # Di terminal lain, run aplikasi
   npx react-native run-android
   # atau
   npx react-native run-ios
   ```

2. Buka aplikasi dan coba fitur yang menggunakan backend:
   - Dashboard → pilih alat → Set parameters → Mulai Proses
   - History → lihat riwayat dari database

## Switching Environment

### Development (Local Backend)

Edit `src/config.ts`:
```typescript
export const BACKEND_URL = 'http://10.0.2.2:5000'; // Android Emulator
// atau
export const BACKEND_URL = 'http://192.168.1.155:5000'; // Device fisik
```

### Production (Railway)

Edit `src/config.ts`:
```typescript
export const BACKEND_URL = 'https://backend-sterilisasi.com';
```

**PENTING:** Setelah mengubah config, restart Metro bundler dengan `--reset-cache`

## Troubleshooting

### Error: Network request failed

1. **Cek koneksi internet** - Pastikan device/emulator terkoneksi internet
2. **Cek URL backend** - Pastikan `https://backend-sterilisasi.com` bisa diakses dari browser
3. **Cek CORS** - Backend sudah menggunakan CORS, seharusnya tidak ada masalah
4. **Clear cache** - Restart Metro bundler dengan `--reset-cache`

### Error: 404 Not Found

1. **Cek endpoint** - Pastikan endpoint yang dipanggil benar
2. **Cek backend logs** - Lihat logs di Railway dashboard
3. **Test dengan curl** - Test endpoint dari terminal/Postman

### Data tidak muncul

1. **Cek database** - Pastikan MongoDB Atlas terkoneksi
2. **Cek MQTT** - Pastikan alat bisa kirim data ke MQTT broker
3. **Cek logs** - Lihat logs di Railway untuk error

## Monitoring Backend

1. Buka Railway dashboard: https://railway.app
2. Pilih project `backend-sterilisasi`
3. Tab "Logs" - Lihat real-time logs
4. Tab "Metrics" - Lihat usage (CPU, RAM, Network)
5. Tab "Deployments" - Lihat history deployment

## Update Backend

Jika ada perubahan di backend:

```bash
cd Back-end
git add .
git commit -m "Update: deskripsi perubahan"
git push
```

Railway akan otomatis re-deploy dalam beberapa menit.
