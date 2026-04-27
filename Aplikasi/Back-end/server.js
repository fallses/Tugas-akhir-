const express = require("express");
const cors    = require("cors");
const mqttClient = require("./mqtt/mqttClient");
const connectDB  = require("./config/database");
const Data       = require("./models/data");

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

// ─────────────────────────────────────────────────────────
// GET /data
// Ambil data terakhir dari MQTT. Action di-consume setelah dibaca
// agar tidak terbaca ulang oleh polling berikutnya.
// ─────────────────────────────────────────────────────────
app.get("/data", (req, res) => {
  const data = mqttClient.getLastData();

  // Log untuk debug — tampilkan action yang sedang dikirim ke frontend
  if (data?.action) {
    console.log(`[GET /data] Mengirim action: "${data.action}" sesi:${data.sesi ?? '-'} status:${data.status ?? '-'}`);
  }

  // Kirim response dulu, baru consume — pastikan frontend sudah terima
  res.json({ status: "success", data });

  // Consume setelah response terkirim
  setImmediate(() => mqttClient.consumeAction());
});

// ─────────────────────────────────────────────────────────
// POST /start
// Frontend kirim saat user tekan "Mulai Proses".
// Publish ke sterilisasi/set dengan action "start".
//
// Body: { suhu, tekanan, waktu, device }
// ─────────────────────────────────────────────────────────
app.post("/start", (req, res) => {
  const { suhu, tekanan, waktu, device } = req.body;

  const now = new Date();
  const fallbackWaktu = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  const payload = JSON.stringify({
    action:  "start",
    suhu:    suhu    ?? null,
    tekanan: tekanan ?? null,
    waktu:   waktu   ?? fallbackWaktu,
    Device:  device  ?? null,
  });

  mqttClient.client.publish(mqttClient.PUBLISH_TOPIC, payload, (err) => {
    if (err) return res.status(500).json({ status: "error", message: "Gagal publish MQTT" });
    console.log(`[PUBLISH] ${mqttClient.PUBLISH_TOPIC}:`, payload);
    res.json({ status: "success", message: "Perintah start dikirim" });
  });
});

// ─────────────────────────────────────────────────────────
// POST /stop
// Frontend kirim saat user tekan "Hentikan/Batalkan".
// Publish ke sterilisasi/set dengan action "stop".
//
// Body: { device }
// ─────────────────────────────────────────────────────────
app.post("/stop", (req, res) => {
  const { device } = req.body;

  const now = new Date();
  const waktu = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  const payload = JSON.stringify({
    action: "stop",
    waktu,
    Device: device ?? null,
  });

  mqttClient.client.publish(mqttClient.PUBLISH_TOPIC, payload, (err) => {
    if (err) return res.status(500).json({ status: "error", message: "Gagal publish MQTT" });
    console.log(`[PUBLISH] ${mqttClient.PUBLISH_TOPIC}:`, payload);
    res.json({ status: "success", message: "Perintah stop dikirim" });
  });
});

// ─────────────────────────────────────────────────────────
// GET /finish
// Ambil data dari topik sterilisasi/finish.
// Di-consume setelah dibaca agar tidak terbaca ulang.
// ─────────────────────────────────────────────────────────
app.get("/finish", (req, res) => {
  const data = mqttClient.getLastFinishData();

  if (data) {
    console.log(`[GET /finish] Mengirim data finish: waktu:${data.waktu}`);
  }

  res.json({ status: "success", data });

  setImmediate(() => mqttClient.consumeFinish());
});

// ─────────────────────────────────────────────────────────
// GET /history — ambil semua data dari database
// ─────────────────────────────────────────────────────────
app.get("/history", async (req, res) => {
  try {
    const data = await Data.find().sort({ waktu: -1 });
    res.json({ status: "success", data });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.get("/", (req, res) => res.send("Backend MQTT Aktif 🚀"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server jalan di http://localhost:${PORT}`));
