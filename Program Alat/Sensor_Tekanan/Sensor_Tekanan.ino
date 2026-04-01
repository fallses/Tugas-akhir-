#define PRESSURE_PIN 34

float voltageMin = 0.5;
float voltageMax = 4.5;
float pressureMin = 0.0;
float pressureMax = 12.0;

float R1 = 15000.0;
float R2 = 20000.0;

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
}

void loop() {

  int adcValue = analogRead(PRESSURE_PIN);

  float voltage_div = (adcValue / 4095.0) * 3.3;

  float voltage_real = voltage_div * ((R1 + R2) / R2);

  float pressure = ((voltage_real - voltageMin) *
                   (pressureMax - pressureMin) /
                   (voltageMax - voltageMin));

  if (pressure < 0) pressure = 0;

  Serial.print("Pressure: ");
  Serial.print(pressure, 2);
  Serial.println(" bar");

  delay(1000);
}
