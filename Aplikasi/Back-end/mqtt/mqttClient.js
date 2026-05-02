require("dotenv").config();
const mqtt = require("mqtt");
const broker = "mqtt://broker.hivemq.com";
const { Set, Running, Finish } = require("../models/sterilisasi");

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
 *   sterilisasi/set      — perintah yang dikirim ke perangkat (juga di-subscribe untuk logging)
 *     payload: { action, suhu, tekanan, waktu, Device }
 *     action yang dikirim:
 *       "start" → mulai proses
 *       "stop"  → hentikan proses
 *
 * PUBLISH (mengirim ke perangkat):
 *   sterilisasi/set      — perintah dari aplikasi ke perangkat
 *     payload: { action, suhu, tekanan, waktu, Device }
 */

const SUBSCRIBE_TOPIC  = "sterilisasi/running";
const FINISH_TOPIC     = "sterilisasi/finish";
const SET_TOPIC        = "sterilisasi/set";
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
      // Simpan ke koleksi Set (collection baru khusus untuk topik sterilisasi/set)
      const setData = {
        action:   action,
        device:   data.Device  ?? data.device ?? "unknown",
        namaAlat: data.namaAlat ?? "",
        status:   action === "start" ? "running" : (action === "stop" ? "dihentikan" : "unknown"),
      };

      // Tambahkan field opsional jika ada
      if (data.suhu !== undefined && data.suhu !== null) {
        setData.suhu = data.suhu;
      }
      if (data.tekanan !== undefined && data.tekanan !== null) {
        setData.tekanan = data.tekanan;
      }
      if (data.waktu !== undefined && data.waktu !== null) {
        setData.waktu = data.waktu;
      }

      await new Set(setData).save();
      
      console.log(`[sterilisasi/set] Data berhasil disimpan ke collection Set: action=${action}`);
    } catch (error) {
      console.error("[sterilisasi/set] Gagal simpan ke DB:", error.message);
    }
    return;
  }

  // ── Topik sterilisasi/finish ──────────────────────────────
  if (receivedTopic === FINISH_TOPIC) {
    const finishData = {
      suhu:    data.suhu    ?? null,
      tekanan: data.tekanan ?? null,
      waktu:   data.waktu   ?? fallbackWaktu,
      device:  data.Device  ?? data.device ?? null,
    };
    
    lastFinishData = finishData;
    console.log("lastFinishData diperbarui:", lastFinishData);

    try {
      // Simpan ke collection Finish
      await new Finish(finishData).save();
      console.log("[sterilisasi/finish] Data berhasil disimpan ke collection Finish");
    } catch (error) {
      console.error("[sterilisasi/finish] Gagal simpan ke DB:", error.message);
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

  const runningData = {
    action,
    suhu:    data.suhu    ?? null,
    tekanan: data.tekanan ?? null,
    waktu:   data.waktu   ?? fallbackWaktu,
    device:  data.Device  ?? data.device ?? null,
    sesi:    data.sesi    ?? null,
    status:  data.status  ?? null,
  };
  
  lastData = runningData;
  console.log("lastData diperbarui:", lastData);

  try {
    // Simpan ke collection Running
    await new Running(runningData).save();
    console.log(`[sterilisasi/running] Data berhasil disimpan ke collection Running: action=${action}`);
  } catch (error) {
    console.error("[sterilisasi/running] Gagal simpan ke DB:", error.message);
  }
});

module.exports = {
  client,
  getLastData:        () => lastData,
  consumeAction:      () => { if (lastData) lastData.action = null; },
  getLastFinishData:  () => lastFinishData,
  consumeFinish:      () => { lastFinishData = null; },
  PUBLISH_TOPIC,
  publishSet: (payload) => {
    return new Promise((resolve, reject) => {
      client.publish(PUBLISH_TOPIC, JSON.stringify(payload), (err) => {
        if (err) reject(err);
        else {
          console.log(`[PUBLISH] ${PUBLISH_TOPIC}:`, JSON.stringify(payload));
          resolve();
        }
      });
    });
  },
};
