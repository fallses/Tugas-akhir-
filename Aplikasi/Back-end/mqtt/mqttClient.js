require("dotenv").config();
const mqtt = require("mqtt");
const broker = "mqtt://broker.hivemq.com";
const Data = require("../models/data");

/**
 * TOPIK MQTT:
 *
 * SUBSCRIBE (menerima dari perangkat):
 *   sterilisasi/running  — respon proses dari perangkat (countdown, running, ignition)
 *     payload: { action, suhu, tekanan, waktu, Device, sesi, status }
 *     action yang dikenali:
 *       "countdown" → pindah ke CountdownScreen
 *       "running"   → pindah ke RunningScreen
 *       "ignition"  → pindah ke IgnitionScreen
 *
 *   sterilisasi/finish   — sinyal selesai dari perangkat
 *     payload: { suhu, tekanan, waktu, Device }
 *     → pindah ke FinishScreen
 *
 * PUBLISH (mengirim ke perangkat):
 *   sterilisasi/set      — perintah dari aplikasi ke perangkat
 *     payload: { action, suhu, tekanan, waktu, Device }
 *     action yang dikirim:
 *       "start" → mulai proses
 *       "stop"  → hentikan proses
 */

const SUBSCRIBE_TOPIC  = "sterilisasi/running";
const FINISH_TOPIC     = "sterilisasi/finish";
const PUBLISH_TOPIC    = "sterilisasi/set";

const client = mqtt.connect(broker);

let lastData       = null;
let lastFinishData = null;

client.on("connect", () => {
  console.log("MQTT Terhubung ✅ →", broker);

  client.subscribe(SUBSCRIBE_TOPIC, (err) => {
    if (!err) console.log("Subscribe ke topic:", SUBSCRIBE_TOPIC);
    else console.error("Gagal subscribe:", err.message);
  });

  client.subscribe(FINISH_TOPIC, (err) => {
    if (!err) console.log("Subscribe ke topic:", FINISH_TOPIC);
    else console.error("Gagal subscribe:", err.message);
  });
});

client.on("message", async (receivedTopic, message) => {
  const raw = message.toString();
  console.log(`[${receivedTopic}] Data masuk:`, raw);

  let data = {};
  try {
    data = JSON.parse(raw);
  } catch {
    console.warn("Payload bukan JSON, diabaikan");
    return;
  }

  const now = new Date();
  const fallbackWaktu = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  // ── Topik sterilisasi/finish ──────────────────────────────
  if (receivedTopic === FINISH_TOPIC) {
    lastFinishData = {
      suhu:    data.suhu    ?? null,
      tekanan: data.tekanan ?? null,
      waktu:   data.waktu   ?? fallbackWaktu,
      device:  data.Device  ?? data.device ?? null,
    };
    console.log("lastFinishData diperbarui:", lastFinishData);

    try {
      await new Data({
        suhu:    data.suhu,
        tekanan: data.tekanan,
        action:  "finish",
        waktu:   lastFinishData.waktu,
        device:  lastFinishData.device,
      }).save();
    } catch (error) {
      console.error("Gagal simpan finish ke DB:", error.message);
    }
    return;
  }

  // ── Topik sterilisasi/running ─────────────────────────────
  const action = data.action ?? null;
  if (!action) {
    console.warn("Tidak ada field action di payload, diabaikan");
    return;
  }

  // Hanya proses action yang dikenali (finish sudah ditangani topik sendiri)
  const validActions = ["countdown", "running", "ignition"];
  if (!validActions.includes(action)) {
    console.warn("Action tidak dikenali:", action);
    return;
  }

  lastData = {
    action,
    suhu:    data.suhu    ?? null,
    tekanan: data.tekanan ?? null,
    waktu:   data.waktu   ?? fallbackWaktu,
    device:  data.Device  ?? data.device ?? null,
    sesi:    data.sesi    ?? null,
    status:  data.status  ?? null,
  };
  console.log("lastData diperbarui:", lastData);

  try {
    await new Data({
      suhu:    data.suhu,
      tekanan: data.tekanan,
      action,
      waktu:   lastData.waktu,
      device:  lastData.device,
    }).save();
  } catch (error) {
    console.error("Gagal simpan ke DB:", error.message);
  }
});

module.exports = {
  client,
  getLastData:        () => lastData,
  consumeAction:      () => { if (lastData) lastData.action = null; },
  getLastFinishData:  () => lastFinishData,
  consumeFinish:      () => { lastFinishData = null; },
  PUBLISH_TOPIC,
};
