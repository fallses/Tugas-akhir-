require("dotenv").config();
const mqtt = require("mqtt");
const broker = "mqtt://broker.hivemq.com";
const { Set, Running, Finish } = require("../models/sterilisasi");

/**
 * TOPIK MQTT (sesuai format alat ESP32):
 *
 * SUBSCRIBE (menerima dari perangkat):
 *   sterilisasi/set      — konfirmasi START dari perangkat
 *     payload: { action: "start", suhu, tekanan, waktu, Device }
 *     waktu format: "HH:MM" (contoh: "00:30")
 *
 *   sterilisasi/running  — respon proses dari perangkat
 *     payload: { action, suhu, tekanan, timer, Device, sesi, status }
 *     action yang dikenali:
 *       "countdown" → countdown dimulai
 *       "ignition"  → proses penyalaan api (sesi: "1"/"2"/"3", status: "prosesing"/"api menyala")
 *       "running"   → proses sterilisasi berjalan (timer format: "HH:MM:SS")
 *       "stop"      → proses dihentikan
 *
 *   sterilisasi/finish   — sinyal selesai dari perangkat
 *     payload: { action: "finish", suhu, tekanan, waktu, Device }
 *     waktu format: "HH:MM" (durasi yang diset)
 *
 * PUBLISH (mengirim ke perangkat):
 *   sterilisasi/set      — perintah START ke perangkat
 *     payload: { action: "start", suhu, tekanan, waktu, Device }
 *     waktu format: "HH:MM" (contoh: "00:30")
 *
 *   sterilisasi/running  — perintah STOP ke perangkat
 *     payload: { action: "stop", Device }
 */

const SUBSCRIBE_RUNNING = "sterilisasi/running";
const SUBSCRIBE_FINISH  = "sterilisasi/finish";
const SUBSCRIBE_SET     = "sterilisasi/set";
const PUBLISH_SET       = "sterilisasi/set";
const PUBLISH_RUNNING   = "sterilisasi/running";

const client = mqtt.connect(broker);

let lastData       = null;
let lastFinishData = null;

client.on("connect", () => {
  console.log("MQTT Terhubung ✅ →", broker);

  client.subscribe(SUBSCRIBE_RUNNING, (err) => {
    if (!err) console.log("Subscribe ke topic:", SUBSCRIBE_RUNNING);
    else console.error("Gagal subscribe:", err.message);
  });

  client.subscribe(SUBSCRIBE_FINISH, (err) => {
    if (!err) console.log("Subscribe ke topic:", SUBSCRIBE_FINISH);
    else console.error("Gagal subscribe:", err.message);
  });

  client.subscribe(SUBSCRIBE_SET, (err) => {
    if (!err) console.log("Subscribe ke topic:", SUBSCRIBE_SET);
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
  // Alat mengirim konfirmasi START dengan format:
  // {"action":"start","suhu":120,"tekanan":1.0,"waktu":"00:30","Device":"AUTOCLAVE-01"}
  if (receivedTopic === SUBSCRIBE_SET) {
    const action = data.action ?? null;
    
    console.log(`[sterilisasi/set] Menerima konfirmasi dari alat: ${action}`);
    
    try {
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
        setData.waktu = data.waktu; // Format: "HH:MM"
      }

      await new Set(setData).save();
      
      console.log(`[sterilisasi/set] Data berhasil disimpan ke collection Set: action=${action}`);
    } catch (error) {
      console.error("[sterilisasi/set] Gagal simpan ke DB:", error.message);
    }
    return;
  }

  // ── Topik sterilisasi/finish ──────────────────────────────
  // Alat mengirim sinyal selesai dengan format:
  // {"action":"finish","suhu":120.5,"tekanan":1.2,"waktu":"00:30","Device":"AUTOCLAVE-01"}
  if (receivedTopic === SUBSCRIBE_FINISH) {
    const finishData = {
      action:  data.action  ?? "finish",
      suhu:    data.suhu    ?? null,
      tekanan: data.tekanan ?? null,
      waktu:   data.waktu   ?? fallbackWaktu, // Format: "HH:MM"
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
  // Alat mengirim berbagai action:
  // - countdown: {"action":"countdown","Device":"AUTOCLAVE-01"}
  // - ignition: {"action":"ignition","sesi":"1","status":"prosesing","Device":"AUTOCLAVE-01"}
  // - running: {"action":"running","suhu":120.5,"tekanan":1.2,"timer":"00:29:45","Device":"AUTOCLAVE-01"}
  // - stop: {"action":"stop","Device":"AUTOCLAVE-01"}
  const action = data.action ?? null;
  if (!action) {
    console.warn("Tidak ada field action di payload, diabaikan");
    return;
  }

  // Hanya proses action yang dikenali
  const validActions = ["countdown", "running", "ignition", "stop", "ignition_failed"];
  if (!validActions.includes(action)) {
    console.warn("Action tidak dikenali:", action);
    return;
  }

  const runningData = {
    action,
    suhu:    data.suhu    ?? null,
    tekanan: data.tekanan ?? null,
    timer:   data.timer   ?? null,  // Format: "HH:MM:SS" untuk action "running"
    device:  data.Device  ?? data.device ?? null,
    sesi:    data.sesi    ?? null,    // Untuk action "ignition"
    status:  data.status  ?? null,    // Untuk action "ignition"
    percobaan: data.percobaan ?? null, // Untuk action "ignition_failed"
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
  
  // Publish perintah START ke alat (topik: sterilisasi/set)
  // Format: {"action":"start","suhu":120,"tekanan":1.0,"waktu":"00:30","Device":"AUTOCLAVE-01"}
  publishSet: (payload) => {
    return new Promise((resolve, reject) => {
      client.publish(PUBLISH_SET, JSON.stringify(payload), (err) => {
        if (err) reject(err);
        else {
          console.log(`[PUBLISH] ${PUBLISH_SET}:`, JSON.stringify(payload));
          resolve();
        }
      });
    });
  },
  
  // Publish perintah STOP ke alat (topik: sterilisasi/running)
  // Format: {"action":"stop","Device":"AUTOCLAVE-01"}
  publishStop: (payload) => {
    return new Promise((resolve, reject) => {
      client.publish(PUBLISH_RUNNING, JSON.stringify(payload), (err) => {
        if (err) reject(err);
        else {
          console.log(`[PUBLISH] ${PUBLISH_RUNNING}:`, JSON.stringify(payload));
          resolve();
        }
      });
    });
  },
};
