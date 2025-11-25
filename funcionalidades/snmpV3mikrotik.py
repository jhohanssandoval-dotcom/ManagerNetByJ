import asyncio
from pysnmp.hlapi.v3arch.asyncio import *
import json
import datetime

#--------------OID'S------------------------#

MODELO=['1.3.6.1.2.1.1.1.0',
        '1.3.6.1.2.1.1.5.0',           #HOST_NAME
        '1.3.6.1.2.1.1.3.0',           #UPTIME
        '1.3.6.1.4.1.14988.1.1.3.14.0',#FREC
        '1.3.6.1.4.1.2021.11.10.0']    #CPU

RAM=['1.3.6.1.2.1.25.2.3.1.5.65536',  #RAM_TOTAL
     '1.3.6.1.2.1.25.2.3.1.6.65536']  #RAM_USADA

interfaces=[
#eth1
['1.3.6.1.2.1.31.1.1.1.1.2', #NOMBRE_INTERFACE
'1.3.6.1.2.1.2.2.1.7.2',    #UP_DOWN
'1.3.6.1.2.1.2.2.1.8.2',    #DISPOSITIVO_CONECTADO
'1.3.6.1.2.1.31.1.1.1.6.2', #TRAFICO_IN
'1.3.6.1.2.1.31.1.1.1.10.2',#TRAFICO_OUT
'1.3.6.1.2.1.2.2.1.14.2',   #ERRORES_IN
'1.3.6.1.2.1.2.2.1.20.2',   #ERRORES_OUT
'1.3.6.1.2.1.2.2.1.13.2',   #DROPS_IN
'1.3.6.1.2.1.2.2.1.19.2'],   #DROPS_IN
#eth2
['1.3.6.1.2.1.31.1.1.1.1.3', #NOMBRE_INTERFACE
'1.3.6.1.2.1.2.2.1.7.3',    #UP_DOWN
'1.3.6.1.2.1.2.2.1.8.3',    #DISPOSITIVO_CONECTADO
'1.3.6.1.2.1.31.1.1.1.6.3', #TRAFICO_IN
'1.3.6.1.2.1.31.1.1.1.10.3',#TRAFICO_OUT
'1.3.6.1.2.1.2.2.1.14.3',   #ERRORES_IN
'1.3.6.1.2.1.2.2.1.20.3',   #ERRORES_OUT
'1.3.6.1.2.1.2.2.1.13.3',   #DROPS_IN
'1.3.6.1.2.1.2.2.1.19.3'],   #DROPS_IN
#eth3
['1.3.6.1.2.1.31.1.1.1.1.4', #NOMBRE_INTERFACE
'1.3.6.1.2.1.2.2.1.7.4',    #UP_DOWN
'1.3.6.1.2.1.2.2.1.8.4',    #DISPOSITIVO_CONECTADO
'1.3.6.1.2.1.31.1.1.1.6.4', #TRAFICO_IN
'1.3.6.1.2.1.31.1.1.1.10.4',#TRAFICO_OUT
'1.3.6.1.2.1.2.2.1.14.4',   #ERRORES_IN
'1.3.6.1.2.1.2.2.1.20.4',   #ERRORES_OUT
'1.3.6.1.2.1.2.2.1.13.4',   #DROPS_IN
'1.3.6.1.2.1.2.2.1.19.4'],   #DROPS_IN
#eth4
['1.3.6.1.2.1.31.1.1.1.1.5', #NOMBRE_INTERFACE
'1.3.6.1.2.1.2.2.1.7.5',    #UP_DOWN
'1.3.6.1.2.1.2.2.1.8.5',    #DISPOSITIVO_CONECTADO
'1.3.6.1.2.1.31.1.1.1.6.5', #TRAFICO_IN
'1.3.6.1.2.1.31.1.1.1.10.5',#TRAFICO_OUT
'1.3.6.1.2.1.2.2.1.14.5',   #ERRORES_IN
'1.3.6.1.2.1.2.2.1.20.5',   #ERRORES_OUT
'1.3.6.1.2.1.2.2.1.13.5',   #DROPS_IN
'1.3.6.1.2.1.2.2.1.19.5'],   #DROPS_IN
#wlan
['1.3.6.1.2.1.31.1.1.1.1.7', #NOMBRE_INTERFACE
'1.3.6.1.2.1.2.2.1.7.7',    #UP_DOWN
'1.3.6.1.2.1.2.2.1.8.7',    #DISPOSITIVO_CONECTADO
'1.3.6.1.2.1.31.1.1.1.6.7', #TRAFICO_IN
'1.3.6.1.2.1.31.1.1.1.10.7',#TRAFICO_OUT
'1.3.6.1.2.1.2.2.1.14.7',   #ERRORES_IN
'1.3.6.1.2.1.2.2.1.20.7',   #ERRORES_OUT
'1.3.6.1.2.1.2.2.1.13.7',   #DROPS_IN
'1.3.6.1.2.1.2.2.1.19.7']   #DROPS_IN
]

