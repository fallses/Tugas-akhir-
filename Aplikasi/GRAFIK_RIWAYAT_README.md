# Grafik Riwayat Real-Time

## 📊 Overview

Grafik di tampilan detail riwayat sekarang menampilkan **data real** dari database, bukan simulasi!

## 🔄 Cara Kerja

### 1. Alat Mengirim Data dengan batch_id

Saat proses berjalan, alat mengirim data running dengan `batch_id` yang sama:

```json
// MQTT Topic: sterilisasi/running
{
  "action": "running",
  "suhu": 115.5,
  "tekanan": 1.2,
  "timer": "00:12:30",
  "device": "AUTOCLAVE-01",
  "batch_id": "AUTOCLAVE-01-2805980-1062"
}
```

### 2. Backend Menyimpan ke Database

Semua data running disimpan ke collection `runnings` dengan `batch_id`.

### 3. Frontend Menampilkan Grafik

Saat user membuka detail riwayat:

1. **Cek batch_id**: Jika ada batch_id di data finish
2. **Fetch data**: Panggil API `/sterilisasi/running/batch/:batch_id`
3. **Render grafik**: Tampilkan data real dari database
4. **Fallback**: Jika tidak ada batch_id atau data kosong, tampilkan grafik simulasi

## 📱 Tampilan

### Dengan Data Real (batch_id ada)

```
📊 Grafik Perubahan
   [Loading indicator saat fetch data]
   
   🔴 Suhu (°C)    🔵 Tekanan (bar)
   
   [Grafik dengan data real dari database]
   
   *Grafik real-time dari 25 data points
```

### Tanpa Data Real (batch_id tidak ada)

```
📊 Grafik Perubahan
   
   🔴 Suhu (°C)    🔵 Tekanan (bar)
   
   [Grafik kurva simulasi berdasarkan nilai akhir]
   
   *Grafik simulasi berdasarkan data akhir proses
```

## 🎯 Keuntungan

### ✅ Data Akurat
- Grafik menampilkan perubahan suhu/tekanan yang sebenarnya terjadi
- Tidak ada asumsi atau simulasi

### ✅ Detail Proses
- Dapat melihat fluktuasi selama proses
- Identifikasi masalah jika ada (suhu tidak stabil, dll)

### ✅ Backward Compatible
- Riwayat lama tanpa batch_id tetap bisa ditampilkan (gunakan simulasi)
- Riwayat baru dengan batch_id menampilkan data real

## 🔍 Debug

### Cek Console Log

Saat membuka detail riwayat, akan ada log:

```javascript
// Jika ada batch_id
[HistoryScreen] Mengambil data running untuk batch_id: AUTOCLAVE-01-2805980-1062
[HistoryScreen] Data running ditemukan: 25 data points
[HistoryScreen] Chart data berhasil diload: {suhuPoints: 25, tekananPoints: 25}

// Jika tidak ada batch_id
[HistoryScreen] Tidak ada batch_id, gunakan data simulasi

// Jika batch_id ada tapi data kosong
[HistoryScreen] Tidak ada data running, gunakan data simulasi
```

### Verifikasi Data di Database

```javascript
// MongoDB Query
db.runnings.find({ batch_id: "AUTOCLAVE-01-2805980-1062" }).sort({ createdAt: 1 })

// Harus return array dengan data suhu dan tekanan
```

## 🐛 Troubleshooting

### Grafik Masih Menampilkan Simulasi

**Problem**: Grafik tidak menampilkan data real meskipun ada di database

**Kemungkinan Penyebab**:
1. `batch_id` tidak tersimpan di collection `finishes`
2. `batch_id` di `finishes` berbeda dengan di `runnings`
3. Data running tidak ada untuk batch_id tersebut

**Solusi**:
```javascript
// 1. Cek batch_id di finish
db.finishes.findOne({}, { batch_id: 1, device: 1 })

// 2. Cek apakah ada data running dengan batch_id yang sama
db.runnings.count({ batch_id: "AUTOCLAVE-01-2805980-1062" })

// 3. Cek log console di aplikasi untuk melihat error
```

### Data Grafik Tidak Lengkap

**Problem**: Grafik hanya menampilkan sebagian data

**Kemungkinan Penyebab**:
1. Alat tidak selalu mengirim batch_id di setiap message running
2. Koneksi MQTT terputus selama proses

**Solusi**:
- Pastikan alat menyimpan `batch_id` dan mengirimkannya di **setiap** message running
- Cek log MQTT broker untuk memastikan semua message terkirim

### Timer Label Tidak Muncul

**Problem**: Label grafik menampilkan index bukan waktu

**Kemungkinan Penyebab**:
Field `timer` tidak ada atau null di data running

**Solusi**:
- Pastikan alat mengirim field `timer` dengan format `HH:MM:SS`
- Backend akan menggunakan fallback (index) jika timer tidak ada

## 📝 Catatan Implementasi

### Format Timer

Alat harus mengirim timer dengan format:
```
"HH:MM:SS"  →  Contoh: "00:15:30"
```

Frontend akan convert ke format `MM:SS` untuk label grafik.

### Jumlah Data Points

- Grafik akan menampilkan **semua** data running yang tersimpan
- Jika terlalu banyak (>50 points), label akan di-filter untuk readability
- Kurva tetap smooth menggunakan bezier interpolation

### Performance

- Data di-fetch sekali saat modal dibuka
- Data di-cache di state sampai modal ditutup
- Tidak ada polling/refresh otomatis (data historis tidak berubah)

## 🚀 Next Steps

Untuk implementasi yang lebih baik:

1. **Compression**: Jika data points sangat banyak (>100), pertimbangkan sampling
2. **Caching**: Cache chart data di AsyncStorage untuk akses lebih cepat
3. **Export**: Tambahkan fitur export grafik sebagai gambar
4. **Compare**: Bisa compare grafik dari multiple batch

---

**Status**: ✅ Implemented & Ready to Use
**Version**: 1.0.0
**Last Updated**: 2026-06-21
