#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <Preferences.h>
#include <Adafruit_MAX31865.h>
#include <ESP32Servo.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

Preferences preferences;

#define DEVICE_ID "AUTOCLAVE-01"

// ================= OLED =================
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_ADDR 0x3C
#define SDA_PIN 21
#define SCL_PIN 22

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// ================= SENSOR & AKTUATOR =================
#define MAX_CS   5
#define MAX_MOSI 23
#define MAX_MISO 19
#define MAX_CLK  18

#define PRESSURE_PIN 34
#define RELAY_IGNITER 26
#define RELAY_VALVE   27
#define SERVO_PIN 4

Adafruit_MAX31865 max31865(MAX_CS, MAX_MOSI, MAX_MISO, MAX_CLK);
Servo gasServo;

#define RREF 430.0
#define RNOMINAL 100.0

float Kp = 3.0;
float Ki = 0.5;
float Kd = 1.0;

float integral = 0;
float previousError = 0;
unsigned long lastPID = 0;

// ================= BUTTON =================
#define BTN_UP     32
#define BTN_DOWN   33
#define BTN_SELECT 25

// ================= MODE =================
enum Mode {
  MODE_MAIN_MENU,
  MODE_STERIL,
  MODE_HISTORY,
  MODE_DETAIL,
  MODE_WIFI,
  MODE_COUNTDOWN,
  MODE_IGNITION,
  MODE_RUNNING,
  MODE_FINISH
};

Mode currentMode = MODE_MAIN_MENU;

// ================= MENU =================
// 0=Sterilisasi, 1=History, 2=Detail
int menuIndex = 0;

// ================= WIFI =================
int detailIndex = 0;

// ===== WIFI STATE =====
enum WifiState {
  WIFI_MENU,
  WIFI_SCAN,
  WIFI_PASSWORD,
  WIFI_CONNECT,
  WIFI_STATUS
};

WifiState wifiState = WIFI_MENU;

// ===== WIFI DATA =====
int wifiMenuIndex = 0;
int wifiIndex = 0;
int wifiCount = 0;
String wifiSSID[10];
bool wifiConnected = false;
int wifiScroll = 0;
String wifiPassword = "";
int passCursor = 0;
char currentChar = 'a';

const char charset[] =
  "abcdefghijklmnopqrstuvwxyz"
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  "0123456789";
int charsetLength = 62;
String connectedSSID = "";

// ===== PASSWORD MENU =====
int passMenuIndex = 0;
bool passMenuMode = false;

// ================= STERILISASI =================
int sterilIndex = 0;
bool editMode = false;

int setSuhu = 120;
float setTekanan = 1.0;
int durasiJam = 0;
int durasiMenit = 30;
int durasiCursor = 0;

// ================= TIMER =================
unsigned long lastMillis = 0;
long sisaDetik = 0;
bool komporON = false;

// ================= SUHU REAL =================
float suhuAwal = 0;
int ignitionRetry = 0;
const int maxRetry = 3;
bool apiTerdeteksi = false;

// ===== KONTROL SERVO 4 LEVEL =====
// [DIUBAH] dari 3 level menjadi 4 level sesuai program referensi
#define SERVO_LEVEL_0  180   // gas tertutup
#define SERVO_LEVEL_1  140   // gas kecil
#define SERVO_LEVEL_2  110   // gas sedang
#define SERVO_LEVEL_3  80    // gas besar

// ================= MQTT =================
const char* mqtt_server   = "broker.hivemq.com";
const int   mqtt_port     = 1883;
const char* mqtt_topic_1  = "sterilisasi/set";
const char* mqtt_topic_2  = "sterilisasi/running";
const char* mqtt_topic_3  = "sterilisasi/finish";

WiFiClient  espClient;
PubSubClient mqttClient(espClient);

bool mqttStartRequest = false;
bool mqttStopRequest  = false;

// ===== TIMER MQTT RUNNING =====
unsigned long lastMqttRunning = 0;
const unsigned long mqttRunningInterval = 2000;

// ================= HISTORY =================
#define HISTORY_MAX 10

struct HistoryEntry {
  int    no;
  int    suhu;
  float  tekanan;
  int    jam;
  int    menit;
  String status;  // "SELESAI" atau "DIHENTIKAN"
};

HistoryEntry historyList[HISTORY_MAX];
int historyCount = 0;

// State layar History
enum HistoryState {
  HIST_LIST,
  HIST_DETAIL,
  HIST_CONFIRM_DEL
};

HistoryState historyState  = HIST_LIST;
int historyIndex  = 0;  // kursor di list (0..historyCount-1 = entry, historyCount = area bawah)
int historyScroll = 0;  // scroll offset
int histMenuIndex = 0;  // 0=Hapus Semua, 1=Back (di area bawah list & konfirmasi)

// ===== Simpan history ke NVS =====
void historySave() {
  Preferences h;
  h.begin("history", false);
  h.putInt("count", historyCount);
  for (int i = 0; i < historyCount; i++) {
    String p = "h" + String(i);
    h.putInt(   (p + "no").c_str(), historyList[i].no);
    h.putInt(   (p + "s").c_str(),  historyList[i].suhu);
    h.putFloat( (p + "t").c_str(),  historyList[i].tekanan);
    h.putInt(   (p + "j").c_str(),  historyList[i].jam);
    h.putInt(   (p + "m").c_str(),  historyList[i].menit);
    h.putString((p + "st").c_str(), historyList[i].status);
  }
  h.end();
}

// ===== Muat history dari NVS =====
void historyLoad() {
  Preferences h;
  h.begin("history", true);
  historyCount = h.getInt("count", 0);
  if (historyCount > HISTORY_MAX) historyCount = HISTORY_MAX;
  for (int i = 0; i < historyCount; i++) {
    String p = "h" + String(i);
    historyList[i].no      = h.getInt(   (p + "no").c_str(), i + 1);
    historyList[i].suhu    = h.getInt(   (p + "s").c_str(),  120);
    historyList[i].tekanan = h.getFloat( (p + "t").c_str(),  1.0);
    historyList[i].jam     = h.getInt(   (p + "j").c_str(),  0);
    historyList[i].menit   = h.getInt(   (p + "m").c_str(),  30);
    historyList[i].status  = h.getString((p + "st").c_str(), "SELESAI");
  }
  h.end();
  Serial.println("[HISTORY] Dimuat: " + String(historyCount) + " entri.");
}

// ===== Tambah 1 entry history (entry baru di posisi 0 / paling atas) =====
void historyAdd(String status) {
  // Jika penuh, buang yang paling lama (index terakhir)
  if (historyCount == HISTORY_MAX) {
    historyCount = HISTORY_MAX - 1;
  }

  // Geser semua entry ke bawah satu slot
  for (int i = historyCount; i > 0; i--) {
    historyList[i] = historyList[i - 1];
  }

  // Nomor urut = nomor entry sebelumnya + 1 (atau 1 jika pertama)
  int newNo = (historyCount > 0) ? historyList[1].no + 1 : 1;

  historyList[0].no      = newNo;
  historyList[0].suhu    = setSuhu;
  historyList[0].tekanan = setTekanan;
  historyList[0].jam     = durasiJam;
  historyList[0].menit   = durasiMenit;
  historyList[0].status  = status;
  historyCount++;

  historySave();

  Serial.println("[HISTORY] Disimpan #" + String(newNo) +
                 " | " + status +
                 " | Suhu=" + String(setSuhu) +
                 "C | Tek=" + String(setTekanan, 1) +
                 "bar | " + String(durasiJam) + "j" + String(durasiMenit) + "m");
}