async def run(ip_, SNMP_USER_, SNMP_AUTH_KEY_, SNMP_PRIV_KEY_,list_OIDS):
    # ----- CONFIGURACIÓN SNMP v3 -----
    SNMP_IP = ip_            # IP de tu Mikrotik
    SNMP_PORT = 161
    SNMP_USER = SNMP_USER_         # <--- Usuario SNMPv3
    SNMP_AUTH_KEY = SNMP_AUTH_KEY_    # <--- Contraseña SNMPv3
    SNMP_AUTH_PROTOCOL = usmHMACSHAAuthProtocol  # Cambia a usmHMACMD5AuthProtocol si usas MD5
    SNMP_PRIV_KEY = SNMP_PRIV_KEY_                # Si no usas cifrado (priv)
    SNMP_PRIV_PROTOCOL = usmAesCfb128Protocol

    snmpEngine = SnmpEngine()

    objects = [ObjectType(ObjectIdentity(oid)) for oid in list_OIDS]

    iterator = get_cmd(
        snmpEngine,
        UsmUserData(
            SNMP_USER,
            SNMP_AUTH_KEY,
            SNMP_PRIV_KEY,
            authProtocol=SNMP_AUTH_PROTOCOL,
            privProtocol=SNMP_PRIV_PROTOCOL,  # Cambia si usas cifrado
        ),
        await UdpTransportTarget.create((SNMP_IP, SNMP_PORT)),
        ContextData(),
        *objects
    )

    errorIndication, errorStatus, errorIndex, varBinds = await iterator
    
    result=[]

    if errorIndication:
        print("Error de red o comunicación:", errorIndication)
    elif errorStatus:
        print(
            "Error SNMP: {} at {}".format(
                errorStatus.prettyPrint(),
                errorIndex and varBinds[int(errorIndex) - 1][0] or "?",
            )
        )
    else:
        for varBind in varBinds:
            value = varBind[1].prettyPrint()
            result.append(value)
        return result

    snmpEngine.close_dispatcher()

def getDataSnmp(ip, SNMP_USER, SNMP_AUTH_KEY, SNMP_PRIV_KEY):
    
    #----------------primera llamada-----------------
    respuestaFinal={}

    respuesta = asyncio.run(run(ip, SNMP_USER, SNMP_AUTH_KEY, SNMP_PRIV_KEY,MODELO))
    respuestaFirst={'modelo':'',
                    'hostName':'',
                    'uptime':'',
                    'frecuencia':'',
                    'cpu':''}
    claves = list(respuestaFirst.keys())
    for k, v in zip(claves, respuesta):
        if k=='uptime':
            valor=float(v)/100 #convertido a segundos
            v=str(datetime.timedelta(seconds=valor))
        if k=='frecuencia':
            v=v+' MHz'
        respuestaFirst[k] = v

    respuesta = asyncio.run(run(ip, SNMP_USER, SNMP_AUTH_KEY, SNMP_PRIV_KEY,RAM))
    totalRam=float(respuesta[0])
    usadoRam=float(respuesta[1])
    porcentajeUsado=str(round( (usadoRam*100)/totalRam, 1))
    respuestaSecond={
        'ram':porcentajeUsado
    }

    #interfaces-----------------------------
    respuestaThird=[]
    for interface in interfaces:
        interfazContenido={
            'nombre':'',
            'estado':'',
            'conectado':'',
            'traficoIn':'',
            'traficoOut':'',
            'erroresIn':'',
            'erroresOut':'',
            'dropsIn':'',
            'dropsOut':''
        }
        claves=list(interfazContenido.keys())
        respuesta = asyncio.run(run(ip, SNMP_USER, SNMP_AUTH_KEY, SNMP_PRIV_KEY,interface))
        for i,j in zip(claves,respuesta):
            if i=='estado':
                if j=='2':
                    j='Down'
                else:
                    j='Up'
            if i=='conectado':
                if j=='2':
                    j='Desconectado'
                else:
                    j='Conectado'
            interfazContenido[i]=j
        respuestaThird.append(interfazContenido)

    respuestaThird={'interfaces':respuestaThird}



    respuestaFinal={**respuestaFirst, **respuestaSecond,**respuestaThird}
    #print(respuestaFinal)

    return respuestaFinal
    
def getDataSnmpJSON(ip, SNMP_USER, SNMP_AUTH_KEY, SNMP_PRIV_KEY): #funcion que se llama desde backend
    return getDataSnmp(ip, SNMP_USER, SNMP_AUTH_KEY, SNMP_PRIV_KEY)


#getDataSnmpJSON('192.168.1.1', 'snmpv3', '12345678', '12345678')
