#include <WiFi.h>
#include <PubSubClient.h>

// ================= WIFI =================
const char* ssid = "Margin Atas";
const char* password = "Marginescape*";

// ================= MQTT =================
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* mqtt_topic_1 = "sterilisasi/set";
const char* mqtt_topic_2 = "sterilisasi/running";
const char* mqtt_topic_3 = "sterilisasi/finiash";

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

// ================= MQTT RECONNECT =================
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

// ================= FUNGSI PUBLISH IGNITION =================
void publishIgnition(String sesi, String status) {
  String data = "{";
  data += "\"action\": \"ignition\",";
  data += "\"sesi\": \"" + sesi + "\",";
  data += "\"status\": \"" + status + "\",";
  data += "\"Device\": \"AUTOCLAVE-01\"";
  data += "}";

  if (client.publish(mqtt_topic_2, data.c_str())) {
    Serial.println("Data berhasil dikirim ke topik: " + String(mqtt_topic_2));
    Serial.println("Payload: " + data);
  } else {
    Serial.println("Gagal mengirim data!");
  }
}

void setup() {
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  Serial.println("\nPerintah tersedia:");
  Serial.println("  'set'                    -> kirim data start ke sterilisasi/set");
  Serial.println("  'countdown'              -> kirim data countdown ke sterilisasi/running");
  Serial.println("  'running'                -> kirim data running ke sterilisasi/running");
  Serial.println("  'ignition 1 prosesing'   -> kirim ignition sesi 1 status prosesing");
  Serial.println("  'ignition 2 prosesing'   -> kirim ignition sesi 2 status prosesing");
  Serial.println("  'ignition 3 prosesing'   -> kirim ignition sesi 3 status prosesing");
  Serial.println("  'ignition 1 api menyala' -> kirim ignition sesi 1 status api menyala");
  Serial.println("  'ignition 2 api menyala' -> kirim ignition sesi 2 status api menyala");
  Serial.println("  'ignition 3 api menyala' -> kirim ignition sesi 3 status api menyala");
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

    // ================= PERINTAH: set =================
    if (perintah == "set") {
      String data = "{";
      data += "\"action\": \"start\",";
      data += "\"suhu\": 121,";
      data += "\"tekanan\": 1.5,";
      data += "\"waktu\": \"01:30\",";
      data += "\"Device\": \"AUTOCLAVE-01\"";
      data += "}";

      if (client.publish(mqtt_topic_1, data.c_str())) {
        Serial.println("Data berhasil dikirim ke topik: " + String(mqtt_topic_1));
        Serial.println("Payload: " + data);
      } else {
        Serial.println("Gagal mengirim data!");
      }
    }

    // ================= PERINTAH: countdown =================
    else if (perintah == "countdown") {
      String data = "{";
      data += "\"action\": \"countdown\",";
      data += "\"Device\": \"AUTOCLAVE-01\"";
      data += "}";

      if (client.publish(mqtt_topic_2, data.c_str())) {
        Serial.println("Data berhasil dikirim ke topik: " + String(mqtt_topic_2));
        Serial.println("Payload: " + data);
      } else {
        Serial.println("Gagal mengirim data!");
      }
    }

    // ================= PERINTAH: running =================
    else if (perintah == "running") {
      String data = "{";
      data += "\"action\": \"running\",";
      data += "\"suhu\": 121,";
      data += "\"tekanan\": 1.5,";
      data += "\"waktu\": \"01:30\",";
      data += "\"Device\": \"AUTOCLAVE-01\"";
      data += "}";

      if (client.publish(mqtt_topic_2, data.c_str())) {
        Serial.println("Data berhasil dikirim ke topik: " + String(mqtt_topic_2));
        Serial.println("Payload: " + data);
      } else {
        Serial.println("Gagal mengirim data!");
      }
    }
    // ================= PERINTAH: finish =================
    else if (perintah == "finish") {
      String data = "{";
      data += "\"action\": \"finish\",";
      data += "\"suhu\": 121,";
      data += "\"tekanan\": 1.5,";
      data += "\"waktu\": \"01:30\",";
      data += "\"Device\": \"AUTOCLAVE-01\"";
      data += "}";

      if (client.publish(mqtt_topic_3, data.c_str())) {
        Serial.println("Data berhasil dikirim ke topik: " + String(mqtt_topic_3));
        Serial.println("Payload: " + data);
      } else {
        Serial.println("Gagal mengirim data!");
      }
    }

    // ================= PERINTAH: ignition prosesing =================
    else if (perintah == "ignition 1 prosesing") {
      publishIgnition("1", "prosesing");
    }
    else if (perintah == "ignition 2 prosesing") {
      publishIgnition("2", "prosesing");
    }
    else if (perintah == "ignition 3 prosesing") {
      publishIgnition("3", "prosesing");
    }

    // ================= PERINTAH: ignition api menyala =================
    else if (perintah == "ignition 1 api menyala") {
      publishIgnition("1", "api menyala");
    }
    else if (perintah == "ignition 2 api menyala") {
      publishIgnition("2", "api menyala");
    }
    else if (perintah == "ignition 3 api menyala") {
      publishIgnition("3", "api menyala");
    }


    // ================= PERINTAH TIDAK DIKENAL =================
    else {
      Serial.println("Perintah tidak dikenal: " + perintah);
      Serial.println("Gunakan perintah yang tersedia (lihat daftar di atas)");
    }
  }
}
