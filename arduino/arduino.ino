#include <TimeLib.h>
#include <Firebase.h>
#include <Wire.h>
#include <AM2320.h>
#include <ESP8266WiFi.h>
#include <WiFiUdp.h>  // Include WiFiUdp library for UDP over WiFi

#define WIFI_SSID     "Hitachigymnasiet_2.4"
#define WIFI_PASSWORD "mittwifiarsabra"
#define FIREBASE_URL  "https://temperatur-9a74e-default-rtdb.europe-west1.firebasedatabase.app/"

AM2320 sensor;

Firebase fb(FIREBASE_URL);

float SensorTemps[4];
float SensorHums[4];

const int timeZone = 1;
int counter;

static const char ntpServerName[] = "time-a.timefreq.bldrdoc.gov";

WiFiUDP Udp;
unsigned int localPort = 8888;

time_t getNtpTime();
void sendNTPpacket(IPAddress &address);

void setup() {
  delay(1500);

  Serial.begin(9600);
  Wire.begin(14, 12);

  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("Success!");
  Serial.println();
  Serial.print("IP Address is: ");
  Serial.println(WiFi.localIP());

  Udp.begin(localPort);
  Serial.print("Local port: ");
  Serial.println(Udp.localPort());
  Serial.println("waiting for sync");
  setSyncProvider(getNtpTime);
  setSyncInterval(300);

  delay(1000);
}

void getTempHum() {
  if (sensor.measure()) {
    SensorTemps[counter % 4] = sensor.getTemperature();
    SensorHums[counter % 4] = sensor.getHumidity();
  } else {
    int errorCode = sensor.getErrorCode();
    switch (errorCode) {
      case 1: Serial.println("ERR: Sensor is offline"); break;
      case 2: Serial.println("ERR: CRC validation failed."); break;
    }
  }

  if (counter % 4 == 0) {
    if(counter == 0) {
      counter++;
      return;
    }
    
    float averageTemp = 0;
    float averageHum = 0;
    for (int i = 0; i < 4; i++) {
      averageTemp += SensorTemps[i];
      averageHum += SensorHums[i];
    }
 
    char path[22];
    sprintf(path, "Room/%d/%d/%d/%d/%d", year(), month(), day(), hour(), minute());

    averageTemp /= 4;
    averageHum /= 4;

    char output[256];
    
    sprintf(output, "{\"temperature\":%.2f,\"humidity\":%.2f}", averageTemp, averageHum);

    fb.setJson(path, output);
  }

  counter++;
}

void loop() {
  getTempHum();
  delay(15000);
}


const int NTP_PACKET_SIZE = 48; // NTP time is in the first 48 bytes of message
byte packetBuffer[NTP_PACKET_SIZE]; //buffer to hold incoming & outgoing packets

time_t getNtpTime()
{
  IPAddress ntpServerIP; // NTP server's ip address

  while (Udp.parsePacket() > 0) ; // discard any previously received packets
  Serial.println("Transmit NTP Request");
  // get a random server from the pool
  WiFi.hostByName(ntpServerName, ntpServerIP);
  Serial.print(ntpServerName);
  Serial.print(": ");
  Serial.println(ntpServerIP);
  sendNTPpacket(ntpServerIP);
  uint32_t beginWait = millis();
  while (millis() - beginWait < 1500) {
    int size = Udp.parsePacket();
    if (size >= NTP_PACKET_SIZE) {
      Serial.println("Receive NTP Response");
      Udp.read(packetBuffer, NTP_PACKET_SIZE);  // read packet into the buffer
      unsigned long secsSince1900;
      // convert four bytes starting at location 40 to a long integer
      secsSince1900 =  (unsigned long)packetBuffer[40] << 24;
      secsSince1900 |= (unsigned long)packetBuffer[41] << 16;
      secsSince1900 |= (unsigned long)packetBuffer[42] << 8;
      secsSince1900 |= (unsigned long)packetBuffer[43];
      return secsSince1900 - 2208988800UL + timeZone * SECS_PER_HOUR;
    }
  }
  Serial.println("No NTP Response :-(");
  return 0; // return 0 if unable to get the time
}

void sendNTPpacket(IPAddress &address)
{
  // set all bytes in the buffer to 0
  memset(packetBuffer, 0, NTP_PACKET_SIZE);
  // Initialize values needed to form NTP request
  // (see URL above for details on the packets)
  packetBuffer[0] = 0b11100011;   // LI, Version, Mode
  packetBuffer[1] = 0;     // Stratum, or type of clock
  packetBuffer[2] = 6;     // Polling Interval
  packetBuffer[3] = 0xEC;  // Peer Clock Precision
  // 8 bytes of zero for Root Delay & Root Dispersion
  packetBuffer[12] = 49;
  packetBuffer[13] = 0x4E;
  packetBuffer[14] = 49;
  packetBuffer[15] = 52;
  // all NTP fields have been given values, now
  // you can send a packet requesting a timestamp:
  Udp.beginPacket(address, 123); //NTP requests are to port 123
  Udp.write(packetBuffer, NTP_PACKET_SIZE);
  Udp.endPacket();
}
