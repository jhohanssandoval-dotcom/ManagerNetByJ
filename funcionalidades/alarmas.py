import requests
import os
TOKEN = '8154946024:AAFEbU1TRZ8ZusCLxrKZ0KG8t-a7KB4Tp9w'  
CHAT_ID = 1242093074

def mensajePorts(mensaje, puertos):
    MENSAJE = f"{mensaje} {puertos}" 
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    params = {
        "chat_id": CHAT_ID,
        "text": MENSAJE
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            print("Alerta enviada con éxito.")
        else:
            print("Error al enviar la alerta:", response.text)
    except requests.exceptions.RequestException as e:
        print("Error de conexión:", e)

def mensajeL1Active():
    MENSAJE='ATENCION!!! Linea Principal se encuentra inactiva...'
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    params = {
        "chat_id": CHAT_ID,
        "text": MENSAJE
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            print("Alerta enviada con éxito.")
        else:
            print("Error al enviar la alerta:", response.text)
    except requests.exceptions.RequestException as e:
        print("Error de conexión:", e)

def mensajeL2Active():
    MENSAJE='ATENCION!!! Linea Secundaria se encuentra inactiva...'
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    params = {
        "chat_id": CHAT_ID,
        "text": MENSAJE
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            print("Alerta enviada con éxito.")
        else:
            print("Error al enviar la alerta:", response.text)
    except requests.exceptions.RequestException as e:
        print("Error de conexión:", e)

def mensajeAlarmaTemperatura(tempActual, tempSP):
    MENSAJE=f'ATENCION!!! La temperatura actual es: {tempActual}, Y la temperatura limite del SP es: {tempSP}'
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    params = {
        "chat_id": CHAT_ID,
        "text": MENSAJE
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            print("Alerta enviada con éxito.")
        else:
            print("Error al enviar la alerta:", response.text)
    except requests.exceptions.RequestException as e:
        print("Error de conexión:", e)

def mensajeDeviceOffline(device, IP, state):
    MENSAJE=f'ATENCION!!! El dispositivo: {device}, con la IP: {IP} SE ENCUENTRA EN ESTADO: {state}!!!'
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    params = {
        "chat_id": CHAT_ID,
        "text": MENSAJE
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            print("Alerta enviada con éxito.")
        else:
            print("Error al enviar la alerta:", response.text)
    except requests.exceptions.RequestException as e:
        print("Error de conexión:", e)

