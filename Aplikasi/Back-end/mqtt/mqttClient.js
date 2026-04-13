require("dotenv").config();
const mqtt = require("mqtt");
const { Sensor } = require("../models/sterilisasi");

const broker    = process.env.MQTT_BROKER     || "mqtt://broker.hivemq.com";
const topicData = process.env.MQTT_TOPIC_DATA  || "sterilisasi/data";
const topicSet  = process.env.MQTT_TOPIC_SET   || "sterilisasi/set";

const client = mqtt.connect(broker);

let lastSensor = null;

// ── Koneksi ──────────────────────────────────────────────────
client.on("connect", () => {
  console.log("MQTT Terhubung ✅ →", broker);

  // Subscribe KE DUA topic sekaligus
  client.subscribe([topicData, topicSet], (err) => {
    if (!err) {
      console.log("Subscribe: sterilisasi/data ✅");
      console.log("Subscribe: sterilisasi/set  ✅");
    } else {
      console.error("Gagal subscribe ❌:", err.message);
    }
  });
});

client.on("error", (err) => {
  console.error("MQTT Error ❌:", err.message);
});

// ── Terima pesan dari kedua topic ────────────────────────────
client.on("message", async (topic, message) => {
  const raw = message.toString();
  console.log(`[MQTT ← ${topic}]`, raw);

  // Data sensor dari alat (sterilisasi/data)
  if (topic === topicData) {
    try {
      const data = JSON.parse(raw);
      const record = await new Sensor({
        suhu:    data.suhu,
        tekanan: data.tekanan,
        action:  data.action,
        waktu:   data.waktu,
        device:  data.Device,
      }).save();
      lastSensor = record;
      console.log("Sensor disimpan ✅");
    } catch (err) {
      console.error("Gagal simpan sensor ❌:", err.message);
    }
  }

  // Konfirmasi dari alat (sterilisasi/set) — log saja dulu
  if (topic === topicSet) {
    console.log("Pesan di sterilisasi/set diterima:", raw);
    // Nanti bisa ditambah logic update status sesi di DB
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
  publishSet,
  getLastSensor: () => lastSensor,
};