#[admin@MikroTik] > interface/disable ether3
#[admin@MikroTik] > interface/enable ether3
# puertos= ether1;ether2;ether3....
import netmiko
from netmiko import ConnectHandler

def upPorts(brand, ip, usuario, contraseña, puertos):
    if brand == 'mikrotik':
        mikrotik = {
            "device_type": "mikrotik_routeros",
            "ip": ip,
            "username": usuario,
            "password": contraseña,
        }
        # Conexión SSH
        try:
            print("[+] Conectando al mikrotik...")
            net_connect = ConnectHandler(**mikrotik)
        except Exception as e:
            print(f"[!] Error al conectar: {e}")
            return
        
        for iface in puertos:
            net_connect.send_command(f"/interface enable {iface}")
            
    elif brand == 'cisco':
        cisco = {
            "device_type": "cisco_ios",
            "ip": ip,
            "username": usuario,
            "password": contraseña,
        }
        # Conexión SSH
        try:
            print("[+] Conectando al cisco...")
            net_connect = ConnectHandler(**cisco)
        except Exception as e:
            print(f"[!] Error al conectar: {e}")
            return
        for iface in puertos:
            net_connect.send_config_set([f"interface {iface}","no shutdown"])

def downPorts(brand, ip, usuario, password, puertos):
    if brand == 'mikrotik':
        mikrotik = {
            "device_type": "mikrotik_routeros",
            "ip": ip,
            "username": usuario,
            "password": password,
        }
        # Conexión SSH
        try:
            print("[+] Conectando al mikrotik...")
            net_connect = ConnectHandler(**mikrotik)
        except Exception as e:
            print(f"[!] Error al conectar: {e}")
            return
        for iface in puertos:
            net_connect.send_command(f"/interface disable {iface}")
    elif brand == 'cisco':
        cisco = {
            "device_type": "cisco_ios",
            "ip": ip,
            "username": usuario,
            "password": password,
        }
        # Conexión SSH
        try:
            print("[+] Conectando al cisco...")
            net_connect = ConnectHandler(**cisco)
        except Exception as e:
            print(f"[!] Error al conectar: {e}")
            return
        for iface in puertos:
            net_connect.send_config_set([f"interface {iface}","shutdown"])
