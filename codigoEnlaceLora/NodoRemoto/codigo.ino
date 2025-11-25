//NODO REMOTO
#include "LoRaWan_APP.h"
#include "Arduino.h"
#include "CubeCell_NeoPixel.h"
//definiciones de pines
CubeCell_NeoPixel rgbLed(1, RGB, NEO_GRB + NEO_KHZ800);

#define ventiladorUno GPIO1
#define ventiladorDos GPIO2
#define contactorL1 GPIO3
#define contactorL2 GPIO4
#define inputSignalL1 GPIO5
#define inputSignalL2 GPIO0


#ifndef LoraWan_RGB
#define LoraWan_RGB 0
#endif

#define RF_FREQUENCY            915000000
#define TX_OUTPUT_POWER         14
#define LORA_BANDWIDTH          0 // 125 kHz
#define LORA_SPREADING_FACTOR   7
#define LORA_CODINGRATE         1
#define LORA_PREAMBLE_LENGTH    8
#define LORA_SYMBOL_TIMEOUT     5
#define LORA_FIX_LENGTH_PAYLOAD_ON false
#define LORA_IQ_INVERSION_ON    false

#define BUFFER_SIZE             50

char txpacket[BUFFER_SIZE];
char rxpacket[BUFFER_SIZE];

static RadioEvents_t RadioEvents;

bool lora_idle = false;
float temp=0;
int estadoUno=0;
int estadoDos=0;

float setPoint = 25.0;     // valor inicial por defecto

// Modo de control: 1 = automático, 2 = manual
int modoControl = 1;
int ventiladorManual = 0;  // 1=ON, 0=OFF

float x1=0;
int x2=0;
int x3=0;

int lineToActivate=1;

void getTemp(){
  //Leer el valor crudo (0 a 4095) del pin ADC
  uint16_t rawLevel = analogRead(ADC); 
  //Mapear el valor para un uso práctico (ej. 0-100%)
  temp = (rawLevel * 50.0) / 4095.0;  
}
void estadosDeLineAlimentacion(){
  //cuando recibe 0-> on
  //cuando recibe 1-> off
  if(digitalRead(inputSignalL1)==LOW){
    estadoUno=1;
  }else if(digitalRead(inputSignalL1)==HIGH){
    estadoUno=0;
  }

  if(digitalRead(inputSignalL2)==LOW){
    estadoDos=1;
  }else if(digitalRead(inputSignalL2)==HIGH){
    estadoDos=0;
  }
}

void separarDatosCSV(String receivedData) {
    // Eliminar espacios en blanco alrededor de la cadena, si los hay.
    receivedData.trim();
    int firstComma = receivedData.indexOf(',');
    int secondComma = receivedData.indexOf(',', firstComma + 1);
    // Verificar si se encontraron las dos comas necesarias
    if (firstComma == -1 || secondComma == -1) {
        Serial.println(" ERROR: Formato CSV incorrecto. Faltan comas.");
        return;
    }
    // 3. Obtener el tercer valor (desde la segunda coma hasta el final)
    String s_val3 = receivedData.substring(secondComma + 1);
    x3 = s_val3.toInt();
    // 1. Obtener el primer valor (desde el inicio hasta la primera coma)
    String s_val1 = receivedData.substring(0, firstComma);
    if(x3==0){
      x1 = s_val1.toFloat();
    }
    // 2. Obtener el segundo valor (entre la primera y la segunda coma)
    String s_val2 = receivedData.substring(firstComma + 1, secondComma);
    if(x3==0){
      x2 = s_val2.toInt();
    } 
}

void actualizarEstadoContactor(){
  lineToActivate=x3;
  if(lineToActivate==1){
    digitalWrite(contactorL1,HIGH);
    digitalWrite(contactorL2,LOW);
  }else if(lineToActivate==2){
    digitalWrite(contactorL1,LOW);
    digitalWrite(contactorL2,HIGH);
  }
}
void variablesVentiladores(){
  modoControl = (int)x2;
  if(modoControl==1){//automatico
    setPoint=x1;
  }else if(modoControl==2){//manual
    ventiladorManual=(int)x1;
  } 
}

