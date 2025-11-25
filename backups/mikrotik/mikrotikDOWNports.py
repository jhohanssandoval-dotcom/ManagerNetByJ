from netmiko import ConnectHandler
from netmiko.exceptions import NetmikoTimeoutException, NetmikoAuthenticationException
import os

#modelo de backup para una equipo mikrotik
def configuracion(device_type, host, username, password):
    params = {
        'device_type': device_type,
        'host':        host,
        'username':    username,
        'password':    password,
    }

    try:
        con = ConnectHandler(**params)
        ports=['ether2','ether3']
        cmds = [f"/interface disable {p}" for p in ports]
        output = con.send_config_set(cmds)
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
            configuracion("mikrotik_routeros", ip, user, pwd)


if __name__=="__main__":
    start()
            
    
