# Collection Histories - Solusi Grafik Riwayat

## 🎯 Tujuan

Membuat collection baru `histories` yang menyimpan **semua data proses** (set, running, finish) dalam **satu document** berdasarkan `batch_id`. Ini mempermudah pengambilan data untuk grafik dan mengatasi masalah data duplikat.

## 📦 Struktur Database

### Collection: `histories`

```javascript
{
  _id: ObjectId("..."),
  batch_id: "AUTOCLAVE-01-2314196-2944", // Unique, indexed
  device: "AUTOCLAVE-01",
  namaAlat: "Autoclave Ssss",
  
  // Data dari SET (awal proses)
  set: {
    suhu: 120,
    tekanan: 1,
    waktu: "00:01",
    startedAt: ISODate("2026-06-21T12:43:19.000Z")
  },
  
  // Data RUNNING (array untuk grafik)
  runningData: [
    {
      suhu: 0,
      tekanan: 0,
      timer: "00:00:01",
      timestamp: ISODate("2026-06-21T12:43:20.000Z")
    },
    {
      suhu: 45.2,
      tekanan: 0.3,
      timer: "00:00:30",
      timestamp: ISODate("2026-06-21T12:43:49.000Z")
    },
    {
      suhu: 988.8,
      tekanan: 0,
      timer: "00:01:00",
      timestamp: ISODate("2026-06-21T12:44:19.000Z")
    }
  ],
  
  // Data FINISH
  finish: {
    action: "finish", // atau "stop"
    suhu: 988.8,
    tekanan: 0,
    finishedAt: ISODate("2026-06-21T12:44:19.000Z")
  },
  
  status: "completed", // "running", "completed", "stopped"
  notes: "",
  createdAt: ISODate("2026-06-21T12:43:19.000Z"),
  updatedAt: ISODate("2026-06-21T12:44:19.000Z")
}
```

## 🔄 Alur Kerja

### 1. Start Proses (Topic: sterilisasi/set)

**MQTT Message dari Frontend:**
```json
{
  "action": "start",
  "suhu": 120,
  "tekanan": 1,
  "waktu": "00:01",
  "Device": "AUTOCLAVE-01",
  "namaAlat": "Autoclave Ssss",
  "batch_id": "AUTOCLAVE-01-2314196-2944"
}
```

**Backend Action:**
1. Simpan ke collection `sets` (untuk backup)
2. **CREATE** document baru di collection `histories`:
   ```javascript
   {
     batch_id: "AUTOCLAVE-01-2314196-2944",
     device: "AUTOCLAVE-01",
     namaAlat: "Autoclave Ssss",
     set: { suhu: 120, tekanan: 1, waktu: "00:01", startedAt: new Date() },
     runningData: [],
     status: "running"
   }
   ```

**Log:**
```
[sterilisasi/set] Disimpan ke collection Set
[History] ✅ Created: batch_id=AUTOCLAVE-01-2314196-2944
```

### 2. Running Updates (Topic: sterilisasi/running)

**MQTT Message dari Alat (setiap interval):**
```json
{
  "action": "running",
  "suhu": 45.2,
  "tekanan": 0.3,
  "timer": "00:00:30",
  "Device": "AUTOCLAVE-01",
  "batch_id": "AUTOCLAVE-01-2314196-2944"
}
```

**Backend Action:**
1. Simpan ke collection `runnings` (untuk backup)
2. **PUSH** data ke array `runningData` di collection `histories`:
   ```javascript
   $push: {
     runningData: {
       suhu: 45.2,
       tekanan: 0.3,
       timer: "00:00:30",
       timestamp: new Date()
     }
   }
   ```

**Log:**
```
[sterilisasi/running] Disimpan: action=running
[History] ✅ Running data added: batch_id=AUTOCLAVE-01-2314196-2944, total=15
```

### 3. Finish Proses (Topic: sterilisasi/finish)

**MQTT Message dari Alat:**
```json
{
  "action": "finish",
  "suhu": 988.8,
  "tekanan": 0,
  "Device": "AUTOCLAVE-01",
  "batch_id": "AUTOCLAVE-01-2314196-2944"
}
```

**Backend Action:**
1. Simpan ke collection `finishes` (untuk backup)
2. **UPDATE** document di collection `histories`:
   ```javascript
   $set: {
     finish: {
       action: "finish",
       suhu: 988.8,
       tekanan: 0,
       finishedAt: new Date()
     },
     status: "completed",
     updatedAt: new Date()
   }
   ```

**Log:**
```
[sterilisasi/finish] Disimpan ke collection Finish
[History] ✅ Finished: batch_id=AUTOCLAVE-01-2314196-2944, status=completed
```

## 🌐 API Endpoints

### 1. GET /sterilisasi/histories

