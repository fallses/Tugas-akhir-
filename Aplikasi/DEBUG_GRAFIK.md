# Debug Grafik Riwayat

## 🔍 Cara Debug

### 1. Jalankan Aplikasi dengan Metro Bundler

```bash
cd Front-end
npm start
```

Buka terminal terpisah dan jalankan:
```bash
npx react-native run-android
```

### 2. Buka React Native Debugger / Console

**Opsi A: Chrome DevTools**
- Shake device/emulator
- Tap "Debug"
- Buka Chrome: chrome://inspect
- Pilih aplikasi Anda

**Opsi B: Metro Bundler**
- Console log akan muncul di terminal Metro Bundler
- Tekan `j` untuk buka debugger

**Opsi C: React Native Debugger (Recommended)**
```bash
npm install -g react-native-debugger
react-native-debugger
```

### 3. Test Grafik Riwayat

1. Buka aplikasi
2. Navigasi ke "Riwayat Sterilisasi"
3. Tap pada salah satu riwayat untuk membuka detail
4. Perhatikan console logs

### 4. Expected Console Logs

#### Saat Load History (dari Backend)

```
[HistoryScreen] Mapping entry 6a375f6688ba485a52dbad85: batch_id = AUTOCLAVE-01-2805980-1062
[HistoryScreen] Mapping entry 6a375f6689ba485a52dbad86: batch_id = null
```

#### Saat Tap Riwayat (Open Modal)

```
[HistoryScreen] loadChartData called for entry: {
  id: "6a375f6688ba485a52dbad85",
  namaAlat: "Ssss",
  batch_id: "AUTOCLAVE-01-2805980-1062",
  hasBatchId: true
}
```

#### Jika Ada batch_id (EXPECTED)

```
[HistoryScreen] 🔍 Mengambil data running untuk batch_id: AUTOCLAVE-01-2805980-1062
[HistoryScreen] 📦 Response status: success, data count: 2
[HistoryScreen] ✅ Data running ditemukan: 2 data points
[HistoryScreen] 📊 Sample data: [
  {
    "_id": "6a375f6688ba485a52dbad85",
    "action": "running",
    "suhu": 0,
    "tekanan": 0,
    "timer": "00:28:06",
    "device": "AUTOCLAVE-01",
    "batch_id": "AUTOCLAVE-01-2805980-1062",
    "createdAt": "2026-06-21T03:49:58.536Z"
  },
  {
    "_id": "6a375f680cbf64e4c943571f",
    "action": "running",
    "suhu": 988.8,
    "tekanan": 0,
    "timer": "00:28:04",
    "device": "AUTOCLAVE-01",
    "batch_id": "AUTOCLAVE-01-2805980-1062",
    "createdAt": "2026-06-21T03:49:59.537Z"
  }
]
[HistoryScreen] 🌡️ Suhu data: [0, 988.8]
[HistoryScreen] 💨 Tekanan data: [0, 0]
[HistoryScreen] ✅ Chart data berhasil diload: {
  suhuPoints: 2,
  tekananPoints: 2,
  labelCount: 2
}
```

#### Jika Tidak Ada batch_id

```
[HistoryScreen] ❌ Tidak ada batch_id, gunakan data simulasi
```

### 5. Troubleshooting Berdasarkan Log

#### CASE 1: Log tidak muncul sama sekali

**Problem**: Fungsi `loadChartData` tidak dipanggil

**Solusi**:
1. Pastikan aplikasi sudah di-rebuild setelah perubahan code:
   ```bash
   cd android && ./gradlew clean
   cd ..
   npx react-native run-android
   ```

2. Pastikan hot reload aktif (save file untuk trigger reload)

#### CASE 2: Log muncul "batch_id = null"

**Problem**: Backend tidak mengirim batch_id di response history

**Cek Backend**:
```bash
# Test API langsung
curl http://localhost:5000/sterilisasi/history

# Output harus ada field batch_id
{
  "status": "success",
  "data": [
    {
      "_id": "...",
      "batch_id": "AUTOCLAVE-01-2805980-1062",  // ← Harus ada!
      ...
    }
  ]
}
```

