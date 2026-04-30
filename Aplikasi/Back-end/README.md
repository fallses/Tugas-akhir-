# Backend Autoclave Sterilisasi

Backend untuk sistem monitoring dan kontrol alat sterilisasi autoclave menggunakan MQTT.

## Fitur

- ✅ Komunikasi MQTT dengan alat ESP32
- ✅ REST API untuk frontend
- ✅ Penyimpanan data ke MongoDB
- ✅ Format waktu otomatis (HH:MM dan HH:MM:SS)
- ✅ Perintah START dan STOP ke alat
- ✅ Real-time monitoring status proses

## Teknologi

- **Node.js** + Express.js
- **MQTT** (broker: broker.hivemq.com)
- **MongoDB** (database)
- **Mongoose** (ODM)

## Instalasi

### 1. Clone Repository
```bash
git clone <repository-url>
cd <project-folder>
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Konfigurasi Environment
Buat file `.env` di root folder:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0
PORT=5000
MQTT_BROKER=mqtt://broker.hivemq.com
```

### 4. Jalankan Server
```bash
npm start
```

Server akan berjalan di `http://localhost:5000`

## Struktur Folder

```
.
├── config/
│   └── database.js          # Konfigurasi MongoDB
├── models/
│   └── sterilisasi.js       # Schema MongoDB
├── mqtt/
│   └── mqttClient.js        # MQTT Client & Handler
├── routes/
│   └── sterilisasi.js       # API Routes
├── .env                     # Environment Variables
├── server.js                # Entry Point
├── package.json
├── API_FORMAT.md            # Dokumentasi Format API
└── README.md
```

## API Endpoints

### 1. Kirim Perintah START
```http
POST /sterilisasi/set
Content-Type: application/json

{
  "action": "start",
  "suhu": 120,
  "tekanan": 1.0,
  "waktu": "00:30",
  "device": "AUTOCLAVE-01"
}
```

### 2. Kirim Perintah STOP
```http
POST /sterilisasi/stop
Content-Type: application/json

{
  "device": "AUTOCLAVE-01"
}
```

### 3. Ambil Data SET
```http
GET /sterilisasi/set           # Semua data (limit 50)
GET /sterilisasi/set/last      # Data terakhir
```

### 4. Ambil Data RUNNING
```http
GET /sterilisasi/running       # Semua data (limit 50)
GET /sterilisasi/running/last  # Data terakhir
```

### 5. Ambil Data FINISH
```http
GET /sterilisasi/finish        # Semua data (limit 50)
GET /sterilisasi/finish/last   # Data terakhir (consume)
```

## Format Data

### Waktu
- **Durasi (SET/FINISH):** `"HH:MM"` (contoh: "00:30" = 30 menit)
- **Timer (RUNNING):** `"HH:MM:SS"` (contoh: "00:29:45" = 29 menit 45 detik)

### Device ID
```
AUTOCLAVE-01
```

## MQTT Topics

| Topic | Direction | Description |
|-------|-----------|-------------|
| `sterilisasi/set` | Backend → Alat | Perintah START |
| `sterilisasi/set` | Alat → Backend | Konfirmasi START |
| `sterilisasi/running` | Backend → Alat | Perintah STOP |
| `sterilisasi/running` | Alat → Backend | Status proses (countdown, ignition, running, stop) |
| `sterilisasi/finish` | Alat → Backend | Sinyal selesai |

## Database Collections

### 1. `sets`
Menyimpan data perintah START dan konfirmasi dari alat.

### 2. `runnings`
Menyimpan data status proses (countdown, ignition, running, stop).

### 3. `finishes`
Menyimpan data proses yang selesai.

## Testing

### Menggunakan cURL

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

**Test GET:**
```bash
curl http://localhost:5000/sterilisasi/set/last
curl http://localhost:5000/sterilisasi/running/last
curl http://localhost:5000/sterilisasi/finish/last
```

### Menggunakan Postman

1. Import collection dari `API_FORMAT.md`
2. Set base URL: `http://localhost:5000`
3. Test semua endpoint

## Monitoring MQTT

Untuk melihat pesan MQTT secara real-time, gunakan MQTT client seperti:

- **MQTT Explorer** (GUI)
- **mosquitto_sub** (CLI)

```bash
mosquitto_sub -h broker.hivemq.com -t "sterilisasi/#" -v
```

## Troubleshooting

### 1. MQTT Tidak Terhubung
- Pastikan koneksi internet aktif
- Cek broker MQTT: `broker.hivemq.com`
- Lihat log di console

### 2. MongoDB Tidak Terhubung
- Cek `MONGO_URI` di file `.env`
- Pastikan IP address di-whitelist di MongoDB Atlas
- Cek username dan password

### 3. Data Tidak Tersimpan
- Cek log di console
- Pastikan format JSON sesuai
- Cek schema di `models/sterilisasi.js`

## Dokumentasi Lengkap

Lihat file `API_FORMAT.md` untuk dokumentasi lengkap format API dan MQTT.

## Lisensi

MIT

## Kontak

Untuk pertanyaan atau bantuan, hubungi tim developer.
