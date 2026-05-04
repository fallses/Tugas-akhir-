const express    = require("express");
const router     = express.Router();
const { Set, Running, Finish } = require("../models/sterilisasi");
const mqttClient = require("../mqtt/mqttClient");

// ── POST /sterilisasi/set ─────────────────────────────────────
// Frontend kirim parameter start → publish ke MQTT sterilisasi/set
router.post("/set", async (req, res) => {
  try {
    const { action, suhu, tekanan, waktu, device } = req.body;

    if (!device) {
      return res.status(400).json({ status: "error", message: "Field device wajib diisi" });
    }

    const mqttPayload = {
      action:  action || "start",
      suhu:    suhu    != null ? Number(suhu)    : null,
      tekanan: tekanan != null ? Number(tekanan) : null,
      waktu,
      Device:  device,
    };

    await mqttClient.publishSet(mqttPayload);

    res.json({ status: "success", message: `Perintah ${action || "start"} berhasil dikirim` });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// ── GET /sterilisasi/set ──────────────────────────────────────
router.get("/set", async (_req, res) => {
  try {
    const data = await Set.find().sort({ createdAt: -1 }).limit(50);
    res.json({ status: "success", data });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// ── GET /sterilisasi/set/last ─────────────────────────────────
router.get("/set/last", async (_req, res) => {
  try {
    const last = await Set.findOne().sort({ createdAt: -1 });
    res.json({ status: "success", data: last });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// ── GET /sterilisasi/running ──────────────────────────────────
router.get("/running", async (_req, res) => {
  try {
    const data = await Running.find().sort({ createdAt: -1 }).limit(50);
    res.json({ status: "success", data });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// ── POST /sterilisasi/running ─────────────────────────────────
// Frontend kirim perintah stop → publish ke topik sterilisasi/running
router.post("/running", async (req, res) => {
  try {
    const { action, device } = req.body;

    if (!device) {
      return res.status(400).json({ status: "error", message: "Field device wajib diisi" });
    }

    const mqttPayload = {
      action: action || "stop",
      Device: device,
    };

    await mqttClient.publishRunning(mqttPayload);

    res.json({ status: "success", message: `Perintah ${action || "stop"} berhasil dikirim ke topik running` });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// ── GET /sterilisasi/running/last ─────────────────────────────
router.get("/running/last", async (_req, res) => {
  try {
    const last = await Running.findOne().sort({ createdAt: -1 });
    res.json({ status: "success", data: last });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// ── GET /sterilisasi/finish ───────────────────────────────────
router.get("/finish", async (_req, res) => {
  try {
    const data = await Finish.find().sort({ createdAt: -1 }).limit(50);
    res.json({ status: "success", data });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// ── GET /sterilisasi/finish/last ──────────────────────────────
// Ambil data finish dari memory dan CONSUME setelah dibaca
router.get("/finish/last", async (_req, res) => {
  try {
    const lastFinish = mqttClient.getLastFinishData();

    if (!lastFinish) {
      return res.json({ status: "success", data: null });
    }

    // Copy dulu sebelum di-consume agar tidak hilang karena race condition
    const dataToSend = { ...lastFinish };
    mqttClient.consumeFinish();

    console.log("[GET /sterilisasi/finish/last] Data finish di-consume:", JSON.stringify(dataToSend));

    res.json({ status: "success", data: dataToSend });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
