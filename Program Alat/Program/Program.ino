#include <WiFiClient.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <Preferences.h>
#include <Adafruit_MAX31865.h>
#include <ESP32Servo.h>
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
  MODE_DETAIL,
  MODE_WIFI,
  MODE_COUNTDOWN,
  MODE_IGNITION,
  MODE_RUNNING,
  MODE_FINISH
};

Mode currentMode = MODE_MAIN_MENU;

// ================= MENU =================
int menuIndex = 0;

// ================= WIFI =================
int detailIndex = 0; // 0 = WiFi, 1 = Back

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
int wifiMenuIndex = 0;     // 0=Scan, 1=Back
int wifiIndex = 0;
int wifiCount = 0;
String wifiSSID[10];
bool wifiConnected = false;
int wifiScroll = 0;   // <<< TAMBAHAN (UNTUK SCROLL LIST)
String wifiPassword = "";
int passCursor = 0;
char currentChar = 'a';

const char charset[] =
  "abcdefghijklmnopqrstuvwxyz"
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  "0123456789";
int charsetLength = 62;
String connectedSSID = "";

// ================= STERILISASI =================
int sterilIndex = 0;
bool editMode = false;

int setSuhu = 120;
float setTekanan = 1.0;
int durasiJam = 0;
int durasiMenit = 30;
int durasiCursor = 0; // 0=jam, 1=menit

// ================= TIMER =================
unsigned long lastMillis = 0;
long sisaDetik = 0;
bool komporON = false;

// ================= SUHU REAL =================
float suhuAwal = 0;
int ignitionRetry = 0;
const int maxRetry = 3;
bool apiTerdeteksi = false;

// ===== KONTROL SERVO 3 LEVEL =====
#define SERVO_LEVEL_0  180   // gas tertutup
#define SERVO_LEVEL_1  120   // gas terbuka kecil
#define SERVO_LEVEL_2  100   // gas terbuka besar

// ================= MQTT=================
WiFiClient espClient;
PubSubClient client(espClient);

const char* mqtt_server = "192.168.1.100"; // ganti IP broker kamu
const int mqtt_port = 1883;
const char* mqtt_topic_1 = "sterilisasi/set";
const char* mqtt_topic_2 = "sterilisasi/running";
const char* mqtt_topic_3 = "sterilisasi/finiash";

// ================= WELCOME =================
void welcomeAnimation() {
  display.clearDisplay();
  display.setTextSize(2);
  for (int x = -80; x <= 20; x++) {
    display.clearDisplay();
    display.setCursor(x, 25);
    display.print("WELCOME");
    display.display();
    delay(20);
  }
  display.setTextSize(1);
}

// ================= MAIN MENU =================
void drawMainMenu() {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.print("MENU UTAMA");

  display.setCursor(0, 20);
  display.print(menuIndex == 0 ? "> " : "  ");
  display.print("Sterilisasi");

  display.setCursor(0, 35);
  display.print(menuIndex == 1 ? "> " : "  ");
  display.print("Detail");

  display.display();
}

// ================= STERILISASI =================
void drawSterilisasi() {
  display.clearDisplay();

  display.setCursor(0, 0);
  display.print("STERILISASI");

  display.setCursor(0, 14);
  display.print(sterilIndex == 0 ? "> " : "  ");
  display.print("Suhu : ");
  display.print(setSuhu); display.print(" C");

  display.setCursor(0, 24);
  display.print(sterilIndex == 1 ? "> " : "  ");
  display.print("Tekanan : ");
  display.print(setTekanan, 1); display.print(" bar");

  // ==== DURASI (JAM & MENIT) ====
  display.setCursor(0, 34);
  display.print(sterilIndex == 2 ? "> " : "  ");
  display.print("Durasi : ");

  if (editMode && sterilIndex == 2 && durasiCursor == 0) {
    display.print("["); display.print(durasiJam); display.print("j]");
  } else {
    display.print(durasiJam); display.print("j");
  }

  display.print(" ");

  if (editMode && sterilIndex == 2 && durasiCursor == 1) {
    display.print("["); display.print(durasiMenit); display.print("m]");
  } else {
    display.print(durasiMenit); display.print("m");
  }

  display.setCursor(0, 44);
  display.print(sterilIndex == 3 ? "> " : "  ");
  display.print("Start");

  display.setCursor(0, 54);
  display.print(sterilIndex == 4 ? "> " : "  ");
  display.print("Back");

  if (editMode) {
    display.setCursor(90, 0);
    display.print("EDIT");
  }

  display.display();
}

