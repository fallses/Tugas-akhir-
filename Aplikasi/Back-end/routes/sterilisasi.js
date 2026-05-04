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
<<<<<<< Updated upstream
      action:  "start",
      suhu:    Number(suhu),
      tekanan: Number(tekanan),
      waktu:   Number(waktu),
=======
      action:  action || "start", // default "start" jika tidak ada action
      suhu:    suhu != null ? Number(suhu) : null,
      tekanan: tekanan != null ? Number(tekanan) : null,
      waktu:   waktu,  // bisa Number atau String
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
// ── GET /sterilisasi/sensor ───────────────────────────────────
// Frontend ambil data sensor realtime terbaru
router.get("/sensor", async (req, res) => {
=======
// ── GET /sterilisasi/set/last ─────────────────────────────────
// Ambil 1 data set paling baru
router.get("/set/last", async (req, res) => {
  try {
    const last = await Set.findOne().sort({ createdAt: -1 });
    res.json({ status: "success", data: last });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// ── GET /sterilisasi/running ──────────────────────────────────
// Frontend ambil data dari collection Running (topik sterilisasi/running)
router.get("/running", async (req, res) => {
>>>>>>> Stashed changes
  try {
    const data = await Sensor.find().sort({ createdAt: -1 }).limit(50);
    res.json({ status: "success", data });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

<<<<<<< Updated upstream
// ── GET /sterilisasi/sensor/last ──────────────────────────────
// Ambil 1 data sensor paling baru (untuk monitoring realtime di frontend)
router.get("/sensor/last", async (req, res) => {
=======
// ── POST /sterilisasi/running ─────────────────────────────────
// Frontend kirim perintah stop → publish ke topik sterilisasi/running
router.post("/running", async (req, res) => {
  try {
    const { action, device } = req.body;

    if (!device) {
      return res.status(400).json({
        status:  "error",
        message: "Field device wajib diisi",
      });
    }

    const mqttPayload = {
      action: action || "stop",
      Device: device,
    };

    await mqttClient.publishRunning(mqttPayload);

    res.json({
      status:  "success",
      message: `Perintah ${action || 'stop'} berhasil dikirim ke topik running`,
    });
  } catch (error) {
    res.status(500).json({
      status:  "error",
      message: error.message,
    });
  }
});

// ── GET /sterilisasi/running/last ─────────────────────────────
// Ambil 1 data running paling baru
router.get("/running/last", async (req, res) => {
>>>>>>> Stashed changes
  try {
    const last = await Sensor.findOne().sort({ createdAt: -1 });
    res.json({ status: "success", data: last });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

<<<<<<< Updated upstream
=======
// ── GET /sterilisasi/finish ───────────────────────────────────
// Frontend ambil data dari collection Finish (topik sterilisasi/finish)
router.get("/finish", async (req, res) => {
  try {
    const data = await Finish.find().sort({ createdAt: -1 }).limit(50);
    res.json({ status: "success", data });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// ── GET /sterilisasi/finish/last ──────────────────────────────
// Ambil 1 data finish paling baru dan CONSUME (hapus setelah dibaca)
router.get("/finish/last", async (req, res) => {
  try {
    const lastFinish = mqttClient.getLastFinishData();

    if (!lastFinish) {
      return res.json({ status: "success", data: null });
    }

    // Simpan dulu sebelum di-consume, lalu kirim ke frontend
    const dataToSend = { ...lastFinish };
    mqttClient.consumeFinish();

    console.log("[GET /sterilisasi/finish/last] Data finish di-consume:", JSON.stringify(dataToSend));

    res.json({ status: "success", data: dataToSend });
  } catch (error) {
    res.status(500).json({
      status:  "error",
      message: error.message,
    });
  }
});

>>>>>>> Stashed changes
module.exports = router;