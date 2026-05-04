require("dotenv").config();
const mqtt   = require("mqtt");
const broker = "mqtt://broker.hivemq.com";
const { Set, Running, Finish } = require("../models/sterilisasi");

/**
 * TOPIK MQTT:
 *
 * SUBSCRIBE (menerima dari perangkat):
 *   sterilisasi/running  — respon proses (countdown, running, ignition)
 *   sterilisasi/finish   — sinyal selesai dari perangkat
 *   sterilisasi/set      — logging perintah yang dikirim ke perangkat
 *
 * PUBLISH (mengirim ke perangkat):
 *   sterilisasi/set      — perintah start dari aplikasi
 *   sterilisasi/running  — perintah stop dari aplikasi
 */

const SUBSCRIBE_TOPIC = "sterilisasi/running";
const FINISH_TOPIC    = "sterilisasi/finish";
const SET_TOPIC       = "sterilisasi/set";
const PUBLISH_TOPIC   = "sterilisasi/set";

const client = mqtt.connect(broker);

let lastData       = null;
let lastFinishData = null;
let finishConsumed = false;

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

  client.subscribe(SET_TOPIC, (err) => {
    if (!err) console.log("Subscribe ke topic:", SET_TOPIC);
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

  // ── Topik sterilisasi/set ─────────────────────────────────
  if (receivedTopic === SET_TOPIC) {
    const action = data.action ?? null;
    console.log(`[sterilisasi/set] Menerima perintah: ${action}`);
    try {
      const setData = {
        action,
        device:   data.Device  ?? data.device ?? "unknown",
        namaAlat: data.namaAlat ?? "",
        status:   action === "start" ? "running" : (action === "stop" ? "dihentikan" : "unknown"),
      };
      if (data.suhu    != null) setData.suhu    = data.suhu;
      if (data.tekanan != null) setData.tekanan = data.tekanan;
      if (data.waktu   != null) setData.waktu   = data.waktu;
      await new Set(setData).save();
      console.log(`[sterilisasi/set] Disimpan: action=${action}`);
    } catch (error) {
      console.error("[sterilisasi/set] Gagal simpan:", error.message);
    }
    return;
  }

  // ── Topik sterilisasi/finish ──────────────────────────────
  if (receivedTopic === FINISH_TOPIC) {
    lastFinishData = {
      suhu:    data.suhu    ?? null,
      tekanan: data.tekanan ?? null,
      waktu:   data.waktu   ?? fallbackWaktu,
      device:  data.Device  ?? data.device ?? null,
    };
    finishConsumed = false;
    console.log("lastFinishData diperbarui:", lastFinishData);
    try {
      await new Finish(lastFinishData).save();
      console.log("[sterilisasi/finish] Disimpan ke collection Finish");
    } catch (error) {
      console.error("[sterilisasi/finish] Gagal simpan:", error.message);
    }
    return;
  }

  // ── Topik sterilisasi/running ─────────────────────────────
  const action = data.action ?? null;
  if (!action) {
    console.warn("Tidak ada field action, diabaikan");
    return;
  }

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
    await new Running(lastData).save();
    console.log(`[sterilisasi/running] Disimpan: action=${action}`);
  } catch (error) {
    console.error("[sterilisasi/running] Gagal simpan:", error.message);
  }
});

module.exports = {
  client,
  getLastData:       () => lastData,
  consumeAction:     () => { if (lastData) lastData.action = null; },
  getLastFinishData: () => lastFinishData,
  consumeFinish:     () => { lastFinishData = null; finishConsumed = true; },
  isFinishConsumed:  () => finishConsumed,
  PUBLISH_TOPIC,
  publishSet: (payload) => {
    return new Promise((resolve, reject) => {
      client.publish(PUBLISH_TOPIC, JSON.stringify(payload), (err) => {
        if (err) reject(err);
        else { console.log(`[PUBLISH] ${PUBLISH_TOPIC}:`, JSON.stringify(payload)); resolve(); }
      });
    });
  },
  publishRunning: (payload) => {
    return new Promise((resolve, reject) => {
      client.publish(SUBSCRIBE_TOPIC, JSON.stringify(payload), (err) => {
        if (err) reject(err);
        else { console.log(`[PUBLISH] ${SUBSCRIBE_TOPIC}:`, JSON.stringify(payload)); resolve(); }
      });
    });
  },
};
