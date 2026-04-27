const mongoose = require("mongoose");

// ── Koleksi: sesi sterilisasi (dikirim dari frontend) ──
const sesiSchema = new mongoose.Schema({
  action:   { type: String, default: "start" }, // start | stop
  suhu:     { type: Number, required: true },
  tekanan:  { type: Number, required: true },
  waktu:    { type: Number, required: true },   // durasi dalam detik
  device:   { type: String, required: true },   // ID alat
  namaAlat: { type: String, default: "" },
  status:   { type: String, default: "running" }, // running | selesai | dihentikan
  createdAt:{ type: Date,   default: Date.now },
});

// ── Koleksi: data sensor realtime (diterima dari MQTT alat) ──
const sensorSchema = new mongoose.Schema({
  suhu:     Number,
  tekanan:  Number,
  action:   String,
  waktu:    String,
  device:   String,
  createdAt:{ type: Date, default: Date.now },
});

const Sesi   = mongoose.model("SesiSterilisasi", sesiSchema);
const Sensor = mongoose.model("SensorData",      sensorSchema);

module.exports = { Sesi, Sensor };