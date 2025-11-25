//NODO CONECTADO AL SERVIDOR
#include "LoRaWan_APP.h"
#include "Arduino.h"
#include "CubeCell_NeoPixel.h"
//definiciones de pines
CubeCell_NeoPixel rgbLed(1, RGB, NEO_GRB + NEO_KHZ800);
#ifndef LoraWan_RGB
#define LoraWan_RGB 0
#endif

// --- Configuración LoRa ---
#define RF_FREQUENCY            915000000
#define TX_OUTPUT_POWER         14
#define LORA_BANDWIDTH          0       // 0: 125KHz, 1: 250KHz, 2: 500KHz, 3: Reserved
#define LORA_SPREADING_FACTOR   7       // 7: SF7, 8: SF8, ..., 12: SF12
#define LORA_CODINGRATE         1       // 1: 4/5, 2: 4/6, 3: 4/7, 4: 4/8
#define LORA_PREAMBLE_LENGTH    8
#define LORA_SYMBOL_TIMEOUT     0       // 0: Sin timeout (solo funciona con LORA_FIX_LENGTH_PAYLOAD_ON = true)
                                        // Si no es fijo, se calcula por el tamaño del payload.
                                        // Para Rx con timeout, usar un valor mayor a 5 (ej. 5000ms)
#define LORA_FIX_LENGTH_PAYLOAD_ON false // ¡Importante para longitudes variables de mensaje!
#define LORA_IQ_INVERSION_ON    false

#define BUFFER_SIZE 50 // Asegúrate que este sea suficiente para tus mensajes
char txpacket[BUFFER_SIZE];
char rxpacket[BUFFER_SIZE];

static RadioEvents_t RadioEvents;
bool esperandoEnvio = false; // Flag para saber si un envío está en curso

// ---------- FUNCIONES ----------
void ledRGB_Notify(uint8_t r, uint8_t g, uint8_t b, uint16_t tiempo = 300) {
    rgbLed.setPixelColor(0, rgbLed.Color(r, g, b));
    rgbLed.show();
    delay(tiempo);
    rgbLed.clear();
    rgbLed.show();
}
// Esta función enviará el mensaje recibido por serial
void enviarDatosLoRa(String mensajeLoRa) {
  if (esperandoEnvio) {
    Serial.println(" Ya hay un envío en curso. Espera a que termine.");
    return;
  }

  // Asegurarse de que el mensaje no exceda el tamaño del buffer
  if (mensajeLoRa.length() >= BUFFER_SIZE) {
    Serial.println(" Mensaje demasiado largo para LoRa. Truncando.");
    mensajeLoRa = mensajeLoRa.substring(0, BUFFER_SIZE - 1); // Truncar si es muy largo
  }

  // Convertir String a char array (buffer)
  // strlen(mensajeLoRa.c_str()) es más preciso para la longitud actual
  mensajeLoRa.toCharArray(txpacket, BUFFER_SIZE);

  Serial.print(" Enviando: ");
  Serial.println(txpacket);

  Radio.Send((uint8_t *)txpacket, strlen(txpacket));
  esperandoEnvio = true; // Establece el flag de envío en curso
}

// Inicia el modo de recepción
void iniciarRecepcion() {
  esperandoEnvio = false; // Asegura que el flag de envío esté en false al entrar en Rx
  Serial.println(" Escuchando...");
  Radio.Rx(0); // Rx(0) significa modo continuo de recepción
}

// ---------- Callbacks de eventos de Radio ----------

void onTxDone() {
  Serial.println(" Envío completado.");
  ledRGB_Notify(0, 0, 80);
  iniciarRecepcion(); // Vuelve al modo de recepción después de enviar
}

void onTxTimeout() {
  Serial.println(" Timeout en envío.");
  iniciarRecepcion(); // Vuelve al modo de recepción después de un timeout
}

void onRxDone(uint8_t *payload, uint16_t size, int16_t rssi, int8_t snr) {
  // Copia el payload recibido al buffer y asegúrate de que sea nulo-terminado
  memcpy(rxpacket, payload, size);
  rxpacket[size] = '\0';
  Serial.println(rxpacket);
  ledRGB_Notify(0, 80, 0);
  Serial.printf(" Recibido: %s | RSSI: %d dBm | SNR: %d dB\n", rxpacket, rssi, snr);
  iniciarRecepcion(); // Vuelve a iniciar la recepción después de recibir
}


// ---------- SETUP ----------
void setup() {
  pinMode(Vext, OUTPUT);
  digitalWrite(Vext, LOW); // Activar alimentación Vext
  rgbLed.begin();
  rgbLed.clear();
  rgbLed.show();
  Serial.begin(115200);
  while (!Serial); // Espera a que el monitor serial esté abierto (útil para depuración)
  Serial.println(" Nodo LoRa listo. Envía un mensaje por serial (ej. 'Hola,Mundo') para transmitir.");

  // Configurar los callbacks de eventos de la radio
  RadioEvents.TxDone = onTxDone;
  RadioEvents.TxTimeout = onTxTimeout;
  RadioEvents.RxDone = onRxDone;

  Radio.Init(&RadioEvents);
  Radio.SetChannel(RF_FREQUENCY);

  // Configuración de Transmisión (Tx)
  Radio.SetTxConfig(MODEM_LORA, TX_OUTPUT_POWER, 0, LORA_BANDWIDTH,
                    LORA_SPREADING_FACTOR, LORA_CODINGRATE,
                    LORA_PREAMBLE_LENGTH, LORA_FIX_LENGTH_PAYLOAD_ON,
                    true, 0, 0, LORA_IQ_INVERSION_ON, 3000); // 3000ms = 3 segundos de timeout para Tx

  // Configuración de Recepción (Rx)
  Radio.SetRxConfig(MODEM_LORA, LORA_BANDWIDTH, LORA_SPREADING_FACTOR,
                    LORA_CODINGRATE, 0, LORA_PREAMBLE_LENGTH,
                    LORA_SYMBOL_TIMEOUT, LORA_FIX_LENGTH_PAYLOAD_ON,
                    0, true, 0, 0, LORA_IQ_INVERSION_ON, true); // Último 'true' para Rx continuo

  iniciarRecepcion(); // Inicia la radio en modo de recepción al principio
}

// ---------- LOOP ----------
void loop() {
  // ¡ESENCIAL! Procesa los eventos de la radio. Sin esto, los callbacks no se dispararán.
  Radio.IrqProcess();

  // Si hay datos disponibles en el puerto serial para leer
  if (Serial.available()) {
    String entradaSerial = Serial.readStringUntil('\n'); // Lee hasta el carácter de nueva línea
    entradaSerial.trim(); // Elimina espacios en blanco y saltos de línea/retornos de carro

    // Si recibimos una cadena no vacía y no estamos esperando un envío actual
    if (entradaSerial.length() > 0 && !esperandoEnvio) {
      Serial.print(" Serial recibido: '");
      Serial.print(entradaSerial);
      Serial.println("'");

      Radio.Sleep(); // Pone la radio en modo de bajo consumo antes de enviar
      enviarDatosLoRa(entradaSerial); // Envía la cadena leída por serial a través de LoRa
    } else if (esperandoEnvio) {
      Serial.println(" Ignorando entrada serial: ya hay un envío LoRa en curso.");
    }
  }
}
