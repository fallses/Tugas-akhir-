/**
 * Script untuk testing MQTT secara manual
 * Jalankan dengan: node test-mqtt.js
 */

const mqtt = require("mqtt");

const broker = "mqtt://broker.hivemq.com";
const client = mqtt.connect(broker);

const DEVICE_ID = "AUTOCLAVE-01";

client.on("connect", () => {
  console.log("✅ Terhubung ke broker:", broker);
  console.log("");
  
  // Subscribe ke semua topik sterilisasi
  client.subscribe("sterilisasi/#", (err) => {
    if (!err) {
      console.log("✅ Subscribe ke: sterilisasi/#");
      console.log("");
      console.log("=".repeat(60));
      console.log("Menunggu pesan MQTT...");
      console.log("=".repeat(60));
      console.log("");
    }
  });
});

client.on("message", (topic, message) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] Topik: ${topic}`);
  console.log("Payload:", message.toString());
  
  try {
    const data = JSON.parse(message.toString());
    console.log("JSON:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.log("(Bukan JSON)");
  }
  
  console.log("-".repeat(60));
  console.log("");
});

// Fungsi helper untuk publish
function publishStart(suhu = 120, tekanan = 1.0, waktu = "00:30") {
  const payload = {
    action: "start",
    suhu: suhu,
    tekanan: tekanan,
    waktu: waktu,
    Device: DEVICE_ID
  };
  
  client.publish("sterilisasi/set", JSON.stringify(payload));
  console.log("📤 Mengirim perintah START:");
  console.log(JSON.stringify(payload, null, 2));
  console.log("");
}

function publishStop() {
  const payload = {
    action: "stop",
    Device: DEVICE_ID
  };
  
  client.publish("sterilisasi/running", JSON.stringify(payload));
  console.log("📤 Mengirim perintah STOP:");
  console.log(JSON.stringify(payload, null, 2));
  console.log("");
}

// Simulasi data dari alat (untuk testing tanpa alat fisik)
function simulateCountdown() {
  const payload = {
    action: "countdown",
    Device: DEVICE_ID
  };
  
  client.publish("sterilisasi/running", JSON.stringify(payload));
  console.log("🔄 Simulasi: Countdown");
}

function simulateIgnition(sesi = 1, status = "prosesing") {
  const payload = {
    action: "ignition",
    sesi: String(sesi),
    status: status,
    Device: DEVICE_ID
  };
  
  client.publish("sterilisasi/running", JSON.stringify(payload));
  console.log(`🔥 Simulasi: Ignition sesi ${sesi} - ${status}`);
}

function simulateRunning(suhu = 120.5, tekanan = 1.2, timer = "00:29:45") {
  const payload = {
    action: "running",
    suhu: suhu,
    tekanan: tekanan,
    timer: timer,
    Device: DEVICE_ID
  };
  
  client.publish("sterilisasi/running", JSON.stringify(payload));
  console.log("▶️  Simulasi: Running");
}

function simulateFinish(suhu = 120.5, tekanan = 1.2, waktu = "00:30") {
  const payload = {
    action: "finish",
    suhu: suhu,
    tekanan: tekanan,
    waktu: waktu,
    Device: DEVICE_ID
  };
  
  client.publish("sterilisasi/finish", JSON.stringify(payload));
  console.log("✅ Simulasi: Finish");
}

// Menu interaktif
console.log("");
console.log("=".repeat(60));
console.log("MQTT TEST TOOL - Autoclave Sterilisasi");
console.log("=".repeat(60));
console.log("");
console.log("Perintah yang tersedia:");
console.log("  1. publishStart()         - Kirim perintah START");
console.log("  2. publishStop()          - Kirim perintah STOP");
console.log("");
console.log("Simulasi (tanpa alat fisik):");
console.log("  3. simulateCountdown()    - Simulasi countdown");
console.log("  4. simulateIgnition()     - Simulasi ignition");
console.log("  5. simulateRunning()      - Simulasi running");
console.log("  6. simulateFinish()       - Simulasi finish");
console.log("");
console.log("Contoh:");
console.log("  > publishStart(120, 1.0, '00:30')");
console.log("  > simulateRunning(121.5, 1.3, '00:28:15')");
console.log("");
console.log("Tekan Ctrl+C untuk keluar");
console.log("=".repeat(60));
console.log("");

// Export fungsi agar bisa dipanggil dari REPL
global.publishStart = publishStart;
global.publishStop = publishStop;
global.simulateCountdown = simulateCountdown;
global.simulateIgnition = simulateIgnition;
global.simulateRunning = simulateRunning;
global.simulateFinish = simulateFinish;

// Jalankan REPL
const repl = require("repl");
const replServer = repl.start({
  prompt: "> ",
  useColors: true
});

// Cleanup saat exit
replServer.on("exit", () => {
  console.log("\n👋 Menutup koneksi MQTT...");
  client.end();
  process.exit(0);
});
