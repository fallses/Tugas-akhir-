const express  = require("express");
const router   = express.Router();
const { Set, Running, Finish } = require("../models/sterilisasi");
const mqttClient       = require("../mqtt/mqttClient");

// ── POST /sterilisasi/set ─────────────────────────────────────
// Frontend kirim parameter → publish ke MQTT
router.post("/set", async (req, res) => {
  try {
    const { action, suhu, tekanan, waktu, device, namaAlat } = req.body;

    // Validasi minimal - hanya device yang wajib
    if (!device) {
      return res.status(400).json({
        status:  "error",
        message: "Field device wajib diisi",
      });
    }

    // Payload ke MQTT (sesuai format alat)
    const mqttPayload = {
      action:  action || "start", // default "start" jika tidak ada action
      suhu:    suhu ? Number(suhu) : null,
      tekanan: tekanan ? Number(tekanan) : null,
      waktu:   waktu,  // bisa Number atau String
      Device:  device,
    };

    // Publish ke MQTT → alat menerima perintah
    await mqttClient.publishSet(mqttPayload);

    res.json({
      status:  "success",
      message: `Perintah ${action || 'start'} berhasil dikirim ke alat`,
    });

  } catch (error) {
    res.status(500).json({
      status:  "error",
      message: error.message,
    });
  }
});

// ── GET /sterilisasi/set ──────────────────────────────────────
// Frontend ambil data dari collection Set (topik sterilisasi/set)
router.get("/set", async (req, res) => {
  try {
    const data = await Set.find().sort({ createdAt: -1 }).limit(50);
    res.json({ status: "success", data });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

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

// ── GET /sterilisasi/sensor ───────────────────────────────────
// Endpoint ini dihapus karena collection Sensor tidak digunakan lagi

// ── GET /sterilisasi/sensor/last ──────────────────────────────
// Endpoint ini dihapus karena collection Sensor tidak digunakan lagi

// ── GET /sterilisasi/running ──────────────────────────────────
// Frontend ambil data dari collection Running (topik sterilisasi/running)
router.get("/running", async (req, res) => {
  try {
    const data = await Running.find().sort({ createdAt: -1 }).limit(50);
    res.json({ status: "success", data });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// ── GET /sterilisasi/running/last ─────────────────────────────
// Ambil 1 data running paling baru
router.get("/running/last", async (req, res) => {
  try {
    const last = await Running.findOne().sort({ createdAt: -1 });
    res.json({ status: "success", data: last });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

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
    // Ambil dari memory (bukan database)
    const lastFinish = mqttClient.getLastFinishData();
    
    if (!lastFinish) {
      return res.json({ status: "success", data: null });
    }
    
    // Consume data (hapus dari memory setelah dibaca)
    mqttClient.consumeFinish();
    
    console.log("[GET /sterilisasi/finish/last] Data finish di-consume");
    
    res.json({ status: "success", data: lastFinish });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;