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

// ambil data terakhir (dari MQTT)
app.get("/data", (req, res) => {
  res.json({
    status: "success",
    data: mqttClient.getLastData(),
  });
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

// ================= SERVER =================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});