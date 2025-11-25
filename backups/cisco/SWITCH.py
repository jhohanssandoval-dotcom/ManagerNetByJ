from netmiko import ConnectHandler
from netmiko.exceptions import NetmikoTimeoutException, NetmikoAuthenticationException
import os

#modelo de backup para una equipo cisco
def configuracion(device_type, host, username, password):
    params = {
        'device_type': device_type,
        'host':        host,
        'username':    username,
        'password':    password,
    }

    try:
        con = ConnectHandler(**params)
        print(f"📋 Puertos activos en {host}:")
        output = con.send_command("show interfaces status")
        print(output)

    except (NetmikoTimeoutException, NetmikoAuthenticationException) as e:
        print(f"❌ Error al conectar a {host}: {e}")

    finally:
        # Si 'con' existe, desconéctalo
        try:
            con.disconnect()
        except NameError:
            pass

def start():
    this_file = os.path.abspath(__file__)
    cisco = os.path.dirname(this_file)
    CARPETA_BACKUPS = os.path.dirname(cisco)
    archivo = os.path.join(CARPETA_BACKUPS, 'IpUserPassword.txt')
    with open(archivo) as f:
        for linea in f:
            linea=linea.strip()
            if not linea:
                continue
            partes = [p.split(":",1)[1].strip() for p in linea.split(",")]
            print(partes)
            ip, user, pwd = partes
            #configuracion("cisco_ios", ip, user, pwd)


if __name__=="__main__":
    start()
            
    
