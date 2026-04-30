# Ringkasan Perubahan Backend

## 📋 Daftar Perubahan

Backend telah disesuaikan agar **100% kompatibel** dengan format pengiriman dan penerimaan dari alat ESP32 Autoclave.

---

## 🔄 Perubahan Format Data

### 1. Format Waktu
**Sebelum:** Tidak konsisten (bisa number atau string)  
**Sekarang:**
- **SET/FINISH:** Format `"HH:MM"` (contoh: `"00:30"` = 30 menit)
- **RUNNING:** Format `"HH:MM:SS"` (contoh: `"00:29:45"` = 29 menit 45 detik)

**Fitur Baru:**
- Backend otomatis konversi jika frontend mengirim waktu dalam menit (number)
- Contoh: `waktu: 90` → otomatis jadi `"01:30"`

---

### 2. Field Device
**Sebelum:** Tidak konsisten antara `device` dan `Device`  
**Sekarang:**
- Frontend kirim: `device` (huruf kecil)
- Backend otomatis konversi ke `Device` (huruf besar D) saat publish ke MQTT
- Sesuai dengan format yang diharapkan alat ESP32

---

### 3. Topik MQTT

#### Perintah START
- **Topik:** `sterilisasi/set`
- **Arah:** Backend → Alat
- **Format:**
  ```json
  {
    "action": "start",
    "suhu": 120,
    "tekanan": 1.0,
    "waktu": "00:30",
    "Device": "AUTOCLAVE-01"
  }
  ```

#### Perintah STOP
- **Topik:** `sterilisasi/running` ✨ **BARU**
- **Arah:** Backend → Alat
- **Format:**
  ```json
  {
    "action": "stop",
    "Device": "AUTOCLAVE-01"
  }
  ```

#### Konfirmasi START
- **Topik:** `sterilisasi/set`
- **Arah:** Alat → Backend
- **Format:** Sama dengan perintah START

#### Status Proses
- **Topik:** `sterilisasi/running`
- **Arah:** Alat → Backend
- **Action yang didukung:**
  - `countdown` - Countdown dimulai
  - `ignition` - Proses penyalaan api
  - `running` - Proses sterilisasi berjalan
  - `stop` - Proses dihentikan
  - `ignition_failed` - Gagal menyalakan api ✨ **BARU**

#### Proses Selesai
- **Topik:** `sterilisasi/finish`
- **Arah:** Alat → Backend
- **Format:**
  ```json
  {
    "action": "finish",
    "suhu": 120.5,
    "tekanan": 1.2,
    "waktu": "00:30",
    "Device": "AUTOCLAVE-01"
  }
  ```

---

## 🆕 Fitur Baru

### 1. Endpoint STOP
**Endpoint:** `POST /sterilisasi/stop`

**Request:**
```json
{
  "device": "AUTOCLAVE-01"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Perintah STOP berhasil dikirim ke alat",
  "data": {
    "action": "stop",
    "Device": "AUTOCLAVE-01"
  }
}
```

---

### 2. Fungsi `publishStop()`
Fungsi baru di `mqtt/mqttClient.js` untuk mengirim perintah STOP ke alat.

**Penggunaan:**
```javascript
const mqttClient = require("./mqtt/mqttClient");

await mqttClient.publishStop({
  action: "stop",
  Device: "AUTOCLAVE-01"
});
```

---

### 3. Support Action Baru
Backend sekarang mendukung action tambahan dari alat:
- `ignition_failed` - Notifikasi gagal menyalakan api setelah 3 percobaan
- `stop` - Konfirmasi proses dihentikan

---

## 📊 Perubahan Database Schema

### Collection: `runnings`
**Field Baru:**
- `timer` (String) - Format "HH:MM:SS" untuk countdown
- `percobaan` (Number) - Jumlah percobaan untuk action "ignition_failed"

**Field Dihapus:**
- `waktu` - Diganti dengan `timer` untuk lebih spesifik

---

### Collection: `finishes`
**Field Baru:**
- `action` (String) - Default: "finish"

**Field Diubah:**
- `waktu` - Sekarang selalu String dengan format "HH:MM"

---

## 📁 File Baru

### 1. `API_FORMAT.md`
Dokumentasi lengkap format API dan MQTT, termasuk:
- Format pengiriman dan penerimaan
- Contoh payload untuk setiap action
- Penjelasan format waktu
- Contoh testing dengan cURL

### 2. `README.md`
Panduan lengkap untuk menjalankan backend:
- Instalasi dan konfigurasi
- Struktur folder
- Daftar endpoint API
- Troubleshooting

### 3. `test-mqtt.js`
Tool untuk testing MQTT secara interaktif:
- Subscribe ke semua topik sterilisasi
- Fungsi helper untuk publish perintah
- Simulasi data dari alat (untuk testing tanpa alat fisik)

**Cara pakai:**
```bash
npm run test:mqtt
```

Kemudian di console:
```javascript
> publishStart(120, 1.0, "00:30")
> publishStop()
> simulateRunning(121.5, 1.3, "00:28:15")
```

### 4. `api-examples.http`
Contoh request API untuk REST Client (VS Code) atau Postman:
- Semua endpoint dengan contoh request
- Contoh response
- Mudah untuk copy-paste

### 5. `PERUBAHAN.md`
File ini - ringkasan semua perubahan dalam bahasa Indonesia.

---

## 🔧 Perubahan File Existing