void estadoVentiladores(){
  if(modoControl==1){
    if(temp>setPoint){
      digitalWrite(ventiladorUno,HIGH);
      digitalWrite(ventiladorDos,HIGH);
    }else{
      digitalWrite(ventiladorUno,LOW);
      digitalWrite(ventiladorDos,LOW);
    }
  }else if(modoControl==2){
    if(ventiladorManual==1){
      digitalWrite(ventiladorUno,HIGH);
      digitalWrite(ventiladorDos,HIGH);
    }else if(ventiladorManual==0){
      digitalWrite(ventiladorUno,LOW);
      digitalWrite(ventiladorDos,LOW);
    }
  }
}

void ledRGB_Notify(uint8_t r, uint8_t g, uint8_t b, uint16_t tiempo = 300) {
    rgbLed.setPixelColor(0, rgbLed.Color(r, g, b));
    rgbLed.show();
    delay(tiempo);
    rgbLed.clear();
    rgbLed.show();
}

void enviarDatos() {
  snprintf(txpacket, BUFFER_SIZE, "%.2f,%d,%d", temp, estadoUno, estadoDos);
  Serial.printf("Enviando: %s\n", txpacket);

  Radio.Sleep(); // Detener recepción
  delay(10);     // Pequeño delay para asegurar cambio de estado
  Radio.Send((uint8_t *)txpacket, strlen(txpacket));
  lora_idle = false;
}

void iniciarRecepcion() {
  Serial.println(" Esperando recepción...");
  Radio.Rx(0); // Modo escucha continuo
  lora_idle = true;
}

void setup() {
  pinMode(Vext, OUTPUT);
  digitalWrite(Vext, LOW); // Activar alimentación Vext
  rgbLed.begin();
  rgbLed.clear();
  rgbLed.show();
  pinMode(ventiladorUno,OUTPUT);
  pinMode(ventiladorDos,OUTPUT);
  pinMode(contactorL1,OUTPUT);
  pinMode(contactorL2,OUTPUT);
  pinMode(inputSignalL1,INPUT);
  pinMode(inputSignalL2,INPUT);
 
  digitalWrite(contactorL1,HIGH);
  digitalWrite(contactorL2,LOW);
  digitalWrite(ventiladorUno,LOW);
  digitalWrite(ventiladorDos,LOW);

  Serial.begin(115200);
  while (!Serial);

  Serial.println(" Nodo LoRa TX/RX iniciado");

  RadioEvents.TxDone = []() {
    Serial.println(" Envío completado.");
    ledRGB_Notify(0, 0, 80);
    iniciarRecepcion();
  };

  RadioEvents.TxTimeout = []() {
    Serial.println(" Timeout en envío.");
    iniciarRecepcion();
  };

  RadioEvents.RxDone = [](uint8_t *payload, uint16_t size, int16_t rssi, int8_t snr) {
    memcpy(rxpacket, payload, size);
    rxpacket[size] = '\0';
    ledRGB_Notify(0, 80, 0);
    separarDatosCSV(rxpacket);
    Serial.printf(" Recibido: %s | RSSI: %d\n", rxpacket, rssi);
    iniciarRecepcion();
  };

  Radio.Init(&RadioEvents);
  Radio.SetChannel(RF_FREQUENCY);

  Radio.SetTxConfig(MODEM_LORA, TX_OUTPUT_POWER, 0, LORA_BANDWIDTH,
                    LORA_SPREADING_FACTOR, LORA_CODINGRATE,
                    LORA_PREAMBLE_LENGTH, LORA_FIX_LENGTH_PAYLOAD_ON,
                    true, 0, 0, LORA_IQ_INVERSION_ON, 3000);

  Radio.SetRxConfig(MODEM_LORA, LORA_BANDWIDTH, LORA_SPREADING_FACTOR,
                    LORA_CODINGRATE, 0, LORA_PREAMBLE_LENGTH,
                    LORA_SYMBOL_TIMEOUT, LORA_FIX_LENGTH_PAYLOAD_ON,
                    0, true, 0, 0, LORA_IQ_INVERSION_ON, true);

  iniciarRecepcion();
}

void loop() {
  getTemp();
  estadosDeLineAlimentacion();
  actualizarEstadoContactor();
  variablesVentiladores();
  estadoVentiladores();

  static unsigned long lastSendTime = 0;
  unsigned long currentTime = millis();

  if (lora_idle && (currentTime - lastSendTime >= 20000UL)) {
    Serial.println("⏱️ Tiempo de enviar nuevo dato...");
    lastSendTime = currentTime;
    enviarDatos();
  }
}