// ===== Hapus semua history =====
void historyClear() {
  historyCount = 0;
  Preferences h;
  h.begin("history", false);
  h.clear();
  h.end();
  Serial.println("[HISTORY] Semua history dihapus.");
}

// ===== Hapus satu entry berdasarkan index =====
void historyDeleteOne(int idx) {
  if (idx < 0 || idx >= historyCount) return;
  Serial.println("[HISTORY] Hapus entry #" + String(historyList[idx].no));
  for (int i = idx; i < historyCount - 1; i++) {
    historyList[i] = historyList[i + 1];
  }
  historyCount--;
  historySave();
}

// ================= MQTT CALLBACK =================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String msg = "";
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];

  Serial.println("[MQTT] ← Topik : " + String(topic));
  Serial.println("[MQTT]   Payload: " + msg);

  // ===== sterilisasi/set =====
  if (String(topic) == mqtt_topic_1) {
    StaticJsonDocument<256> doc;
    DeserializationError err = deserializeJson(doc, msg);
    if (err) {
      Serial.println("[MQTT] ✗ JSON tidak valid: " + String(err.c_str()));
      return;
    }

    String deviceId = doc["Device"] | "";
    if (deviceId != "" && deviceId != String(DEVICE_ID)) {
      Serial.println("[MQTT] ✗ Device ID tidak cocok, abaikan."); return;
    }

    String action = doc["action"] | "";
    if (action == "start") {
      int   suhu_baru  = doc["suhu"]    | setSuhu;
      float tek_baru   = doc["tekanan"] | setTekanan;
      String waktu_str = doc["waktu"]   | "00:30";

      int jam_baru = 0, menit_baru = 30;
      if (waktu_str.length() >= 5 && waktu_str.charAt(2) == ':') {
        jam_baru   = waktu_str.substring(0, 2).toInt();
        menit_baru = waktu_str.substring(3, 5).toInt();
      } else {
        Serial.println("[MQTT] ✗ Format waktu tidak valid, gunakan HH:MM");
      }

      suhu_baru  = constrain(suhu_baru, 0, 200);
      tek_baru   = constrain(tek_baru,  0, 10);
      jam_baru   = constrain(jam_baru,  0, 23);
      menit_baru = constrain(menit_baru, 0, 59);

      setSuhu = suhu_baru; setTekanan = tek_baru;
      durasiJam = jam_baru; durasiMenit = menit_baru;

      Serial.println("[MQTT] ✓ START: Suhu=" + String(setSuhu) +
                     " Tek=" + String(setTekanan, 1) +
                     " Dur=" + String(durasiJam) + "j" + String(durasiMenit) + "m");

      if (currentMode == MODE_MAIN_MENU || currentMode == MODE_STERIL || currentMode == MODE_DETAIL) {
        mqttStartRequest = true;
        Serial.println("[MQTT] ✓ Flag START diset.");
      } else {
        Serial.println("[MQTT] ✗ Alat berjalan, START diabaikan.");
      }
    }
  }

  // ===== sterilisasi/running =====
  else if (String(topic) == mqtt_topic_2) {
    StaticJsonDocument<128> doc;
    DeserializationError err = deserializeJson(doc, msg);
    if (err) {
      Serial.println("[MQTT] ✗ JSON tidak valid: " + String(err.c_str()));
      return;
    }

    String deviceId = doc["Device"] | "";
    if (deviceId != "" && deviceId != String(DEVICE_ID)) {
      Serial.println("[MQTT] ✗ Device ID tidak cocok, abaikan."); return;
    }

    String action = doc["action"] | "";
    if (action == "stop") {
      Serial.println("[MQTT] ✓ Perintah STOP diterima.");
      if (currentMode == MODE_RUNNING || currentMode == MODE_IGNITION || currentMode == MODE_COUNTDOWN) {
        mqttStopRequest = true;
        Serial.println("[MQTT] ✓ Flag STOP diset.");
      } else {
        Serial.println("[MQTT] ✗ Alat tidak berjalan, STOP diabaikan.");
      }
    }
  }
}

// ================= FUNGSI MQTT =================
void oledMqttStatus(bool success) {
  for (int i = 0; i < 2; i++) {
    display.fillCircle(122, 60, 2, SSD1306_WHITE); display.display(); delay(150);
    display.fillCircle(122, 60, 2, SSD1306_BLACK); display.display(); delay(150);
  }
}

void drawStatusIcons() {
  if (wifiConnected) {
    display.drawPixel(108, 7, SSD1306_WHITE);
    display.drawLine(107, 6, 109, 6, SSD1306_WHITE);
    display.drawLine(106, 5, 110, 5, SSD1306_WHITE);
    display.drawLine(105, 4, 111, 4, SSD1306_WHITE);
  }
  if (mqttClient.connected()) {
    display.drawLine(118, 3, 118, 7, SSD1306_WHITE);
    display.drawLine(118, 3, 120, 5, SSD1306_WHITE);
    display.drawLine(120, 5, 122, 3, SSD1306_WHITE);
    display.drawLine(122, 3, 122, 7, SSD1306_WHITE);
  }
}

void mqttPublish(const char* topic, String payload) {
  if (!mqttClient.connected()) {
    Serial.println("[MQTT] ✗ Tidak terhubung. Gunakan Detail > [Hubungkan MQTT].");
    return;
  }
  bool ok = mqttClient.publish(topic, payload.c_str());
  if (ok) {
    Serial.println("[MQTT] → " + String(topic) + " : " + payload);
    oledMqttStatus(true);
  } else {
    Serial.println("[MQTT] ✗ Gagal kirim ke: " + String(topic));
  }
}

bool mqttConnectNow() {
  if (!wifiConnected) return false;
  if (mqttClient.connected()) return true;
  unsigned long t = millis();
  while (millis() - t < 5000) {
    if (mqttClient.connect("ESP32_Autoclave_01")) {
      mqttClient.subscribe(mqtt_topic_1);
      mqttClient.subscribe(mqtt_topic_2);
      return true;
    }
    delay(500);
  }
  return false;
}

void mqttDisconnectNow() {
  if (mqttClient.connected()) mqttClient.disconnect();
}

// ================= FUNGSI PUBLISH =================
void mqttPublishSet() {
  String waktu = "";
  if (durasiJam < 10) waktu += "0";
  waktu += String(durasiJam) + ":";
  if (durasiMenit < 10) waktu += "0";
  waktu += String(durasiMenit);

  String data = "{";
  data += "\"action\": \"start\",";
  data += "\"suhu\": " + String(setSuhu) + ",";
  data += "\"tekanan\": " + String(setTekanan, 1) + ",";
  data += "\"waktu\": \"" + waktu + "\",";
  data += "\"Device\": \"" + String(DEVICE_ID) + "\"";
  data += "}";
  Serial.println("[MQTT] --- Kirim SET ---");
  mqttPublish(mqtt_topic_1, data);
}