// ================= DETAIL =================
void drawDetail() {
  display.clearDisplay();

  display.setCursor(0, 0);
  display.print("DETAIL ALAT");

  display.setCursor(0, 16);
  display.print("ID : ");
  display.print(DEVICE_ID);

  display.setCursor(0, 32);
  display.print(detailIndex == 0 ? "> " : "  ");

  if (wifiConnected) {
    display.print("WiFi : ");
    display.print(connectedSSID);

    display.setCursor(0, 42);
    display.print("      (Connected)");
  } else {
    display.print("WiFi : NOT CONNECT");
  }

  display.setCursor(0, 54);
  display.print(detailIndex == 1 ? "> " : "  ");
  display.print("Back");

  display.display();
}

// ===== WIFI MENU =====
void drawWifiMenu() {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.print("WIFI MENU");

  display.setCursor(0, 20);
  display.print(wifiMenuIndex == 0 ? "> " : "  ");
  display.print("Scan WiFi");

  display.setCursor(0, 35);
  display.print(wifiMenuIndex == 1 ? "> " : "  ");
  display.print("Back");

  display.display();
}

// ===== LIST SSID =====
void drawWifiList() {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.print("PILIH WIFI");

  int maxShow = 4;
  int maxChar = 18;   // maksimal karakter agar tidak turun baris

  // ===== ATUR SCROLL WINDOW =====
  if (wifiIndex < wifiScroll) {
    wifiScroll = wifiIndex;
  }
  if (wifiIndex >= wifiScroll + maxShow) {
    wifiScroll = wifiIndex - maxShow + 1;
  }

  // ===== TAMPILKAN LIST =====
  for (int i = 0; i < maxShow; i++) {
    int idx = wifiScroll + i;
    if (idx >= wifiCount) break;

    display.setCursor(0, 14 + i * 12);
    display.print(idx == wifiIndex ? "> " : "  ");

    String nama = wifiSSID[idx];

    // ===== POTONG SSID JIKA TERLALU PANJANG =====
    if (nama.length() > maxChar) {
      nama = nama.substring(0, maxChar - 3);
      nama += "...";
    }

    display.print(nama);
  }

  display.display();
}

// ===== WIFI PASSWORD =====
void drawWifiPassword() {
  display.clearDisplay();

  display.setCursor(0, 0);
  display.print("ENTER PASSWORD");

  // tampilkan SSID terpilih
  display.setCursor(0, 12);
  display.print("SSID:");
  display.setCursor(0, 20);
  display.print(wifiSSID[wifiIndex]);

  // tampilkan password
  display.setCursor(0, 38);
  display.print("Pass: ");

  display.print(wifiPassword);

  // tampilkan karakter aktif
  display.setCursor(0, 52);
  display.print("Char: ");
  display.print(currentChar);

  display.display();
}

// ===== Connecting =====
void drawWifiConnecting(int dots) {
  display.clearDisplay();
  display.setCursor(20, 25);
  display.print("CONNECTING");
  display.setCursor(45, 40);
  for (int i = 0; i < dots; i++) display.print(".");
  display.display();
}

// ===== STATUS =====
void drawWifiStatus() {
  display.clearDisplay();
  display.setCursor(10, 25);
  display.print(wifiConnected ? "WIFI CONNECTED" : "CONNECT FAILED");
  display.setCursor(20, 45);
  display.print("> BACK");
  display.display();
}

// ================= COUNTDOWN =================
void drawCountdown(int angka) {
  display.clearDisplay();
  display.setTextSize(3);
  display.setCursor(55, 20);
  display.print(angka);
  display.display();
  display.setTextSize(1);
}

// ================= IGNITION =================
void drawIgnitionLoading(int frame, float suhu, bool apiOK, int retry) {
  display.clearDisplay();

  display.setCursor(10, 5);
  display.print("MENYALAKAN API");

  display.setCursor(0, 20);
  display.print("Suhu : ");
  display.print(suhu, 1);
  display.print(" C");

  display.setCursor(0, 32);
  display.print("Percobaan : ");
  display.print(retry + 1);

  display.setCursor(30, 45);
  display.print("Loading");
  for (int i = 0; i < frame; i++) display.print(".");

  display.setCursor(0, 55);
  if (apiOK) {
    display.print("API TERDETEKSI");
  } else {
    display.print("MENCOBA...");
  }

  display.display();
}

