require("dotenv").config();
const mqtt = require("mqtt");
const { Sensor } = require("../models/sterilisasi");

const broker = "mqtt://broker.hivemq.com";
const Data = require("../models/data");

// Mapping topic → action yang dikenali frontend
const TOPIC_ACTION_MAP = {
  "sterilisasi/set":      "set",
  "sterilisasi/countdown": "countdown",
  "sterilisasi/running":  "running",
  "sterilisasi/finish":   "finish",
};

const TOPICS = Object.keys(TOPIC_ACTION_MAP);

const client = mqtt.connect(broker);

let lastSensor = null;

// ── Koneksi ──────────────────────────────────────────────────
client.on("connect", () => {
  console.log("MQTT Terhubung ✅ →", broker);

  client.subscribe(TOPICS, (err) => {
    if (!err) {
      console.log("Subscribe ke topic:", TOPICS.join(", "));
    }
  });
});

// menerima pesan
client.on("message", async (receivedTopic, message) => {
  const raw = message.toString();
  console.log(`[${receivedTopic}] Data masuk:`, raw);

  // Tentukan action dari nama topic
  const action = TOPIC_ACTION_MAP[receivedTopic] ?? null;
  if (!action) {
    console.warn("Topic tidak dikenali:", receivedTopic);
    return;
  }

  let data = {};
  try {
    data = JSON.parse(raw);
  } catch {
    // Payload boleh kosong atau bukan JSON — action tetap diproses
    console.warn("Payload bukan JSON, lanjut dengan data kosong");
  }

  // Waktu dari payload boleh format "HH:MM" (misal "10:30")
  // Jika tidak ada, fallback ke jam:menit saat ini
  const now = new Date();
  const fallbackWaktu = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  const waktu = data.waktu ?? fallbackWaktu;

  // Simpan data terakhir — action diambil dari topic, bukan dari payload
  lastData = {
    suhu:    data.suhu    ?? null,
    tekanan: data.tekanan ?? null,
    action,
    waktu,
    device:  data.Device  ?? data.device ?? null,
  };

  console.log("lastData diperbarui:", lastData);

  try {
    await new Data({
      suhu:    data.suhu,
      tekanan: data.tekanan,
      action,
      waktu,
      device:  data.Device ?? data.device,
    }).save();
  } catch (error) {
    console.error("Gagal simpan ke DB:", error.message);
  }
});

// ── Publish perintah SET ke alat ─────────────────────────────
function publishSet(payload) {
  return new Promise((resolve, reject) => {
    const message = JSON.stringify(payload);
    client.publish(topicSet, message, { qos: 1 }, (err) => {
      if (err) {
        console.error("Gagal publish MQTT ❌:", err.message);
        reject(err);
      } else {
        console.log(`[MQTT → ${topicSet}]`, message);
        resolve();
      }
    });
  });
}

module.exports = {
  client,
  getLastData: () => lastData,
  // Reset action setelah dikonsumsi frontend — mencegah action terbaca ulang
  consumeAction: () => {
    if (lastData) lastData.action = null;
  },
};