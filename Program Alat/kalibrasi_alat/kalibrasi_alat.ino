#include <SPI.h>
#include <Adafruit_MAX31865.h>
#include <ESP32Servo.h>

// ================= PIN =================
#define RELAY_IGNITER 26
#define SERVO_PIN 4

#define MAX_CS   5
#define MAX_MOSI 23
#define MAX_MISO 19
#define MAX_CLK  18

// ================= SENSOR =================
Adafruit_MAX31865 max31865(MAX_CS, MAX_MOSI, MAX_MISO, MAX_CLK);

#define RREF 430.0
#define RNOMINAL 100.0

// ================= SERVO =================
Servo gasServo;

#define SERVO_LEVEL_0 180  // gas tertutup
#define SERVO_LEVEL_1 120   // gas kecil
#define SERVO_LEVEL_2 100   // gas besar

// ================= SERIAL INPUT =================
String inputString = "";
bool stringComplete = false;

// ================= SETUP =================
void setup() {
  Serial.begin(115200);

  pinMode(RELAY_IGNITER, OUTPUT);
  digitalWrite(RELAY_IGNITER, HIGH); // OFF

  gasServo.attach(SERVO_PIN);
  gasServo.write(SERVO_LEVEL_0); // default aman

  max31865.begin(MAX31865_3WIRE);

  Serial.println("=== MODE MANUAL ===");
  Serial.println("Perintah:");
  Serial.println("servo 0 / 1 / 2");
  Serial.println("igniter on / off");
  Serial.println("read");
}

// ================= LOOP =================
void loop() {
  readSerialCommand();
}

// ================= BACA SERIAL =================
void readSerialCommand() {
  while (Serial.available()) {
    char inChar = (char)Serial.read();

    if (inChar == '\n') {
      stringComplete = true;
    } else {
      inputString += inChar;
    }
  }

  if (stringComplete) {
    inputString.trim(); // hapus spasi & newline
    processCommand(inputString);

    inputString = "";
    stringComplete = false;
  }
}

// ================= PROSES PERINTAH =================
void processCommand(String cmd) {

  // ===== SERVO CONTROL =====
  if (cmd == "servo 0") {
    gasServo.write(SERVO_LEVEL_0);
    Serial.println("Gas TERTUTUP");
  }
  else if (cmd == "servo 1") {
    gasServo.write(SERVO_LEVEL_1);
    Serial.println("Gas KECIL");
  }
  else if (cmd == "servo 2") {
    gasServo.write(SERVO_LEVEL_2);
    Serial.println("Gas BESAR");
  }

  // ===== IGNITER =====
  else if (cmd == "igniter on") {
    digitalWrite(RELAY_IGNITER, LOW);
    Serial.println("Igniter NYALA");
  }
  else if (cmd == "igniter off") {
    digitalWrite(RELAY_IGNITER, HIGH);
    Serial.println("Igniter MATI");
  }

  // ===== BACA SUHU =====
  else if (cmd == "read") {
    float suhu = max31865.temperature(RNOMINAL, RREF);
    Serial.print("Suhu: ");
    Serial.print(suhu);
    Serial.println(" C");
  }

  // ===== UNKNOWN =====
  else {
    Serial.println("Perintah tidak dikenal!");
  }
}
