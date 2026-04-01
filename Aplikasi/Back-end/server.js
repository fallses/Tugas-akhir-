const express = require("express");
const cors = require("cors");

// import mqtt module
const mqttClient = require("./mqtt/mqttClient");

const app = express();
app.use(cors());
app.use(express.json());

// ================= API =================

// ambil data terakhir
app.get("/data", (req, res) => {
  res.json({
    status: "success",
    data: mqttClient.getLastData(),
  });
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