void mqttPublishStop() {
  String data = "{\"action\": \"stop\",\"Device\": \"" + String(DEVICE_ID) + "\"}";
  Serial.println("[MQTT] --- Kirim STOP ---");
  mqttPublish(mqtt_topic_2, data);
}

void mqttPublishCountdown() {
  String data = "{\"action\": \"countdown\",\"Device\": \"" + String(DEVICE_ID) + "\"}";
  Serial.println("[MQTT] --- Kirim COUNTDOWN ---");
  mqttPublish(mqtt_topic_2, data);
}

void mqttPublishIgnition(int sesi, String status) {
  String data = "{";
  data += "\"action\": \"ignition\",";
  data += "\"sesi\": \"" + String(sesi) + "\",";
  data += "\"status\": \"" + status + "\",";
  data += "\"Device\": \"" + String(DEVICE_ID) + "\"";
  data += "}";
  Serial.println("[MQTT] --- Kirim IGNITION sesi " + String(sesi) + " : " + status + " ---");
  mqttPublish(mqtt_topic_2, data);
}

void mqttPublishRunning(float suhu, float tekanan) {
  int jam = sisaDetik / 3600, menit = (sisaDetik % 3600) / 60, detik = sisaDetik % 60;
  String timerStr = "";
  if (jam   < 10) timerStr += "0"; timerStr += String(jam)   + ":";
  if (menit < 10) timerStr += "0"; timerStr += String(menit) + ":";
  if (detik < 10) timerStr += "0"; timerStr += String(detik);

  String data = "{";
  data += "\"action\": \"running\",";
  data += "\"suhu\": " + String(suhu, 1) + ",";
  data += "\"tekanan\": " + String(tekanan, 1) + ",";
  data += "\"timer\": \"" + timerStr + "\",";
  data += "\"Device\": \"" + String(DEVICE_ID) + "\"";
  data += "}";
  mqttPublish(mqtt_topic_2, data);
}

void mqttPublishFinish(float suhu, float tekanan) {
  String waktu = "";
  if (durasiJam < 10) waktu += "0"; waktu += String(durasiJam) + ":";
  if (durasiMenit < 10) waktu += "0"; waktu += String(durasiMenit);

  String data = "{";
  data += "\"action\": \"finish\",";
  data += "\"suhu\": " + String(suhu, 1) + ",";
  data += "\"tekanan\": " + String(tekanan, 1) + ",";
  data += "\"waktu\": \"" + waktu + "\",";
  data += "\"Device\": \"" + String(DEVICE_ID) + "\"";
  data += "}";
  Serial.println("[MQTT] --- Kirim FINISH ---");
  mqttPublish(mqtt_topic_3, data);
}

// ================= WELCOME =================
void welcomeAnimation() {
  display.setTextSize(1);

  String line1 = "WELCOME TO";
  String line2 = String(DEVICE_ID);
  int line1X = (SCREEN_WIDTH - (int)line1.length() * 6) / 2;
  int line2X = (SCREEN_WIDTH - (int)line2.length() * 6) / 2;

  // Baris 1 slide dari kanan ke tengah
  for (int x = SCREEN_WIDTH; x >= line1X; x -= 3) {
    display.clearDisplay();
    display.setCursor(x, 22);
    display.print(line1);
    display.display();
    delay(10);
  }

  // Baris 2 naik dari bawah ke bawah baris 1
  for (int y = SCREEN_HEIGHT; y >= 34; y -= 3) {
    display.clearDisplay();
    display.setCursor(line1X, 22);
    display.print(line1);
    display.setCursor(line2X, y);
    display.print(line2);
    display.display();
    delay(10);
  }
  delay(800);
}

// ===== LAYAR BOOTING =====
void drawBooting(String step, int progress) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(25, 2);  display.print("BOOTING...");
  display.setCursor(20, 14); display.print(DEVICE_ID);
  display.setCursor(0, 30);  display.print(step);
  display.drawRect(4, 44, 120, 6, SSD1306_WHITE);
  int barWidth = (progress * 116) / 100;
  display.fillRect(6, 46, barWidth, 2, SSD1306_WHITE);
  display.setCursor(52, 54); display.print(progress); display.print("%");
  display.display();
}

// ================= MAIN MENU =================
void drawMainMenu() {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.print("MENU UTAMA");

  display.setCursor(0, 16);
  display.print(menuIndex == 0 ? "> " : "  ");
  display.print("Sterilisasi");

  display.setCursor(0, 28);
  display.print(menuIndex == 1 ? "> " : "  ");
  display.print("History");

  display.setCursor(0, 40);
  display.print(menuIndex == 2 ? "> " : "  ");
  display.print("Detail");

  drawStatusIcons();
  display.display();
}

// ================= HISTORY SCREENS =================

// Layar daftar history
void drawHistoryList() {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.print("HISTORY");

  // Jika kosong
  if (historyCount == 0) {
    display.setCursor(5, 25);
    display.print("Belum ada history.");
    display.setCursor(0, 54);
    display.print("> Back");
    display.display();
    return;
  }

  // Tampilkan 3 entry sekaligus dengan scroll
  int maxShow = 3;
  if (historyIndex < historyScroll) historyScroll = historyIndex;
  if (historyIndex < historyCount && historyIndex >= historyScroll + maxShow)
    historyScroll = historyIndex - maxShow + 1;
  if (historyScroll < 0) historyScroll = 0;

  for (int i = 0; i < maxShow; i++) {
    int idx = historyScroll + i;
    if (idx >= historyCount) break;

    display.setCursor(0, 12 + i * 13);
    display.print(idx == historyIndex ? ">" : " ");

    // Format: "#3 SELES 120C 1.0b"
    String line = "#" + String(historyList[idx].no);
    line += " " + historyList[idx].status.substring(0, 5);
    line += " " + String(historyList[idx].suhu) + "C";
    line += " " + String(historyList[idx].tekanan, 1) + "b";
    display.print(line);
  }

  // Bottom: hanya Back (hapus masuk di dalam detail)
  display.setCursor(0, 54);
  display.print(historyIndex == historyCount ? "> [Back]" : "  [Back]");

  drawStatusIcons();
  display.display();
}

// Layar detail satu entry
// histMenuIndex: 0=Gunakan, 1=Hapus, 2=Back
void drawHistoryDetail(int idx) {
  display.clearDisplay();

  display.setCursor(0, 0);
  display.print("DETAIL #"); display.print(historyList[idx].no);
  display.print(" "); display.print(historyList[idx].status.substring(0, 5));

  display.setCursor(0, 12);
  display.print("Suhu    : "); display.print(historyList[idx].suhu); display.print(" C");

  display.setCursor(0, 21);
  display.print("Tekanan : "); display.print(historyList[idx].tekanan, 1); display.print(" bar");

  display.setCursor(0, 30);
  display.print("Durasi  : ");
  display.print(historyList[idx].jam); display.print("j ");
  display.print(historyList[idx].menit); display.print("m");

  // 3 tombol aksi di baris bawah
  display.setCursor(0, 43);
  display.print(histMenuIndex == 0 ? ">[Gunakan]" : "  [Gunakan]");

  display.setCursor(0, 53);
  display.print(histMenuIndex == 1 ? ">[Hapus] " : "  [Hapus] ");
  display.print(histMenuIndex == 2 ? ">[Back]" : "  [Back]");

  drawStatusIcons();
  display.display();
}

