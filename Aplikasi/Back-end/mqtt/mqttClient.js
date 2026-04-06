const mqtt = require("mqtt");

const broker = "mqtt://broker.hivemq.com";
const topic = "sterilisasi/data";
const Data = require("../models/data");

const client = mqtt.connect(broker);

let lastData = null;

// koneksi MQTT
client.on("connect", () => {
  console.log("Terhubung ke MQTT broker");

  client.subscribe(topic, (err) => {
    if (!err) {
      console.log("Subscribe ke topic:", topic);
    }
  });
});

// menerima pesan (SATU SAJA)
client.on("message", async (topic, message) => {
  const raw = message.toString();
  console.log("Data masuk:", raw);

  // simpan raw data
  lastData = {
    topic: topic,
    value: raw,
    time: new Date(),
  };

  try {
    const data = JSON.parse(raw);

    console.log("Data valid:", data);

    await new Data({
      suhu: data.suhu,
      tekanan: data.tekanan,
      action: data.action,
      waktu: data.waktu,
      device: data.Device,
    }).save();

  } catch (error) {
    console.error("JSON tidak valid ❌:", raw);
  }
});

// export
module.exports = {
  client,
  getLastData: () => lastData,
};