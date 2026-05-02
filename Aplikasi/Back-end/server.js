const express = require("express");
const cors    = require("cors");
const mqttClient = require("./mqtt/mqttClient");
const connectDB  = require("./config/database");
const sterilisasiRoutes = require("./routes/sterilisasi");

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

// ─────────────────────────────────────────────────────────
// Routes untuk sterilisasi
// ─────────────────────────────────────────────────────────
app.use("/sterilisasi", sterilisasiRoutes);

// ─────────────────────────────────────────────────────────
// GET /data - Endpoint lama, dihapus
// ─────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────
// POST /start - Endpoint lama, dihapus
// ─────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────
// POST /stop - Endpoint lama, dihapus
// ─────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────
// GET /finish - Endpoint lama, dihapus
// ─────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────
// GET /history - Endpoint lama, dihapus
// ─────────────────────────────────────────────────────────

app.get("/", (req, res) => res.send("Backend MQTT Aktif 🚀"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server jalan di http://localhost:${PORT}`));