// Layar konfirmasi hapus SATU entry
void drawHistoryConfirmDelete(int idx) {
  display.clearDisplay();
  display.setCursor(10, 5);
  display.print("HAPUS HISTORY #"); display.print(historyList[idx].no);
  display.setCursor(0, 20);
  display.print("Entry ini akan");
  display.setCursor(0, 30);
  display.print("dihapus permanen.");

  display.setCursor(0, 50);
  display.print(histMenuIndex == 0 ? "> [YA]    [TIDAK]" :
                "  [YA]  > [TIDAK]");
  display.display();
}

// ================= STERILISASI =================
void drawSterilisasi() {
  display.clearDisplay();
  display.setCursor(0, 0); display.print("STERILISASI");

  display.setCursor(0, 14);
  display.print(sterilIndex == 0 ? "> " : "  ");
  display.print("Suhu : "); display.print(setSuhu); display.print(" C");

  display.setCursor(0, 24);
  display.print(sterilIndex == 1 ? "> " : "  ");
  display.print("Tekanan : "); display.print(setTekanan, 1); display.print(" bar");

  display.setCursor(0, 34);
  display.print(sterilIndex == 2 ? "> " : "  ");
  display.print("Durasi : ");
  if (editMode && sterilIndex == 2 && durasiCursor == 0) {
    display.print("[");
    display.print(durasiJam);
    display.print("j]");
  }
  else {
    display.print(durasiJam);
    display.print("j");
  }
  display.print(" ");
  if (editMode && sterilIndex == 2 && durasiCursor == 1) {
    display.print("[");
    display.print(durasiMenit);
    display.print("m]");
  }
  else {
    display.print(durasiMenit);
    display.print("m");
  }

  display.setCursor(0, 44);
  display.print(sterilIndex == 3 ? "> " : "  "); display.print("Start");

  display.setCursor(0, 54);
  display.print(sterilIndex == 4 ? "> " : "  "); display.print("Back");

  if (editMode) {
    display.setCursor(74, 0);
    display.print("EDIT");
  }

  drawStatusIcons();
  display.display();
}

// ================= DETAIL =================
void drawDetail() {
  display.clearDisplay();
  display.setCursor(0, 0);  display.print("DETAIL ALAT");
  display.setCursor(0, 10); display.print("ID: "); display.print(DEVICE_ID);

  display.setCursor(0, 20);
  display.print(detailIndex == 0 ? "> " : "  ");
  if (wifiConnected) {
    display.print("WiFi: ");
    display.print(connectedSSID);
  }
  else               {
    display.print("WiFi: NOT CONNECT");
  }

  display.setCursor(0, 30);
  display.print("  MQTT: ");
  display.print(mqttClient.connected() ? "Connected" : "Disconnected");

  display.setCursor(0, 42);
  display.print(detailIndex == 1 ? "> " : "  "); display.print("[Hubungkan MQTT]");

  display.setCursor(0, 54);
  display.print(detailIndex == 2 ? "> " : "  "); display.print("Back");

  drawStatusIcons();
  display.display();
}

// ===== MQTT CONNECT SCREENS =====
void drawMqttConnecting() {
  display.clearDisplay();
  display.setCursor(15, 5);  display.print("MQTT CONNECTING");
  display.setCursor(0, 20);  display.print("Broker:");
  display.setCursor(0, 30);  display.print(mqtt_server);
  display.setCursor(0, 48);  display.print("Mohon tunggu...");
  display.display();
}

void drawMqttResult(bool berhasil) {
  display.clearDisplay();
  display.setCursor(20, 15);
  if (berhasil) {
    display.print("MQTT CONNECTED!");
    display.setCursor(0, 30); display.print("Broker terhubung.");
    display.setCursor(0, 40); display.print("Subscribe: /set");
  } else {
    display.print("MQTT GAGAL!");
    display.setCursor(0, 30); display.print("Cek WiFi/broker.");
    display.setCursor(0, 40); display.print("rc="); display.print(mqttClient.state());
  }
  display.setCursor(35, 54); display.print("> OK");
  display.display();
}

// ===== WIFI SCREENS =====
void drawWifiMenu() {
  display.clearDisplay();
  display.setCursor(0, 0); display.print("WIFI MENU");
  display.setCursor(0, 20); display.print(wifiMenuIndex == 0 ? "> " : "  "); display.print("Scan WiFi");
  display.setCursor(0, 35); display.print(wifiMenuIndex == 1 ? "> " : "  "); display.print("Back");
  display.display();
}

void drawWifiList() {
  display.clearDisplay();
  display.setCursor(0, 0); display.print("PILIH WIFI");

  int maxShow = 3, maxChar = 18;
  if (wifiIndex < wifiScroll) wifiScroll = wifiIndex;
  if (wifiIndex < wifiCount && wifiIndex >= wifiScroll + maxShow) wifiScroll = wifiIndex - maxShow + 1;

  for (int i = 0; i < maxShow; i++) {
    int idx = wifiScroll + i;
    if (idx >= wifiCount) break;
    display.setCursor(0, 14 + i * 12);
    display.print(idx == wifiIndex ? "> " : "  ");
    String nama = wifiSSID[idx];
    if ((int)nama.length() > maxChar) nama = nama.substring(0, maxChar - 3) + "...";
    display.print(nama);
  }

  display.setCursor(0, 54);
  display.print(wifiIndex == wifiCount ? "> " : "  "); display.print("Back");
  display.display();
}

void drawWifiPassword() {
  display.clearDisplay();
  display.setCursor(0, 0);  display.print("ENTER PASSWORD");
  display.setCursor(0, 14); display.print("P: ");
  String showPass = wifiPassword;
  if ((int)showPass.length() > 14) showPass = showPass.substring(showPass.length() - 14);
  display.print(showPass); display.print("_");

  display.setCursor(0, 28);
  if (!passMenuMode) {
    display.print("> Char: [");
    display.print(currentChar);
    display.print("]");
  }
  else               {
    display.print("  Char: [");
    display.print(currentChar);
    display.print("]");
  }

  display.setCursor(0, 42);
  display.print((passMenuMode && passMenuIndex == 0) ? "> " : "  "); display.print("Hapus");
  display.setCursor(0, 54);
  display.print((passMenuMode && passMenuIndex == 1) ? "> " : "  "); display.print("Enter");
  display.display();
}

void drawWifiConnecting(int dots) {
  display.clearDisplay();
  display.setCursor(20, 25); display.print("CONNECTING");
  display.setCursor(45, 40);
  for (int i = 0; i < dots; i++) display.print(".");
  display.display();
}

void drawWifiStatus() {
  display.clearDisplay();
  display.setCursor(10, 25); display.print(wifiConnected ? "WIFI CONNECTED" : "CONNECT FAILED");
  display.setCursor(20, 45); display.print("> BACK");
  display.display();
}

// ================= PROSES SCREENS =================
void drawCountdown(int angka) {
  display.clearDisplay();
  display.setTextSize(3); display.setCursor(55, 20); display.print(angka);
  display.setTextSize(1); drawStatusIcons(); display.display();
}

