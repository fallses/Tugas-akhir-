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

// ================= SERIAL =================
String inputString = "";
bool stringComplete = false;

// ================= SETUP =================
void setup() {
  Serial.begin(115200);

  pinMode(RELAY_IGNITER, OUTPUT);
  digitalWrite(RELAY_IGNITER, HIGH); // OFF

  gasServo.attach(SERVO_PIN);
  gasServo.write(170); // default aman

  max31865.begin(MAX31865_3WIRE);

  Serial.println("=== MODE MANUAL (ANGKA) ===");
  Serial.println("Ketik angka 0 - 180 untuk servo");
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
    inputString.trim();
    processCommand(inputString);

    inputString = "";
    stringComplete = false;
  }
}

// ================= PROSES COMMAND =================
void processCommand(String cmd) {

  // ===== CEK APAKAH ANGKA =====
  bool isNumber = true;
  for (int i = 0; i < cmd.length(); i++) {
    if (!isDigit(cmd[i])) {
      isNumber = false;
      break;
    }
  }

  if (isNumber && cmd.length() > 0) {
    int angle = cmd.toInt();

    // BATASI RANGE
    if (angle >= 0 && angle <= 180) {
      gasServo.write(angle);

      Serial.print("Servo ke: ");
      Serial.println(angle);
    } else {
      Serial.println("Range harus 0 - 180!");
    }
    return;
  }

  // ===== IGNITER =====
  if (cmd == "igniter on") {
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
