#include <WiFi.h>
#include <PubSubClient.h>

// ================= WIFI =================
const char* ssid = "TIGAKATA DEPAN";
const char* password = "1234567890";

// ================= MQTT =================
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* topic = "sterilisasi/data";

WiFiClient espClient;
PubSubClient client(espClient);

// ================= CONNECT WIFI =================
void setup_wifi() {
  delay(1000);
  Serial.println("Connecting to WiFi...");

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected!");
}

// ================= MQTT =================
void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");

    if (client.connect("ESP32_Serial_Test")) {
      Serial.println("Connected!");
    } else {
      Serial.print("Failed, rc=");
      Serial.print(client.state());
      Serial.println(" coba lagi...");
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);

  Serial.println("\nKetik 'kirim' di Serial Monitor untuk publish data");
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // ================= BACA SERIAL =================
  if (Serial.available()) {
    String perintah = Serial.readStringUntil('\n');
    perintah.trim();

    if (perintah == "kirim") {
      String data = "{";
      data += "\"action\":running,";
      data += "\"suhu\": 121,";
      data += "\"tekanan\": 1.5,";
      data += "\"waktu\": 01:30,";
      data += "\"Device\":\"AUTOCLAVE-01\"";
      data += "}";

      client.publish(topic, data.c_str());

      Serial.println("Data terkirim: " + data);
    }
  }
}