void drawIgnitionLoading(int frame, float suhu, bool apiOK, int retry) {
  display.clearDisplay();
  display.setCursor(10, 5);  display.print("MENYALAKAN API");
  display.setCursor(0, 20);  display.print("Suhu : "); display.print(suhu, 1); display.print(" C");
  display.setCursor(0, 32);  display.print("Percobaan : "); display.print(retry + 1);
  display.setCursor(30, 45); display.print("Loading");
  for (int i = 0; i < frame; i++) display.print(".");
  display.setCursor(0, 55);  display.print(apiOK ? "API TERDETEKSI" : "MENCOBA...");
  drawStatusIcons(); display.display();
}

void drawRunning(float suhu, float pressure) {
  display.clearDisplay();
  display.setCursor(0, 0);  display.print("STERILISASI");
  display.setCursor(0, 12); display.print("Suhu : "); display.print(suhu, 1);
  display.print("C/"); display.print(setSuhu); display.print("C");
  display.setCursor(0, 22); display.print("Tek  : "); display.print(pressure, 1);
  display.print("b/"); display.print(setTekanan, 1); display.print("b");

  int jam = sisaDetik / 3600, menit = (sisaDetik % 3600) / 60, detik = sisaDetik % 60;
  display.setCursor(0, 36); display.print("Timer : ");
  display.print(jam); display.print(":");
  if (menit < 10) display.print("0"); display.print(menit); display.print(":");
  if (detik < 10) display.print("0"); display.print(detik);

  display.setCursor(0, 54); display.print("SEL=STOP");
  drawStatusIcons(); display.display();
}

void drawFinish() {
  display.clearDisplay();
  display.setCursor(10, 25); display.print("PROSES STERILISASI");
  display.setCursor(35, 38); display.print("SELESAI");
  display.setCursor(35, 55); display.print("> EXIT");
  drawStatusIcons(); display.display();
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);
  Serial.println("========================================");
  Serial.println("   AUTOCLAVE " + String(DEVICE_ID) + " BOOTING");
  Serial.println("========================================");

  Wire.begin(SDA_PIN, SCL_PIN);
  display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR);
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);

  pinMode(BTN_UP,     INPUT_PULLUP);
  pinMode(BTN_DOWN,   INPUT_PULLUP);
  pinMode(BTN_SELECT, INPUT_PULLUP);

  welcomeAnimation();

  // ===== BOOTING: GPIO & AKTUATOR =====
  drawBooting("Init GPIO & Aktuator...", 10);
  pinMode(RELAY_IGNITER, OUTPUT); pinMode(RELAY_VALVE, OUTPUT);
  digitalWrite(RELAY_IGNITER, HIGH); digitalWrite(RELAY_VALVE, HIGH);
  gasServo.attach(SERVO_PIN);
  // [DIUBAH] Posisi awal servo menggunakan SERVO_LEVEL_2 (110 = gas sedang)
  gasServo.write(SERVO_LEVEL_2);
  analogReadResolution(12); analogSetAttenuation(ADC_11db);
  lastPID = millis();

  // ===== BOOTING: SENSOR SUHU =====
  drawBooting("Init Sensor Suhu...", 22);
  max31865.begin(MAX31865_3WIRE);
  delay(300);

  // ===== BOOTING: HISTORY =====
  drawBooting("Load History...", 32);
  historyLoad();
  delay(200);

  // ===== BOOTING: WIFI =====
  drawBooting("Load WiFi tersimpan...", 42);
  preferences.begin("wifi", false);
  String savedSSID = preferences.getString("ssid", "");
  String savedPASS = preferences.getString("pass", "");

  if (savedSSID != "") {
    Serial.println("[WiFi] Mencoba: " + savedSSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(savedSSID.c_str(), savedPASS.c_str());

    unsigned long startAttempt = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 8000) {
      int dots = ((millis() - startAttempt) / 500) % 4;
      String step = "Konek WiFi";
      for (int d = 0; d < dots; d++) step += ".";
      drawBooting(step, 42 + (int)((millis() - startAttempt) * 18 / 8000));
      delay(200);
    }

    if (WiFi.status() == WL_CONNECTED) {
      wifiConnected = true; connectedSSID = savedSSID;
      Serial.println("[WiFi] ✓ " + connectedSSID + " | IP: " + WiFi.localIP().toString());
      drawBooting("WiFi: " + connectedSSID, 62);
    } else {
      Serial.println("[WiFi] ✗ Gagal: " + savedSSID);
      drawBooting("WiFi: Gagal terhubung", 62);
    }
    delay(400);
  } else {
    Serial.println("[WiFi] Tidak ada data tersimpan.");
    drawBooting("WiFi: Tidak ada data", 62);
    delay(400);
  }

  // ===== BOOTING: MQTT =====
  drawBooting("Init MQTT...", 70);
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(mqttCallback);
  Serial.println("[MQTT] Server: " + String(mqtt_server) + ":" + String(mqtt_port));
  delay(200);

  if (wifiConnected) {
    bool mqttOK = false;
    for (int attempt = 1; attempt <= 2 && !mqttOK; attempt++) {
      Serial.println("[MQTT] Percobaan " + String(attempt) + "/2...");
      unsigned long t = millis();
      while (millis() - t < 3000) {
        int dots = ((millis() - t) / 400) % 4;
        String step = "MQTT konek (" + String(attempt) + "/2)";
        for (int d = 0; d < dots; d++) step += ".";
        drawBooting(step, 72 + attempt * 8);
        delay(200);
        if (mqttClient.connect("ESP32_Autoclave_01")) {
          mqttOK = true;
          break;
        }
      }
    }

    if (mqttOK) {
      mqttClient.subscribe(mqtt_topic_1);
      mqttClient.subscribe(mqtt_topic_2);
      Serial.println("[MQTT] ✓ Terhubung & subscribe!");
      drawBooting("MQTT: Terhubung!", 94);
    } else {
      Serial.println("[MQTT] ✗ Gagal (2x). Gunakan Detail > [Hubungkan MQTT].");
      drawBooting("MQTT: Gagal, lanjut...", 94);
    }
    delay(500);
  } else {
    Serial.println("[MQTT] Skip, WiFi tidak tersambung.");
    drawBooting("MQTT: Skip (no WiFi)", 94);
    delay(400);
  }

  // ===== BOOTING: SELESAI =====
  drawBooting("Siap digunakan!", 100);
  Serial.println("[SISTEM] Setup selesai.");
  Serial.println("========================================");
  delay(800);

  drawMainMenu();
}

