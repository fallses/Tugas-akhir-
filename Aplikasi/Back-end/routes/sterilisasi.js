const express  = require("express");
const router   = express.Router();
const { Sesi, Sensor } = require("../models/sterilisasi");
const mqttClient       = require("../mqtt/mqttClient");

// ── POST /sterilisasi/set ─────────────────────────────────────
// Frontend kirim parameter → publish ke MQTT → simpan ke DB
router.post("/set", async (req, res) => {
  try {
    const { suhu, tekanan, waktu, device, namaAlat } = req.body;

    // Validasi
    if (!suhu || !tekanan || !waktu || !device) {
      return res.status(400).json({
        status:  "error",
        message: "Field suhu, tekanan, waktu, dan device wajib diisi",
      });
    }

    // Payload ke MQTT (sesuai format alat)
    const mqttPayload = {
      action:  "start",
      suhu:    Number(suhu),
      tekanan: Number(tekanan),
      waktu:   Number(waktu),
      Device:  device,
    };

    // 1. Publish ke MQTT → alat menerima perintah
    await mqttClient.publishSet(mqttPayload);

    // 2. Simpan sesi ke MongoDB
    const sesi = await new Sesi({
      action:   "start",
      suhu:     Number(suhu),
      tekanan:  Number(tekanan),
      waktu:    Number(waktu),
      device,
      namaAlat: namaAlat ?? "",
      status:   "running",
    }).save();

    res.json({
      status:  "success",
      message: "Perintah start berhasil dikirim ke alat",
      data:    sesi,
    });

  } catch (error) {
    res.status(500).json({
      status:  "error",
      message: error.message,
    });
  }
});

// ── GET /sterilisasi/set ──────────────────────────────────────
// Frontend ambil data sesi terbaru dari DB
router.get("/set", async (req, res) => {
  try {
    const data = await Sesi.find().sort({ createdAt: -1 }).limit(50);
    res.json({ status: "success", data });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// ── GET /sterilisasi/sensor ───────────────────────────────────
// Frontend ambil data sensor realtime terbaru
router.get("/sensor", async (req, res) => {
  try {
    const data = await Sensor.find().sort({ createdAt: -1 }).limit(50);
    res.json({ status: "success", data });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// ── GET /sterilisasi/sensor/last ──────────────────────────────
// Ambil 1 data sensor paling baru (untuk monitoring realtime di frontend)
router.get("/sensor/last", async (req, res) => {
  try {
    const last = await Sensor.findOne().sort({ createdAt: -1 });
    res.json({ status: "success", data: last });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;