#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_MAX31865.h>

/* ================= OLED ================= */
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_ADDR 0x3C

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

/* =============== MAX31865 =============== */
#define MAX_CS   5
#define MAX_MOSI 23
#define MAX_MISO 19
#define MAX_CLK  18

Adafruit_MAX31865 max31865(
  MAX_CS, MAX_MOSI, MAX_MISO, MAX_CLK
);

// PT100
#define RREF      430.0
#define RNOMINAL  100.0

void setup() {
  Serial.begin(115200);

  /* Init MAX31865 */
  max31865.begin(MAX31865_3WIRE);

  /* Init I2C OLED */
  Wire.begin(21, 22);

  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    Serial.println("OLED gagal");
    while (1);
  }

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("PT100 + MAX31865");
  display.println("ESP32 Ready");
  display.display();
  delay(2000);
}

void loop() {
  float suhu = max31865.temperature(RNOMINAL, RREF);
  uint8_t fault = max31865.readFault();

  /* Serial Monitor */
  Serial.print("Suhu: ");
  Serial.print(suhu);
  Serial.println(" C");

  /* OLED */
  display.clearDisplay();
  display.setCursor(0, 0);
  display.setTextSize(1);
  display.println("Monitoring Suhu");

  display.setTextSize(2);
  display.setCursor(0, 20);
  display.print(suhu, 2);
  display.print(" C");

  display.setTextSize(1);
  display.setCursor(0, 50);

  if (fault) {
    display.print("Fault: 0x");
    display.print(fault, HEX);
    max31865.clearFault();
  } else {
    display.print("Status: OK");
  }

  display.display();
  delay(1000);
} 
