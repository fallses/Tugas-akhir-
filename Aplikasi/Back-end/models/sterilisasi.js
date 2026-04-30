const mongoose = require("mongoose");

// ── Koleksi: data dari topik sterilisasi/set ──
const setSchema = new mongoose.Schema({
  action:   { type: String },
  suhu:     { type: Number },
  tekanan:  { type: Number },
  waktu:    { type: mongoose.Schema.Types.Mixed },
  device:   { type: String },
  namaAlat: { type: String, default: "" },
  status:   { type: String, default: "unknown" },
  createdAt:{ type: Date, default: Date.now },
});

// ── Koleksi: data dari topik sterilisasi/running ──
const runningSchema = new mongoose.Schema({
  action:    { type: String },
  suhu:      { type: Number },
  tekanan:   { type: Number },
  timer:     { type: String },      // Format: "HH:MM:SS" untuk action "running"
  device:    { type: String },
  sesi:      { type: String },      // Untuk action "ignition"
  status:    { type: String },      // Untuk action "ignition"
  percobaan: { type: Number },      // Untuk action "ignition_failed"
  createdAt: { type: Date, default: Date.now },
});

// ── Koleksi: data dari topik sterilisasi/finish ──
const finishSchema = new mongoose.Schema({
  action:   { type: String, default: "finish" },
  suhu:     { type: Number },
  tekanan:  { type: Number },
  waktu:    { type: String },  // Format: "HH:MM" (durasi yang diset)
  device:   { type: String },
  createdAt:{ type: Date, default: Date.now },
});

const Set     = mongoose.model("Set",     setSchema);
const Running = mongoose.model("Running", runningSchema);
const Finish  = mongoose.model("Finish",  finishSchema);

module.exports = { Set, Running, Finish };