// ================= LOOP =================
void loop() {
  // Update WiFi status
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    connectedSSID = WiFi.SSID();
  }
  else                                {
    wifiConnected = false;
  }

  // MQTT loop
  if (mqttClient.connected()) mqttClient.loop();

  // ===== FLAG START DARI MQTT =====
  if (mqttStartRequest) {
    mqttStartRequest = false;
    if (currentMode == MODE_MAIN_MENU || currentMode == MODE_STERIL || currentMode == MODE_DETAIL) {
      display.clearDisplay();
      display.setCursor(10, 12); display.print("PERINTAH MQTT");
      display.setCursor(0, 26);  display.print("Suhu: "); display.print(setSuhu); display.print("C");
      display.setCursor(0, 36);  display.print("Tek : "); display.print(setTekanan, 1); display.print(" bar");
      display.setCursor(0, 46);  display.print("Dur : "); display.print(durasiJam); display.print("j "); display.print(durasiMenit); display.print("m");
      display.display();
      delay(500);
      mqttPublishSet();
      currentMode = MODE_COUNTDOWN;
    }
  }

  // ===== FLAG STOP DARI MQTT =====
  if (mqttStopRequest) {
    mqttStopRequest = false;
    if (currentMode == MODE_RUNNING || currentMode == MODE_IGNITION || currentMode == MODE_COUNTDOWN) {
      // [DIUBAH] Tutup gas menggunakan SERVO_LEVEL_0 (180)
      gasServo.write(SERVO_LEVEL_0);
      digitalWrite(RELAY_IGNITER, HIGH);
      digitalWrite(RELAY_VALVE, HIGH);

      historyAdd("DIHENTIKAN");

      display.clearDisplay();
      display.setCursor(20, 20); display.print("DIHENTIKAN");
      display.setCursor(10, 33); display.print("via MQTT Remote");
      display.display();
      delay(500);

      currentMode = MODE_STERIL;
      editMode = false;
      drawSterilisasi();
    }
  }

  // ===== MAIN MENU =====
  if (currentMode == MODE_MAIN_MENU) {
    if (digitalRead(BTN_UP) == LOW) {
      menuIndex = (menuIndex + 2) % 3;
      drawMainMenu(); delay(200);
    }
    if (digitalRead(BTN_DOWN) == LOW) {
      menuIndex = (menuIndex + 1) % 3;
      drawMainMenu(); delay(200);
    }
    if (digitalRead(BTN_SELECT) == LOW) {
      if (menuIndex == 0) {
        currentMode = MODE_STERIL;
        drawSterilisasi();
      } else if (menuIndex == 1) {
        currentMode   = MODE_HISTORY;
        historyState  = HIST_LIST;
        historyIndex  = 0;
        historyScroll = 0;
        histMenuIndex = 0;
        drawHistoryList();
      } else if (menuIndex == 2) {
        currentMode = MODE_DETAIL;
        drawDetail();
      }
      delay(300);
    }
  }

  // ===== HISTORY =====
  else if (currentMode == MODE_HISTORY) {

    // --- LIST ---
    if (historyState == HIST_LIST) {

      // Jika history kosong, hanya bisa Back
      if (historyCount == 0) {
        if (digitalRead(BTN_SELECT) == LOW || digitalRead(BTN_UP) == LOW || digitalRead(BTN_DOWN) == LOW) {
          currentMode = MODE_MAIN_MENU;
          drawMainMenu(); delay(300);
        }
        return;
      }

      if (digitalRead(BTN_UP) == LOW) {
        if (historyIndex > 0) historyIndex--;
        else historyIndex = historyCount; // wrap ke Back
        drawHistoryList(); delay(200);
      }
      if (digitalRead(BTN_DOWN) == LOW) {
        if (historyIndex < historyCount) historyIndex++;
        else historyIndex = 0; // wrap ke atas
        drawHistoryList(); delay(200);
      }
      if (digitalRead(BTN_SELECT) == LOW) {
        if (historyIndex < historyCount) {
          // Masuk detail entry yang dipilih
          histMenuIndex = 0; // default pilih [Gunakan]
          historyState = HIST_DETAIL;
          drawHistoryDetail(historyIndex);
        } else {
          // Back
          currentMode = MODE_MAIN_MENU;
          drawMainMenu();
        }
        delay(300);
      }
    }

    // --- DETAIL (3 tombol: Gunakan, Hapus, Back) ---
    else if (historyState == HIST_DETAIL) {
      if (digitalRead(BTN_UP) == LOW) {
        histMenuIndex = (histMenuIndex + 2) % 3; // naik
        drawHistoryDetail(historyIndex); delay(200);
      }
      if (digitalRead(BTN_DOWN) == LOW) {
        histMenuIndex = (histMenuIndex + 1) % 3; // turun
        drawHistoryDetail(historyIndex); delay(200);
      }
      if (digitalRead(BTN_SELECT) == LOW) {
        if (histMenuIndex == 0) {
          // GUNAKAN — salin parameter ke variabel sterilisasi aktif
          setSuhu     = historyList[historyIndex].suhu;
          setTekanan  = historyList[historyIndex].tekanan;
          durasiJam   = historyList[historyIndex].jam;
          durasiMenit = historyList[historyIndex].menit;

          Serial.println("[HISTORY] Parameter digunakan dari #" + String(historyList[historyIndex].no));
          Serial.println("          Suhu=" + String(setSuhu) +
                         " Tek=" + String(setTekanan, 1) +
                         " Dur=" + String(durasiJam) + "j" + String(durasiMenit) + "m");

          // Tampilkan konfirmasi sebentar lalu masuk menu sterilisasi
          display.clearDisplay();
          display.setCursor(10, 15); display.print("PARAMETER DIMUAT");
          display.setCursor(0, 28);  display.print("Suhu: "); display.print(setSuhu); display.print("C");
          display.setCursor(0, 38);  display.print("Tek : "); display.print(setTekanan, 1); display.print(" bar");
          display.setCursor(0, 48);  display.print("Dur : "); display.print(durasiJam); display.print("j "); display.print(durasiMenit); display.print("m");
          display.display();
          delay(1500);

          sterilIndex = 0;
          editMode = false;
          currentMode = MODE_STERIL;
          drawSterilisasi();

        } else if (histMenuIndex == 1) {
          // HAPUS — minta konfirmasi
          histMenuIndex = 1; // default ke TIDAK
          historyState = HIST_CONFIRM_DEL;
          drawHistoryConfirmDelete(historyIndex);

        } else {
          // BACK — kembali ke list
          historyState = HIST_LIST;
          drawHistoryList();
        }
        delay(300);
      }
    }

    // --- KONFIRMASI HAPUS SATU ENTRY ---
    else if (historyState == HIST_CONFIRM_DEL) {
      if (digitalRead(BTN_UP) == LOW || digitalRead(BTN_DOWN) == LOW) {
        histMenuIndex = !histMenuIndex;
        drawHistoryConfirmDelete(historyIndex); delay(200);
      }
      if (digitalRead(BTN_SELECT) == LOW) {
        if (histMenuIndex == 0) {
          // YA — hapus entry ini
          historyDeleteOne(historyIndex);
          // Sesuaikan index agar tidak out of bounds
          if (historyIndex >= historyCount && historyIndex > 0) historyIndex--;
        }
        // Kembali ke list
        historyState  = HIST_LIST;
        histMenuIndex = 0;
        drawHistoryList(); delay(300);
      }
    }
  }

  // ===== STERIL =====
  else if (currentMode == MODE_STERIL) {
    if (!editMode) {
      if (digitalRead(BTN_UP) == LOW)   {
        sterilIndex = (sterilIndex + 4) % 5;
        drawSterilisasi();
        delay(200);
      }
      if (digitalRead(BTN_DOWN) == LOW) {
        sterilIndex = (sterilIndex + 1) % 5;
        drawSterilisasi();
        delay(200);
      }
      if (digitalRead(BTN_SELECT) == LOW) {
        if (sterilIndex <= 2) {
          editMode = true;
        }
        else if (sterilIndex == 3) {
          Serial.println("[AKSI] START ditekan.");
          mqttPublishSet();
          currentMode = MODE_COUNTDOWN;
        } else if (sterilIndex == 4) {
          currentMode = MODE_MAIN_MENU; drawMainMenu();
        }
        delay(300);
      }
    } else {
      if (digitalRead(BTN_UP) == LOW) {
        if (sterilIndex == 0 && setSuhu < 200) setSuhu++;
        if (sterilIndex == 1 && setTekanan < 10) {
          setTekanan += 0.1;
          setTekanan = round(setTekanan * 10) / 10.0;
        }
        if (sterilIndex == 2) {
          if (durasiCursor == 0 && durasiJam < 23)   durasiJam++;
          if (durasiCursor == 1 && durasiMenit < 59) durasiMenit++;
        }
        drawSterilisasi(); delay(150);
      }
      if (digitalRead(BTN_DOWN) == LOW) {
        if (sterilIndex == 0 && setSuhu > 0) setSuhu--;
        if (sterilIndex == 1 && setTekanan > 0) {
          setTekanan -= 0.1;
          setTekanan = round(setTekanan * 10) / 10.0;
        }
        if (sterilIndex == 2) {
          if (durasiCursor == 0 && durasiJam > 0)   durasiJam--;
          if (durasiCursor == 1 && durasiMenit > 0) durasiMenit--;
        }
        drawSterilisasi(); delay(150);
      }
      if (digitalRead(BTN_SELECT) == LOW) {
        if (sterilIndex == 2 && durasiCursor == 0) durasiCursor = 1;
        else {
          editMode = false;
          durasiCursor = 0;
        }
        drawSterilisasi(); delay(300);
      }
    }
  }

  // ===== DETAIL =====
  else if (currentMode == MODE_DETAIL) {
    if (digitalRead(BTN_UP) == LOW)   {
      detailIndex = (detailIndex + 2) % 3;
      drawDetail();
      delay(200);
    }
    if (digitalRead(BTN_DOWN) == LOW) {
      detailIndex = (detailIndex + 1) % 3;
      drawDetail();
      delay(200);
    }
    if (digitalRead(BTN_SELECT) == LOW) {
      if (detailIndex == 0) {
        currentMode = MODE_WIFI; wifiState = WIFI_MENU;
        display.clearDisplay(); display.setCursor(10, 30); display.print("MENU WIFI"); display.display();

      } else if (detailIndex == 1) {
        Serial.println("[AKSI] Tombol [Hubungkan MQTT] ditekan.");
        drawMqttConnecting();
        if (mqttClient.connected()) {
          mqttClient.disconnect();
          delay(200);
        }

        bool berhasil = false;
        unsigned long startConn = millis();
        while (millis() - startConn < 5000) {
          int dots = ((millis() - startConn) / 500) % 4;
          display.fillRect(0, 48, 128, 8, SSD1306_BLACK);
          display.setCursor(0, 48); display.print("Mohon tunggu");
          for (int d = 0; d < dots; d++) display.print(".");
          display.display();

          if (mqttClient.connect("ESP32_Autoclave_01")) {
            berhasil = true;
            mqttClient.subscribe(mqtt_topic_1);
            mqttClient.subscribe(mqtt_topic_2);
            Serial.println("[MQTT] ✓ Subscribe ke kedua topik.");
            break;
          }
          delay(500);
        }

        if (berhasil) Serial.println("[MQTT] ✓ Terhubung!");
        else {
          Serial.print("[MQTT] ✗ Gagal. rc=");
          Serial.println(mqttClient.state());
        }

        drawMqttResult(berhasil);
        while (digitalRead(BTN_SELECT) == HIGH) delay(50);
        delay(300);
        drawDetail();

      } else if (detailIndex == 2) {
        currentMode = MODE_MAIN_MENU; detailIndex = 0; drawMainMenu();
      }
      delay(300);
    }
  }

  // ===== WIFI =====
  else if (currentMode == MODE_WIFI) {
    if (wifiState == WIFI_MENU) {
      drawWifiMenu();
      if (digitalRead(BTN_UP) == LOW || digitalRead(BTN_DOWN) == LOW) {
        wifiMenuIndex = !wifiMenuIndex;
        delay(200);
      }
      if (digitalRead(BTN_SELECT) == LOW) {
        if (wifiMenuIndex == 0) {
          wifiState = WIFI_SCAN;
          WiFi.mode(WIFI_STA); WiFi.disconnect(); delay(100);
          wifiCount = WiFi.scanNetworks();
          if (wifiCount > 10) wifiCount = 10;
          wifiIndex = 0; wifiScroll = 0;
          for (int i = 0; i < wifiCount; i++) wifiSSID[i] = WiFi.SSID(i);
        } else {
          currentMode = MODE_DETAIL; drawDetail();
        }
        delay(300);
      }
    }
    else if (wifiState == WIFI_SCAN) {
      drawWifiList();
      if (digitalRead(BTN_UP) == LOW)   {
        wifiIndex = (wifiIndex > 0) ? wifiIndex - 1 : wifiCount;
        delay(200);
      }
      if (digitalRead(BTN_DOWN) == LOW) {
        wifiIndex = (wifiIndex < wifiCount) ? wifiIndex + 1 : 0;
        delay(200);
      }
      if (digitalRead(BTN_SELECT) == LOW) {
        if (wifiIndex == wifiCount) {
          wifiIndex = 0;
          wifiScroll = 0;
          wifiState = WIFI_MENU;
        }
        else {
          wifiPassword = "";
          passCursor = 0;
          currentChar = 'a';
          passMenuMode = false;
          passMenuIndex = 0;
          wifiState = WIFI_PASSWORD;
        }
        delay(300);
      }
    }
    else if (wifiState == WIFI_PASSWORD) {
      bool btnUp = (digitalRead(BTN_UP) == LOW), btnDown = (digitalRead(BTN_DOWN) == LOW), btnSel = (digitalRead(BTN_SELECT) == LOW);
      if (!passMenuMode) {
        if (btnUp && btnDown) {
          passMenuMode = true;
          passMenuIndex = 0;
          delay(300);
        }
        else if (btnUp)   {
          for (int i = 0; i < charsetLength; i++) if (charset[i] == currentChar) {
              currentChar = charset[(i + 1) % charsetLength];
              break;
            } delay(150);
        }
        else if (btnDown) {
          for (int i = 0; i < charsetLength; i++) if (charset[i] == currentChar) {
              currentChar = charset[(i - 1 + charsetLength) % charsetLength];
              break;
            } delay(150);
        }
        else if (btnSel)  {
          wifiPassword += currentChar;
          delay(300);
        }
      } else {
        if (btnUp && btnDown) {
          passMenuMode = false;
          delay(300);
        }
        else if (btnUp || btnDown) {
          passMenuIndex = !passMenuIndex;
          delay(200);
        }
        else if (btnSel) {
          if (passMenuIndex == 0) {
            if (wifiPassword.length() > 0) wifiPassword = wifiPassword.substring(0, wifiPassword.length() - 1);
            passMenuMode = false;
          }
          else {
            passMenuMode = false;
            wifiState = WIFI_CONNECT;
          }
          delay(300);
        }
      }
      drawWifiPassword();
    }
    else if (wifiState == WIFI_CONNECT) {
      Serial.println("[WiFi] Mencoba: " + wifiSSID[wifiIndex]);
      WiFi.begin(wifiSSID[wifiIndex].c_str(), wifiPassword.c_str());
      unsigned long startAttempt = millis();
      while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 10000)
        drawWifiConnecting((millis() / 500) % 4);

      wifiConnected = (WiFi.status() == WL_CONNECTED);
      if (wifiConnected) {
        connectedSSID = wifiSSID[wifiIndex];
        preferences.putString("ssid", connectedSSID);
        preferences.putString("pass", wifiPassword);
        Serial.println("[WiFi] ✓ " + connectedSSID + " | IP: " + WiFi.localIP().toString());
      } else {
        Serial.println("[WiFi] ✗ Gagal.");
      }
      wifiState = WIFI_STATUS;
    }
    else if (wifiState == WIFI_STATUS) {
      drawWifiStatus();
      if (digitalRead(BTN_SELECT) == LOW) {
        wifiState = WIFI_MENU;
        delay(300);
      }
    }
  }

  // ===== COUNTDOWN =====
  else if (currentMode == MODE_COUNTDOWN) {
    Serial.println("[AKSI] Memulai COUNTDOWN...");
    mqttPublishCountdown();
    for (int i = 3; i > 0; i--) {
      drawCountdown(i);
      delay(1000);
    }
    suhuAwal = max31865.temperature(RNOMINAL, RREF);
    currentMode = MODE_IGNITION;
    ignitionRetry = 0;
    delay(1000);
  }

  // ===== IGNITION =====
  else if (currentMode == MODE_IGNITION) {
    static unsigned long ignitionStart = 0;
    static int lastReportedRetry = -1;
    float suhu = max31865.temperature(RNOMINAL, RREF);

    if (ignitionStart == 0) {
      ignitionStart = millis(); apiTerdeteksi = false; lastReportedRetry = -1;
      // [DIUBAH] Buka gas pada level sedang (SERVO_LEVEL_2 = 110) saat ignition
      gasServo.write(SERVO_LEVEL_2);
      digitalWrite(RELAY_IGNITER, LOW);
      Serial.println("[AKSI] Ignition sesi " + String(ignitionRetry + 1) + " dimulai.");
      mqttPublishIgnition(ignitionRetry + 1, "prosesing");
      lastReportedRetry = ignitionRetry;
    }

    if (suhu >= suhuAwal + 10 && !apiTerdeteksi) {
      apiTerdeteksi = true;
      Serial.println("[AKSI] API terdeteksi sesi " + String(ignitionRetry + 1) + "!");
      mqttPublishIgnition(ignitionRetry + 1, "api menyala");
    }

    drawIgnitionLoading((millis() / 500) % 4, suhu, apiTerdeteksi, ignitionRetry);

    if (millis() - ignitionStart >= 15000) {
      digitalWrite(RELAY_IGNITER, HIGH);

      if (apiTerdeteksi) {
        ignitionStart = 0; ignitionRetry = 0;
        sisaDetik = durasiJam * 3600L + durasiMenit * 60L;
        lastMillis = millis(); lastMqttRunning = millis();
        currentMode = MODE_RUNNING;
        Serial.println("[AKSI] Ignition berhasil → MODE_RUNNING.");
      } else {
        ignitionRetry++;
        if (ignitionRetry < maxRetry) {
          ignitionStart = 0;
          Serial.println("[AKSI] Ignition gagal, ulang (" + String(ignitionRetry + 1) + "/" + String(maxRetry) + ")");
        } else {
          // [DIUBAH] Tutup gas total dengan SERVO_LEVEL_0 (180)
          gasServo.write(SERVO_LEVEL_0);
          ignitionStart = 0; ignitionRetry = 0;
          Serial.println("[AKSI] ✗ Ignition GAGAL setelah " + String(maxRetry) + "x!");

          String dataGagal = "{\"action\": \"ignition_failed\",\"percobaan\": " + String(maxRetry) + ",\"Device\": \"" + String(DEVICE_ID) + "\"}";
          mqttPublish(mqtt_topic_2, dataGagal);

          // Simpan ke history sebagai DIHENTIKAN
          historyAdd("DIHENTIKAN");

          display.clearDisplay();
          display.setCursor(20, 25); display.print("GAGAL NYALA!");
          display.setCursor(15, 45); display.print("CEK GAS/API");
          display.display(); delay(2000);

          currentMode = MODE_STERIL; drawSterilisasi();
        }
      }
    }
  }

  // ===== RUNNING =====
  else if (currentMode == MODE_RUNNING) {
    float suhu = max31865.temperature(RNOMINAL, RREF);
    if (suhu < 0) suhu = 0;

    float selisih = setSuhu - suhu;
    if      (selisih > 15) gasServo.write(SERVO_LEVEL_3);
    else if (selisih > 5)  gasServo.write(SERVO_LEVEL_2);
    else if (selisih > 0)  gasServo.write(SERVO_LEVEL_1);
    else                   gasServo.write(SERVO_LEVEL_0);

    int adcValue = analogRead(PRESSURE_PIN);
    float voltage_div  = (adcValue / 4095.0) * 3.3;
    float voltage_real = voltage_div * ((10000.0 + 20000.0) / 20000.0);
    float pressure = ((voltage_real - 0.5) * 12.0 / (4.5 - 0.5));
    if (pressure < 0) pressure = 0;
    digitalWrite(RELAY_VALVE, pressure > setTekanan ? LOW : HIGH);

    // Timer
    if (millis() - lastMillis >= 1000) {
      lastMillis = millis();
      sisaDetik--;

      if (sisaDetik <= 0) {
        gasServo.write(SERVO_LEVEL_0);
        Serial.println("[AKSI] Timer habis, sterilisasi selesai!");

        // [FIX] Reset lastMqttRunning agar running interval
        // tidak jatuh tempo tepat setelah finish dikirim
        lastMqttRunning = millis();

        mqttPublishFinish(suhu, pressure);
        historyAdd("SELESAI");
        currentMode = MODE_FINISH;
        return; // [FIX] Keluar dari loop sekarang, cegah kode di bawah jalan
      }
      drawRunning(suhu, pressure);
    }

    // [FIX] Tambah guard: hanya kirim running jika masih MODE_RUNNING
    if (currentMode == MODE_RUNNING &&
        millis() - lastMqttRunning >= mqttRunningInterval) {
      lastMqttRunning = millis();
      mqttPublishRunning(suhu, pressure);
    }

    // STOP manual
    if (digitalRead(BTN_SELECT) == LOW) {
      gasServo.write(SERVO_LEVEL_0);
      Serial.println("[AKSI] STOP manual.");
      mqttPublishStop();
      historyAdd("DIHENTIKAN");
      currentMode = MODE_STERIL;
      drawSterilisasi(); delay(300);
    }
  }

  // ===== FINISH =====
  else if (currentMode == MODE_FINISH) {
    drawFinish();
    if (digitalRead(BTN_SELECT) == LOW) {
      currentMode = MODE_STERIL;
      drawSterilisasi();
      delay(300);
    }
  }
}
