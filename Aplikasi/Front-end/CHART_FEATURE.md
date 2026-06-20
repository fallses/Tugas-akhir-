# Fitur Grafik Perubahan Suhu dan Tekanan

## Deskripsi
Fitur baru yang menampilkan grafik real-time perubahan suhu dan tekanan di layar Kontrol Manual.

## Lokasi Fitur
- **Screen**: `ManualControlScreen.tsx`
- **Posisi**: Di bawah card "Monitor Real-Time"

## Komponen Grafik

### 1. **Grafik Suhu**
- Menampilkan perubahan suhu dalam satuan °C
- Warna: Oranye (fire color) - `#FF6B35`
- Update otomatis setiap polling interval

### 2. **Grafik Tekanan**
- Menampilkan perubahan tekanan dalam satuan bar
- Warna: Biru (accent color) - `#1BD5FF`
- Update otomatis setiap polling interval

## Teknologi
- **Library**: `react-native-chart-kit` v6.12.3
- **Dependency**: `react-native-svg` v15.15.5
- **Chart Type**: Line Chart dengan Bezier curves

## Fitur Grafik
- ✅ Real-time data visualization
- ✅ Maximum 20 data points (sliding window)
- ✅ Responsive chart width
- ✅ Time-based labels (dalam detik)
- ✅ Smooth line dengan bezier curves
- ✅ Grid lines untuk kemudahan pembacaan
- ✅ Dot markers untuk setiap data point
- ✅ Auto-scaling untuk sumbu Y

## Data Management
- **Polling Interval**: Menggunakan `POLL_INTERVAL_MS` dari config
- **Max Data Points**: 20 (data lama akan dihapus otomatis)
- **Data Source**: `/sterilisasi/manual/last` endpoint
- **Update Strategy**: Push new data, slide old data

## Styling
Grafik mengikuti tema dark mode aplikasi dengan:
- Background: Card background color
- Grid lines: Border color dengan opacity
- Labels: Muted color untuk teks
- Chart lines: Fire (suhu) dan Accent (tekanan) colors

## Cara Kerja
1. Setiap polling, data suhu dan tekanan baru ditambahkan ke array
2. Label waktu dibuat berdasarkan counter data point
3. Jika data melebihi 20 point, data terlama akan dihapus
4. Chart otomatis re-render dengan data terbaru
5. Bezier curve membuat garis lebih smooth

## File yang Dimodifikasi
1. `src/screens/ManualControlScreen.tsx`
   - Import LineChart dari react-native-chart-kit
   - State management untuk data grafik
   - Logic untuk mengumpulkan data history
   - Render grafik suhu dan tekanan

2. `src/styles/ManualControlScreen.styles.ts`
   - Style untuk chart card
   - Style untuk chart header
   - Style untuk chart section
   - Style untuk chart label

3. `package.json`
   - Dependency: react-native-chart-kit
   - Dependency: react-native-svg

## Testing
Untuk menguji fitur:
1. Jalankan aplikasi dan buka layar Kontrol Manual
2. Pastikan data suhu dan tekanan masuk dari backend
3. Perhatikan grafik yang update secara real-time
4. Periksa bahwa maksimal 20 data point ditampilkan
5. Scroll untuk melihat kedua grafik (suhu dan tekanan)

## Catatan Pengembangan
- Grafik hanya menyimpan data selama sesi aktif
- Data grafik tidak disimpan ke database
- Jika keluar dari screen, data grafik akan di-reset
- Polling menggunakan interval yang sama dengan monitor real-time
