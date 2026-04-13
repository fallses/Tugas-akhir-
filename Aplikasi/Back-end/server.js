require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const connectDB  = require("./config/database");

// Inisialisasi MQTT (auto-connect saat server start)
require("./mqtt/mqttClient");

const sterilisasiRoutes = require("./routes/sterilisasi");

const app = express();
app.use(cors());
app.use(express.json());

// Koneksi MongoDB
connectDB();

// ── Routes ──────────────────────────────────────────────────
app.use("/sterilisasi", sterilisasiRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Backend Sterilisasi Aktif 🚀" });
});

// ── Start server ────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});