import netmiko
import google.generativeai as genai
import json
from netmiko import ConnectHandler
import re


def obtenerEstadoPuertos(brand, ip, usuario, contraseña):
    informacion={}
    if brand == "mikrotik":
        # Configura los datos de tu MikroTik
        mikrotik = {
            "device_type": "mikrotik_routeros",
            "ip": ip,
            "username": usuario,
            "password": contraseña,
        }

        # Conexión SSH
        try:
            print("[+] Conectando al MikroTik...")
            net_connect = ConnectHandler(**mikrotik)
        except Exception as e:
            print(f"[!] Error al conectar: {e}")
            return

        
        # 1. IP Address
        ip_addr = net_connect.send_command("/ip address print")
        #print("\n--- /ip address print ---")
        #print(ip_addr)
        informacion["info_address"]=ip_addr

        # 2. Interfaces
        interfaces = net_connect.send_command("/interface print")
        #print("\n--- /interface print ---")
        #print(interfaces)
        informacion["info_interfaces"]=interfaces

        # 3. Ethernet Monitor por interfaz
        #print("\n--- /interface ethernet monitor (por puerto) ---")
        interface_names = []
        for line in interfaces.splitlines():
            if any(name in line for name in ["ether", "bridge", "sfp"]):
                parts = line.split()
                if len(parts) > 1:
                    interface_names.append(parts[1])

        interface_monitors={}
        for iface in interface_names:
            #print(f"\n[+] Monitoreando: {iface}")
            output = net_connect.send_command(f"/interface ethernet monitor {iface} once")
            interface_monitors[iface]=output
            #print(output)
        informacion['interface_monitors']=interface_monitors
            

        # 4. Tabla ARP
        arp_table = net_connect.send_command("/ip arp print")
        #print("\n--- /ip arp print ---")
        #print(arp_table)
        informacion['info_arp']=arp_table

        # 5. Estadísticas de interfaz
        stats = net_connect.send_command("/interface print stats")
        #print("\n--- /interface print stats ---")
        #print(stats)
        informacion['info_stats']=stats

        # Cierre de conexión
        net_connect.disconnect()

    elif brand=="cisco":
        # Configura los datos de tu MikroTik
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
        
        # 1. mac
        interfaces_mac = net_connect.send_command("show mac address-table")
        informacion["interfaces_mac"] = interfaces_mac
        
        # 2. Interfaces y su estado
        interfaces_status = net_connect.send_command("show interface status")
        informacion["interfaces_status"] = interfaces_status

        # 3. Configuración de IP de la interfaz
        ip_interface_brief = net_connect.send_command("show ip interface brief")
        informacion["ip_interface_brief"] = ip_interface_brief
    
        # 4. Tabla ARP
        arp_table = net_connect.send_command("show arp")
        informacion["arp_table"] = arp_table

        # 5. Estadísticas de la interfaz
        interfaces = net_connect.send_command("show interfaces")
        informacion["interfaces"] = interfaces

        net_connect.disconnect()
        
    json_data=json.dumps(informacion, indent=4)
    genai.configure(api_key="AIzaSyCOZoz7MhBy2hTxIVHcKbkI2i1ZgHM45Cc")
    model = genai.GenerativeModel("gemini-2.0-flash")
    prompt=f"""
        Quiero que analices esta información de los puertos en formato JSON.
        ```json{json_data}```
        Fusiona la información de acuerdo a las interfaces
        para cada puerto individual. Organiza la salida mostrando para cada puerto con los
        siguientes campos: interfaz, ip, estado_operativo, estado_administrativo, mac_aprendida(dispositivo conectado al puerto),
        ip_device(ip del dispositivo conectado al puerto), velocidad, duplex, vlan, tipo_conexion, rx_packets, tx_packets, rx_errors, tx_errors.
        Si no encuentras la informacion lo dejas en blanco, quiero que uses las tablas arp y mac  para encontrar
        la ip y mac del equipo conectado y rellenar los campos: mac_aprendida y ip_device
        solo responde con el Json, SIN EXPLICACIONES.
        """
    response = model.generate_content(prompt)
    match = re.search(r"\[.*\]", response.text, re.DOTALL)

    if match:
        json_str = match.group(0)
        try:
            lista_diccionario = json.loads(json_str)
            print(lista_diccionario)
        except json.JSONDecodeError as e:
            print(f"[!] Error al decodificar JSON: {e}")
    else:
        print("[!] No se encontró un bloque JSON válido en la respuesta del modelo.")
        print("Texto recibido:")
        print(response.text)
    return lista_diccionario


    


#obtenerEstadoPuertos('cisco','192.168.1.10','admin','12345678')