// ================= RUNNING =================
void drawRunning(float suhu, float pressure) {
  display.clearDisplay();

  display.setCursor(0, 0);
  display.print("STERILISASI JALAN");

  // ===== SUHU =====
  display.setCursor(0, 12);
  display.print("Suhu : ");
  display.print(suhu, 1);
  display.print("C/");
  display.print(setSuhu);
  display.print("C");

  // ===== TEKANAN =====
  display.setCursor(0, 22);
  display.print("Tek  : ");
  display.print(pressure, 1);
  display.print("b/");
  display.print(setTekanan, 1);
  display.print("b");

  // ===== TIMER =====
  int jam = sisaDetik / 3600;
  int menit = (sisaDetik % 3600) / 60;
  int detik = sisaDetik % 60;

  display.setCursor(0, 36);
  display.print("Timer : ");
  display.print(jam); display.print(":");
  if (menit < 10) display.print("0");
  display.print(menit); display.print(":");
  if (detik < 10) display.print("0");
  display.print(detik);

  display.setCursor(0, 54);
  display.print("SEL=STOP");

  display.display();
}

// ================= FINISH =================
void drawFinish() {
  display.clearDisplay();
  display.setCursor(10, 25);
  display.print("PROSES STERILISASI");
  display.setCursor(35, 38);
  display.print("SELESAI");
  display.setCursor(35, 55);
  display.print("> EXIT");
  display.display();
}

// ================= SETUP =================
void setup() {
  Wire.begin(SDA_PIN, SCL_PIN);
  display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR);
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);

  pinMode(BTN_UP, INPUT_PULLUP);
  pinMode(BTN_DOWN, INPUT_PULLUP);
  pinMode(BTN_SELECT, INPUT_PULLUP);

  welcomeAnimation();
  drawMainMenu();

  // ===== LOAD WIFI DARI MEMORY =====
  preferences.begin("wifi", false);

  String savedSSID = preferences.getString("ssid", "");
  String savedPASS = preferences.getString("pass", "");

  if (savedSSID != "") {
    WiFi.mode(WIFI_STA);
    WiFi.begin(savedSSID.c_str(), savedPASS.c_str());

    unsigned long startAttempt = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 8000) {
      delay(200);
    }

    if (WiFi.status() == WL_CONNECTED) {
      wifiConnected = true;
      connectedSSID = savedSSID;
    }
  }
  // ===== INIT SENSOR & AKTUATOR =====
  max31865.begin(MAX31865_3WIRE);

  pinMode(RELAY_IGNITER, OUTPUT);
  pinMode(RELAY_VALVE, OUTPUT);

  digitalWrite(RELAY_IGNITER, HIGH);
  digitalWrite(RELAY_VALVE, HIGH);

  gasServo.attach(SERVO_PIN);
  gasServo.write(SERVO_LEVEL_2); // TUTUP TOTAL

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  lastPID = millis();
}



