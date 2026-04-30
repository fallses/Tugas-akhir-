const express  = require("express");
const router   = express.Router();
const { Set, Running, Finish } = require("../models/sterilisasi");
const mqttClient       = require("../mqtt/mqttClient");

// ── POST /sterilisasi/set ─────────────────────────────────────
// Frontend kirim parameter → publish ke MQTT (topik: sterilisasi/set)
// Format ke alat: {"action":"start","suhu":120,"tekanan":1.0,"waktu":"00:30","Device":"AUTOCLAVE-01"}
router.post("/set", async (req, res) => {
  try {
    const { action, suhu, tekanan, waktu, device } = req.body;

    // Validasi minimal - device wajib
    if (!device) {
      return res.status(400).json({
        status:  "error",
        message: "Field device wajib diisi",
      });
    }

    // Konversi waktu ke format "HH:MM" jika diperlukan
    let waktuFormatted = waktu;
    if (typeof waktu === "number") {
      // Jika waktu dalam menit, konversi ke "HH:MM"
      const jam = Math.floor(waktu / 60);
      const menit = waktu % 60;
      waktuFormatted = `${String(jam).padStart(2, '0')}:${String(menit).padStart(2, '0')}`;
    }

    // Payload ke MQTT (sesuai format alat)
    const mqttPayload = {
      action:  action || "start",
      suhu:    suhu ? Number(suhu) : null,
      tekanan: tekanan ? Number(tekanan) : null,
      waktu:   waktuFormatted,  // Format: "HH:MM"
      Device:  device,
    };

    // Publish ke MQTT → alat menerima perintah
    await mqttClient.publishSet(mqttPayload);

    res.json({
      status:  "success",
      message: `Perintah ${action || 'start'} berhasil dikirim ke alat`,
      data: mqttPayload,
    });

  } catch (error) {
    res.status(500).json({
      status:  "error",
      message: error.message,
    });
  }
});

// ── POST /sterilisasi/stop ────────────────────────────────────
// Frontend kirim perintah STOP → publish ke MQTT (topik: sterilisasi/running)
// Format ke alat: {"action":"stop","Device":"AUTOCLAVE-01"}
router.post("/stop", async (req, res) => {
  try {
    const { device } = req.body;

    // Validasi minimal - device wajib
    if (!device) {
      return res.status(400).json({
        status:  "error",
        message: "Field device wajib diisi",
      });
    }

    // Payload ke MQTT (sesuai format alat)
    const mqttPayload = {
      action: "stop",
      Device: device,
    };

    // Publish ke MQTT → alat menerima perintah STOP
    await mqttClient.publishStop(mqttPayload);

    res.json({
      status:  "success",
      message: "Perintah STOP berhasil dikirim ke alat",
      data: mqttPayload,
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