const mqtt = require("mqtt");

const broker = "mqtt://broker.hivemq.com";
const topic = "sterilisasi/data";

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

// menerima pesan
client.on("message", (topic, message) => {
  const data = message.toString();
  console.log("Data masuk:", data);

  lastData = {
    topic: topic,
    value: data,
    time: new Date(),
  };
});

// export agar bisa dipakai di server.js
module.exports = {
  client,
  getLastData: () => lastData,
};