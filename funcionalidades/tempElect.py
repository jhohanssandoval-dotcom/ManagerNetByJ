# tempElect.py
import serial
import threading
import time

puerto = "COM4"
baudrate = 115200
variableTempShare = ['10.0','0','0']

ser = None  # Manejador global del puerto serial
lock = threading.Lock()  # Para evitar condiciones de carrera

def recibir_datos():
    global variableTempShare
    print(" Hilo de recepción iniciado")
    while True:
        try:
            if ser.in_waiting > 0:
                raw_data = ser.readline()
                datoRecibido = raw_data.decode('utf-8', errors='replace').strip()
                datos = datoRecibido.split(',')
    
                # Solo actualiza si hay 3 elementos numéricos
                if len(datos) == 3 and all(d.replace('.', '', 1).isdigit() for d in datos):
                    with lock:
                        variableTempShare = datos
                        print(f" Recibidoooo: {variableTempShare}")
                else:
                    print(f"Dato ignorado: {datoRecibido}")
        except Exception as e:
            print(f" Error en hilo de recepción: {e}")
            break
        time.sleep(0.1)

def iniciar_hilo_serial():
    global ser
    try:
        ser = serial.Serial(puerto, baudrate, timeout=2)
        ser.reset_input_buffer()
        hilo = threading.Thread(target=recibir_datos, daemon=True)
        hilo.start()
        print(f"Puerto {puerto} abierto y listo.")
    except serial.SerialException as e:
        print(f"Error abriendo el puerto: {e}")

def obtener_Datos():
    with lock:
        return variableTempShare

def enviarToLora(valor, n, LineToActivate):
    #LineToActivate: 0(ninguna), 1(line 1), 2(line 2)#
    #para activar linea el arreglo es de la forma (0,0,LineToActivate)#
    if ser is not None:
        mensaje = f"{valor},{n},{LineToActivate}"
        try:
            ser.write(f"{mensaje}\n".encode('utf-8'))
            print(f"Enviado: {mensaje}")
        except Exception as e:
            print(f"Error enviando al LoRa: {e}")
    else:
        print("El puerto serial no está abierto.")