**Description:** Ambil daftar semua histories (untuk list riwayat)

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "_id": "6a3779f7c836bb13d0a92fd5",
      "batch_id": "AUTOCLAVE-01-2314196-2944",
      "device": "AUTOCLAVE-01",
      "namaAlat": "Autoclave Ssss",
      "suhu": 120,
      "tekanan": 1,
      "waktu": "00:01",
      "status": "completed",
      "action": "finish",
      "createdAt": "2026-06-21T12:43:19.000Z",
      "notes": "",
      "runningDataCount": 32
    }
  ]
}
```

### 2. GET /sterilisasi/histories/:batch_id

**Description:** Ambil detail history lengkap dengan runningData (untuk grafik)

**Example:** `GET /sterilisasi/histories/AUTOCLAVE-01-2314196-2944`

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "6a3779f7c836bb13d0a92fd5",
    "batch_id": "AUTOCLAVE-01-2314196-2944",
    "device": "AUTOCLAVE-01",
    "namaAlat": "Autoclave Ssss",
    "set": {
      "suhu": 120,
      "tekanan": 1,
      "waktu": "00:01",
      "startedAt": "2026-06-21T12:43:19.000Z"
    },
    "runningData": [
      {
        "suhu": 0,
        "tekanan": 0,
        "timer": "00:00:01",
        "timestamp": "2026-06-21T12:43:20.000Z"
      },
      {
        "suhu": 45.2,
        "tekanan": 0.3,
        "timer": "00:00:30",
        "timestamp": "2026-06-21T12:43:49.000Z"
      }
      // ... 30 more data points
    ],
    "finish": {
      "action": "finish",
      "suhu": 988.8,
      "tekanan": 0,
      "finishedAt": "2026-06-21T12:44:19.000Z"
    },
    "status": "completed",
    "notes": "",
    "createdAt": "2026-06-21T12:43:19.000Z",
    "updatedAt": "2026-06-21T12:44:19.000Z"
  }
}
```

## 📱 Frontend Implementation

### 1. Fetch List Riwayat

```typescript
import { fetchHistories } from '../services/backendService';

const histories = await fetchHistories();
// histories.data berisi array dengan semua history yang ada batch_id
```

### 2. Fetch Detail untuk Grafik

```typescript
import { fetchHistoryDetail } from '../services/backendService';

const detail = await fetchHistoryDetail(batch_id);
// detail.data.runningData berisi array data untuk grafik
```

### 3. Render Grafik

```typescript
const suhuData = detail.data.runningData.map(item => item.suhu);
const tekananData = detail.data.runningData.map(item => item.tekanan);
const labels = detail.data.runningData.map(item => item.timer);

// Render dengan react-native-chart-kit
<LineChart
  data={{
    labels: labels,
    datasets: [
      { data: suhuData, color: () => COLORS.fire },
      { data: tekananData, color: () => COLORS.accent }
    ]
  }}
  // ... config
/>
```

## ✅ Keuntungan

### 1. **Satu Document = Satu Proses**
- Semua data terkait proses ada di satu tempat
- Tidak perlu JOIN atau query kompleks
- Mudah untuk backup/export

### 2. **Tidak Ada Duplikat**
- Hanya data dengan `batch_id` yang disimpan
- Anti-loop mechanism mencegah data dari backend sendiri
- Data bersih dan akurat

### 3. **Grafik Real-Time yang Akurat**
- `runningData` array menyimpan semua data point
- Tidak ada interpolasi atau simulasi
- Data sesuai yang dikirim alat

### 4. **Backward Compatible**
- Collection lama (`sets`, `runnings`, `finishes`) tetap ada
- Endpoint lama (`/sterilisasi/history`) masih berfungsi
- Migrasi bertahap tanpa breaking changes

## 🚀 Deploy & Test

### 1. **Restart Backend**

```bash
cd Back-end
# Stop dengan Ctrl+C
node server.js
```

### 2. **Test dengan Alat**

Jalankan proses dari alat dengan batch_id:

```cpp
// ESP32 code
String batch_id = String(DEVICE_ID) + "-" + String(millis());

// Kirim di setiap message
payload["batch_id"] = batch_id;
```

### 3. **Verify Database**

```javascript
// MongoDB query
db.histories.find().sort({ createdAt: -1 }).limit(5)

// Harus muncul document dengan:
// - batch_id ada
// - runningData array terisi
// - finish object ada (setelah proses selesai)
```

### 4. **Rebuild Frontend**

```bash
cd Front-end
npx react-native run-android
```

### 5. **Test Aplikasi**

1. Buka Riwayat
2. Tap salah satu entry
3. Grafik harus muncul dengan data real!

## 📊 Expected Result

### Console Log (Frontend):
```
[HistoryScreen] 🔍 Fetching histories from API...
[HistoryScreen] ✅ Received 26 histories
[HistoryScreen] ✅ Loaded 26 entries
[HistoryScreen] Mapping entry ...: batch_id = AUTOCLAVE-01-2314196-2944

[Tap riwayat]

[HistoryScreen] loadChartData called for entry: {batch_id: "...", hasBatchId: true}
[HistoryScreen] 🔍 Mengambil detail history untuk batch_id: ...
[HistoryScreen] ✅ Data running ditemukan: 32 data points
[HistoryScreen] 🌡️ Suhu data: [0, 45.2, 67.8, 88.9, 988.8]
[HistoryScreen] ✅ Chart data berhasil diload
```

### Tampilan Aplikasi:
- ✅ Grafik muncul dengan garis suhu (oranye) dan tekanan (biru)
- ✅ Label menunjukkan timer real dari proses
- ✅ Footer menunjukkan: "✓ Grafik real dari database (32 data points)"

---

**Status:** ✅ Ready to Deploy  
**Version:** 2.0.0  
**Last Updated:** 2026-06-21