// ================= LOOP =================
void loop() {
  // ===== UPDATE STATUS WIFI REALTIME =====
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    connectedSSID = WiFi.SSID();
  } else {
    wifiConnected = false;
  }

  // ===== MAIN MENU =====
  if (currentMode == MODE_MAIN_MENU) {
    if (digitalRead(BTN_UP) == LOW || digitalRead(BTN_DOWN) == LOW) {
      menuIndex = !menuIndex;
      drawMainMenu();
      delay(200);
    }
    if (digitalRead(BTN_SELECT) == LOW) {

      if (menuIndex == 0) {              // Sterilisasi
        currentMode = MODE_STERIL;
        drawSterilisasi();
      }

      else if (menuIndex == 1) {         // Detail
        currentMode = MODE_DETAIL;
        drawDetail();                    // (nanti kita buat)
      }

      delay(300);
    }
  }

  // ===== STERIL =====
  else if (currentMode == MODE_STERIL) {

    if (!editMode) {
      if (digitalRead(BTN_UP) == LOW) {
        sterilIndex = (sterilIndex + 4) % 5;
        drawSterilisasi(); delay(200);
      }
      if (digitalRead(BTN_DOWN) == LOW) {
        sterilIndex = (sterilIndex + 1) % 5;
        drawSterilisasi(); delay(200);
      }
      if (digitalRead(BTN_SELECT) == LOW) {

        if (sterilIndex <= 2) {
          editMode = true;
        }

        else if (sterilIndex == 3) {        // START
          currentMode = MODE_COUNTDOWN;
        }

        else if (sterilIndex == 4) {        // BACK
          currentMode = MODE_MAIN_MENU;
          drawMainMenu();                   // <<< INI KUNCI UTAMANYA
        }

        delay(300);
      }
    }

    else {
      if (digitalRead(BTN_UP) == LOW) {
        if (sterilIndex == 0 && setSuhu < 200) setSuhu++;
        if (sterilIndex == 1 && setTekanan < 10) {
          setTekanan += 0.1;
          setTekanan = round(setTekanan * 10) / 10.0;
        }
        if (sterilIndex == 2) {
          if (durasiCursor == 0 && durasiJam < 23) durasiJam++;
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
          if (durasiCursor == 0 && durasiJam > 0) durasiJam--;
          if (durasiCursor == 1 && durasiMenit > 0) durasiMenit--;
        }
        drawSterilisasi(); delay(150);
      }

      if (digitalRead(BTN_SELECT) == LOW) {
        if (sterilIndex == 2 && durasiCursor == 0) {
          durasiCursor = 1;   // jam → menit
        } else {
          editMode = false;
          durasiCursor = 0;
        }
        drawSterilisasi();
        delay(300);
      }
    }
  }

  // ===== DETAIL =====
  else if (currentMode == MODE_DETAIL) {

    if (digitalRead(BTN_UP) == LOW || digitalRead(BTN_DOWN) == LOW) {
      detailIndex = !detailIndex;
      drawDetail();
      delay(200);
    }

    if (digitalRead(BTN_SELECT) == LOW) {

      if (detailIndex == 0) {   // WiFi dipencet
        currentMode = MODE_WIFI;
        display.clearDisplay();
        display.setCursor(10, 30);
        display.print("MENU WIFI");
        display.display();
      }

      else if (detailIndex == 1) { // Back
        currentMode = MODE_MAIN_MENU;
        drawMainMenu();
      }

      delay(300);
    }
  }

  // ===== MODE WIFI =====
  else if (currentMode == MODE_WIFI) {

    // ===== WIFI MENU =====
    if (wifiState == WIFI_MENU) {
      drawWifiMenu();

      if (digitalRead(BTN_UP) == LOW || digitalRead(BTN_DOWN) == LOW) {
        wifiMenuIndex = !wifiMenuIndex;
        delay(200);
      }

      if (digitalRead(BTN_SELECT) == LOW) {
        if (wifiMenuIndex == 0) {
          wifiState = WIFI_SCAN;
          WiFi.mode(WIFI_STA);
          WiFi.disconnect();
          delay(100);

          wifiCount = WiFi.scanNetworks();
          if (wifiCount > 10) wifiCount = 10;

          wifiIndex = 0;
          wifiScroll = 0;

          for (int i = 0; i < wifiCount; i++) {
            wifiSSID[i] = WiFi.SSID(i);
          }
        } else {
          currentMode = MODE_DETAIL;
          drawDetail();
        }
        delay(300);
      }
    }

    // ===== WIFI SCAN LIST =====
    else if (wifiState == WIFI_SCAN) {
      drawWifiList();

      if (digitalRead(BTN_UP) == LOW) {
        if (wifiCount > 0) {
          wifiIndex = (wifiIndex + wifiCount - 1) % wifiCount;
        }
        delay(200);
      }

      if (digitalRead(BTN_DOWN) == LOW) {
        if (wifiCount > 0) {
          wifiIndex = (wifiIndex + 1) % wifiCount;
        }
        delay(200);
      }

      if (digitalRead(BTN_SELECT) == LOW) {
        wifiPassword = "";
        passCursor = 0;
        currentChar = 'a';
        wifiState = WIFI_PASSWORD;
        delay(300);
      }
    }
    // ===== INPUT PASSWORD =====
    else if (wifiState == WIFI_PASSWORD) {

      drawWifiPassword();

      // UP = next char
      if (digitalRead(BTN_UP) == LOW) {
        for (int i = 0; i < charsetLength; i++) {
          if (charset[i] == currentChar) {
            currentChar = charset[(i + 1) % charsetLength];
            break;
          }
        }
        delay(150);
      }

      // DOWN = prev char
      if (digitalRead(BTN_DOWN) == LOW) {
        for (int i = 0; i < charsetLength; i++) {
          if (charset[i] == currentChar) {
            currentChar = charset[(i - 1 + charsetLength) % charsetLength];
            break;
          }
        }
        delay(150);
      }

      // SELECT = tambahkan karakter
      if (digitalRead(BTN_SELECT) == LOW) {
        wifiPassword += currentChar;
        passCursor++;
        delay(250);
      }

      // Jika password sudah minimal 8 karakter → tahan UP 2 detik untuk connect
      if (wifiPassword.length() >= 8 && digitalRead(BTN_UP) == LOW) {
        delay(1500);
        if (digitalRead(BTN_UP) == LOW) {
          wifiState = WIFI_CONNECT;
        }
      }
    }



    // ===== CONNECTING =====
    else if (wifiState == WIFI_CONNECT) {

      WiFi.begin(wifiSSID[wifiIndex].c_str(), wifiPassword.c_str());

      unsigned long startAttempt = millis();

      while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 10000) {
        drawWifiConnecting((millis() / 500) % 4);
      }

      wifiConnected = (WiFi.status() == WL_CONNECTED);

      if (wifiConnected) {
        connectedSSID = wifiSSID[wifiIndex];

        // ===== SAVE KE MEMORY =====
        preferences.putString("ssid", connectedSSID);
        preferences.putString("pass", wifiPassword);
      }

      wifiState = WIFI_STATUS;
    }

    // ===== STATUS =====
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
    for (int i = 3; i > 0; i--) {
      drawCountdown(i);
      delay(1000);
    }

    suhuAwal = max31865.temperature(RNOMINAL, RREF);
    currentMode = MODE_IGNITION;
    delay(1000);
  }

  // ===== IGNITION =====
  else if (currentMode == MODE_IGNITION) {

    static unsigned long ignitionStart = 0;
    float suhu = max31865.temperature(RNOMINAL, RREF);
    int servoLevel;
    int servoAngle;

    if (ignitionStart == 0) {
      ignitionStart = millis();
      //      suhuAwal = suhu;
      apiTerdeteksi = false;

      gasServo.write(SERVO_LEVEL_2);             // buka gas kecil
      digitalWrite(RELAY_IGNITER, LOW); // nyalakan pemantik
    }

    // deteksi api dari kenaikan suhu
    if (suhu >= suhuAwal + 10) {
      apiTerdeteksi = true;
    }

    drawIgnitionLoading((millis() / 500) % 4, suhu, apiTerdeteksi, ignitionRetry);

    if (millis() - ignitionStart >= 15000) {

      digitalWrite(RELAY_IGNITER, HIGH); // matikan pemantik

      if (apiTerdeteksi) {
        // ✅ BERHASIL
        ignitionRetry = 0;

        sisaDetik = durasiJam * 3600L + durasiMenit * 60L;
        lastMillis = millis();
        currentMode = MODE_RUNNING;
      } else {
        // ❌ GAGAL
        ignitionRetry++;

        if (ignitionRetry < maxRetry) {
          ignitionStart = 0; // ulangi lagi
        } else {
          // gagal total
          gasServo.write(SERVO_LEVEL_2); // TUTUP TOTAL
          ignitionRetry = 0;

          display.clearDisplay();
          display.setCursor(20, 25);
          display.print("GAGAL NYALA!");
          display.setCursor(15, 45);
          display.print("CEK GAS/API");
          display.display();

          delay(3000);

          currentMode = MODE_STERIL;
          drawSterilisasi();
        }
      }
    }
  }
  // ===== RUNNING =====
  else if (currentMode == MODE_RUNNING) {

    float suhu = max31865.temperature(RNOMINAL, RREF);

    // ===== PID SUHU =====
    float error = setSuhu - suhu;

    int servoLevel;
    int servoAngle;

    if (error > 5) {
      // Suhu belum tercapai → gas besar
      servoLevel = 2;
      servoAngle = SERVO_LEVEL_2;
    } else {
      // Suhu sudah tercapai / mendekati target → gas kecil untuk pertahankan
      servoLevel = 1;
      servoAngle = SERVO_LEVEL_1;
    }

    gasServo.write(servoAngle);


    // ===== SENSOR TEKANAN =====
    int adcValue = analogRead(PRESSURE_PIN);
    float voltage_div = (adcValue / 4095.0) * 3.3;
    float voltage_real = voltage_div * ((10000.0 + 20000.0) / 20000.0);

    float pressure = ((voltage_real - 0.5) *
                      12.0 /
                      (4.5 - 0.5));

    if (pressure > setTekanan) {
      digitalWrite(RELAY_VALVE, LOW);
    } else {
      digitalWrite(RELAY_VALVE, HIGH);
    }

    // ===== TIMER =====
    if (millis() - lastMillis >= 1000) {
      lastMillis = millis();
      sisaDetik--;
      if (sisaDetik <= 0) {
        gasServo.write(SERVO_LEVEL_0); // TUTUP TOTAL
        currentMode = MODE_FINISH;
      }
      drawRunning(suhu, pressure);
    }

    if (digitalRead(BTN_SELECT) == LOW) {
      gasServo.write(SERVO_LEVEL_0); // TUTUP TOTAL
      currentMode = MODE_STERIL;
      drawSterilisasi();
      delay(300);
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
