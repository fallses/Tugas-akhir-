const express = require("express");
const cors = require("cors");

// import mqtt module
const mqttClient = require("./mqtt/mqttClient");

// import database
const connectDB = require("./config/database");
const Data = require("./models/data");

const app = express();
app.use(cors());
app.use(express.json());

// konek ke DB
connectDB();

// ================= API =================

// ambil data terakhir (dari MQTT) — action di-consume sekali lalu di-reset
app.get("/data", (req, res) => {
  const data = mqttClient.getLastData();
  res.json({
    status: "success",
    data,
  });
  // Reset action setelah dikonsumsi agar tidak terbaca ulang
  mqttClient.consumeAction();
});

// simpan data ke database
app.post("/data", async (req, res) => {
  try {
    const { suhu, tekanan } = req.body;

    const newData = new Data({
      suhu,
      tekanan,
    });

    await newData.save();

    res.json({
      status: "success",
      message: "Data berhasil disimpan",
      data: newData,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// ambil semua data dari database
app.get("/history", async (req, res) => {
  try {
    const data = await Data.find().sort({ waktu: -1 });

    res.json({
      status: "success",
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// test server
app.get("/", (req, res) => {
  res.send("Backend MQTT Aktif 🚀");
});

// kirim perintah stop — publish ke topic sterilisasi/set
app.post("/stop", (req, res) => {
  const payload = JSON.stringify({
    action: "set",
    waktu: (() => {
      const now = new Date();
      return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    })(),
  });

  mqttClient.client.publish("sterilisasi/set", payload, (err) => {
    if (err) {
      return res.status(500).json({ status: "error", message: "Gagal publish MQTT" });
    }
    res.json({ status: "success", message: "Perintah stop dikirim" });
  });
});

// ================= SERVER =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});