### 1. `mqtt/mqttClient.js`
- ✅ Update dokumentasi topik MQTT
- ✅ Tambah konstanta untuk topik publish/subscribe
- ✅ Update handler untuk topik `sterilisasi/set`
- ✅ Update handler untuk topik `sterilisasi/running`
- ✅ Update handler untuk topik `sterilisasi/finish`
- ✅ Tambah fungsi `publishStop()`
- ✅ Support action baru: `ignition_failed`, `stop`
- ✅ Update field `timer` untuk action "running"

### 2. `routes/sterilisasi.js`
- ✅ Update endpoint `POST /sterilisasi/set`
  - Konversi otomatis waktu dari number ke "HH:MM"
  - Response sekarang include `data` yang dikirim ke MQTT
- ✅ Tambah endpoint `POST /sterilisasi/stop` (BARU)

### 3. `models/sterilisasi.js`
- ✅ Update schema `runnings`:
  - Tambah field `timer` (String)
  - Tambah field `percobaan` (Number)
  - Hapus field `waktu`
- ✅ Update schema `finishes`:
  - Tambah field `action` (String)
  - Ubah field `waktu` ke String

### 4. `package.json`
- ✅ Tambah script `test:mqtt` untuk testing MQTT
- ✅ Tambah script `dev` sebagai alias untuk `start`

---

## 🧪 Cara Testing

### 1. Testing dengan cURL

**Test START:**
```bash
curl -X POST http://localhost:5000/sterilisasi/set \
  -H "Content-Type: application/json" \
  -d '{
    "action": "start",
    "suhu": 120,
    "tekanan": 1.0,
    "waktu": "00:30",
    "device": "AUTOCLAVE-01"
  }'
```

**Test STOP:**
```bash
curl -X POST http://localhost:5000/sterilisasi/stop \
  -H "Content-Type: application/json" \
  -d '{"device": "AUTOCLAVE-01"}'
```

---

### 2. Testing dengan MQTT Tool

**Jalankan test tool:**
```bash
npm run test:mqtt
```

**Kirim perintah:**
```javascript
> publishStart(120, 1.0, "00:30")
> publishStop()
```

**Simulasi data dari alat:**
```javascript
> simulateCountdown()
> simulateIgnition(1, "prosesing")
> simulateIgnition(1, "api menyala")
> simulateRunning(121.5, 1.3, "00:28:15")
> simulateFinish(120.5, 1.2, "00:30")
```

---

### 3. Testing dengan REST Client (VS Code)

1. Install extension "REST Client" di VS Code
2. Buka file `api-examples.http`
3. Klik "Send Request" di atas setiap request

---

### 4. Testing dengan Postman

1. Import file `api-examples.http` atau buat request manual
2. Set base URL: `http://localhost:5000`
3. Test semua endpoint

---

## ✅ Checklist Kompatibilitas

- ✅ Format waktu sesuai dengan alat (HH:MM dan HH:MM:SS)
- ✅ Field `Device` dengan huruf besar D
- ✅ Topik MQTT sesuai dengan alat
- ✅ Perintah START ke topik `sterilisasi/set`
- ✅ Perintah STOP ke topik `sterilisasi/running`
- ✅ Support semua action dari alat:
  - ✅ countdown
  - ✅ ignition (dengan sesi dan status)
  - ✅ running (dengan timer)
  - ✅ stop
  - ✅ ignition_failed
  - ✅ finish
- ✅ Konversi otomatis waktu dari number ke string
- ✅ Validasi Device ID
- ✅ Logging lengkap di console

---

## 🚀 Cara Menjalankan

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
Pastikan file `.env` sudah ada dan berisi:
```env
MONGO_URI=mongodb+srv://...
PORT=5000
MQTT_BROKER=mqtt://broker.hivemq.com
```

### 3. Jalankan Server
```bash
npm start
```

Server akan berjalan di `http://localhost:5000`

### 4. Test MQTT (Opsional)
Di terminal lain:
```bash
npm run test:mqtt
```

---

## 📝 Catatan Penting

1. **Format Waktu:**
   - Alat ESP32 menggunakan format "HH:MM" untuk durasi
   - Backend otomatis konversi jika frontend mengirim number (menit)

2. **Device ID:**
   - Alat menggunakan `Device` (huruf besar D)
   - Backend menerima `device` (huruf kecil) dan otomatis konversi

3. **Topik MQTT:**
   - START → `sterilisasi/set`
   - STOP → `sterilisasi/running`
   - Jangan terbalik!

4. **Broker MQTT:**
   - Menggunakan `broker.hivemq.com` (public broker)
   - Tidak perlu autentikasi
   - Pastikan koneksi internet aktif

5. **Database:**
   - Semua data disimpan ke MongoDB
   - Data finish juga disimpan ke memory untuk consume

---

## 🐛 Troubleshooting

### MQTT Tidak Terhubung
- Cek koneksi internet
- Pastikan broker: `broker.hivemq.com`
- Lihat log di console

### Data Tidak Tersimpan
- Cek koneksi MongoDB
- Lihat log error di console
- Pastikan format JSON sesuai

### Alat Tidak Menerima Perintah
- Pastikan alat terhubung ke WiFi
- Pastikan alat subscribe ke topik yang benar
- Cek Device ID sudah sesuai
- Gunakan `test-mqtt.js` untuk monitoring

---

## 📞 Bantuan

Jika ada pertanyaan atau masalah, lihat:
1. `API_FORMAT.md` - Dokumentasi lengkap format API
2. `README.md` - Panduan instalasi dan penggunaan
3. Console log - Semua aktivitas MQTT tercatat di console

---

**Semua perubahan sudah selesai dan siap digunakan! 🎉**