**Solusi**:
- Pastikan backend sudah di-restart setelah update model
- Cek database apakah field batch_id ada di collection `finishes`

#### CASE 3: Log "hasBatchId: false" meskipun ada di database

**Problem**: Data tidak ter-mapping dengan benar

**Solusi**:
1. Cek type definition di `backendService.ts`:
   ```typescript
   export interface HistoryData {
     // ...
     batch_id?: string | null; // Harus ada!
   }
   ```

2. Cek mapping di `convertHistoryDataToEntry`:
   ```typescript
   batch_id: item.batch_id ?? null
   ```

#### CASE 4: Log "Response status: success, data count: 0"

**Problem**: Endpoint `/sterilisasi/running/batch/:batch_id` tidak return data

**Cek Database**:
```javascript
// MongoDB query
db.runnings.find({ batch_id: "AUTOCLAVE-01-2805980-1062" })

// Harus return array dengan data
```

**Solusi**:
- Pastikan data running di database memiliki field `batch_id`
- Pastikan batch_id di `finishes` sama dengan di `runnings`
- Restart backend

#### CASE 5: Data berhasil di-fetch tapi grafik masih simulasi

**Problem**: ChartData tidak di-apply ke grafik

**Cek**:
1. Log harus menunjukkan: `✅ Chart data berhasil diload`
2. Grafik harus render dengan data dari `chartData` state

**Solusi**:
- Pastikan conditional di render grafik:
  ```typescript
  data: chartData 
    ? chartData.suhuData  // ← Gunakan data real
    : [0, 30, 60, ...]    // ← Simulasi (fallback)
  ```

- Force refresh component:
  1. Close modal
  2. Open lagi
  3. Check log apakah data di-fetch ulang

### 6. Manual Test Backend

Test endpoint langsung untuk memastikan backend bekerja:

```bash
# 1. Get history (harus ada batch_id)
curl http://localhost:5000/sterilisasi/history | json_pp

# 2. Get running by batch_id
curl http://localhost:5000/sterilisasi/running/batch/AUTOCLAVE-01-2805980-1062 | json_pp

# Expected output:
{
  "status": "success",
  "count": 2,
  "data": [
    {
      "_id": "...",
      "action": "running",
      "suhu": 988.8,
      "tekanan": 0,
      "timer": "00:28:04",
      "batch_id": "AUTOCLAVE-01-2805980-1062",
      "createdAt": "..."
    }
  ]
}
```

### 7. Force Clean & Rebuild

Jika semua gagal, lakukan clean build:

```bash
# 1. Stop Metro Bundler (Ctrl+C)

# 2. Clear cache
cd Front-end
rm -rf node_modules
npm install

# 3. Clear React Native cache
npx react-native start --reset-cache

# 4. Clean Android build (di terminal baru)
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### 8. Check Points

✅ **Backend**
- [ ] Model memiliki field `batch_id`
- [ ] Endpoint `/sterilisasi/history` return `batch_id`
- [ ] Endpoint `/sterilisasi/running/batch/:id` tersedia
- [ ] Database `runnings` memiliki data dengan `batch_id`

✅ **Frontend**
- [ ] `HistoryData` interface memiliki field `batch_id`
- [ ] `HistoryEntry` interface memiliki field `batch_id`
- [ ] `convertHistoryDataToEntry` mapping `batch_id`
- [ ] `loadChartData` dipanggil saat modal dibuka
- [ ] `fetchRunningByBatchId` function tersedia

✅ **Application**
- [ ] App di-rebuild setelah perubahan code
- [ ] Metro Bundler running
- [ ] Console logs muncul
- [ ] Tidak ada error di console

## 📝 Report Bug

Jika masih tidak bekerja, kirim screenshot dengan:

1. **Console logs** saat tap riwayat
2. **Backend response** dari API `/sterilisasi/history`
3. **Database data** dari collection `runnings` dengan batch_id yang sama
4. **Tampilan grafik** yang muncul di aplikasi

---

**Good luck debugging!** 🚀
