from flask import Flask, send_from_directory, jsonify, request, abort
import os
import random
from flask_sqlalchemy import SQLAlchemy
from funcionalidades.models import db, Equipo, EstadoEquipo, Temperatura
from funcionalidades import infoPuertos
from funcionalidades import updownPorts
from funcionalidades import alarmas
from funcionalidades import tempElect
from funcionalidades import pingDevice
from funcionalidades import ejecutar
from funcionalidades import snmpV3mikrotik
from funcionalidades import edittxt
from datetime import datetime, time, date
import pytz
app = Flask(__name__)

IPS_PERMITIDAS = ['127.0.0.1', '192.168.1.149']
@app.before_request
def limitar_ip():
    if request.remote_addr not in IPS_PERMITIDAS:
        abort(403)

#BASE DE DATOS
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///baseDeDatos.db'  # Para SQLite
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    db.create_all()

# Configuración de rutas
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DIR = os.path.join(BASE_DIR, 'templates')
STATIC_DIR = os.path.join(BASE_DIR, 'static')
CARPETA_BACKUPS = os.path.join(os.getcwd(), 'backups')

# Rutas principales
@app.route('/')
def inicio():
    return send_from_directory(TEMPLATE_DIR, 'inicio.html')

@app.route('/shell-automation')
def shellAutomation():
    return send_from_directory(TEMPLATE_DIR, 'shellAutomation.html')

@app.route('/control-temperatura')
def estElectControlTemp():
    return send_from_directory(TEMPLATE_DIR, 'estElectControlTemp.html')

@app.route('/estado-red')
def estadoHardware():
    return send_from_directory(TEMPLATE_DIR, 'estadoRed.html')

@app.route('/estado-puertos')
def estadoPortDevice():
    return send_from_directory(TEMPLATE_DIR, 'estadoPortDevice.html')

@app.route('/estado-equipo')
def estadoEquipo():
    return send_from_directory(TEMPLATE_DIR, 'estadoEquipo.html')

@app.route('/nac')
def nac():
    return send_from_directory(TEMPLATE_DIR, 'nac.html')

@app.route('/tablas')
def tablas():
    return send_from_directory(TEMPLATE_DIR, 'tablas.html')

# Archivos estáticos
@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory(os.path.join(STATIC_DIR, 'js'), filename)

@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory(os.path.join(STATIC_DIR, 'css'), filename)




#api imagenes de las lineas de suministro electrico
@app.route('/estado-imagen', methods=['POST'])
def obtener_estado():
    alarmaL1=request.get_json().get('alarmaL1')
    alarmaL2=request.get_json().get('alarmaL2')
    datos = tempElect.obtener_Datos()
    l1 = int(datos[1])
    l2 = int(datos[2])
    estados = {1: 'activo', 0: 'inactivo'}
    if l1==0 and alarmaL1==True:
        #llama a la funcion enviar alarma
        alarmas.mensajeL1Active()
    if l2==0 and alarmaL2==True:
        #llama a la funcion enviar alarma
        alarmas.mensajeL2Active()
    
    return jsonify({
        'estadoPrincipal': estados.get(l1, 'desconocido'),
        'estadoSecundario': estados.get(l2, 'desconocido')
    })

# API para leer datos de temperatura de variable global
@app.route('/data',methods=['POST'])
def temperatura():
    datos=request.get_json()
    alarmaTemp=datos.get('alarmaTemp')#habilitacion de alarma
    valorSP=datos.get('valorSP')#valor de set point de la alarma
    if valorSP=='':
        valorSP=0
    valorSP=float(valorSP)
    Datatemperatura=tempElect.obtener_Datos()[0]#obtiene el valor de la temperatura
    Datatemperatura=float(Datatemperatura)
    
    #Guarda el dato en la base de datos
    nueva_temp = Temperatura(temp=Datatemperatura)
    db.session.add(nueva_temp)
    db.session.commit()

    if alarmaTemp==True and Datatemperatura>valorSP:
        alarmas.mensajeAlarmaTemperatura(Datatemperatura,valorSP)
        
    return jsonify({
        'valor': Datatemperatura,
        'unidad': '°C'
    })

#API para enviar señal de modo de trabajo automatico o manual al lora y activar linea
#de alimentacion
@app.route('/modoWork', methods=['POST'])
def modoTrabajo():
    datos=request.get_json()
    valor=datos.get('valor')
    n=datos.get('n')
    LineToActivate=datos.get('LineToActivate')
    tempElect.enviarToLora(valor,n,LineToActivate)
    print(f'modo cambiado a: +{n}+ valor +{valor}')
    return f'modo cambiado a: +{n}'

#Api para enviar datos de los puertos(se envia un arreglo de diccionarios)
@app.route('/api/puertos', methods=['POST'])
def obtener_puertos():
    datos = request.get_json()  # Extrae los datos JSON enviados desde el frontend
    brand = datos.get("brand")
    ip = datos.get("ip")
    usuario = datos.get("usuario")
    contraseña = datos.get("contraseña")

    # Llama a la función de Python que obtiene el estado de los puertos
    resultado = infoPuertos.obtenerEstadoPuertos(brand, ip, usuario, contraseña)

    return jsonify(resultado)

#Api para up o down puertos 
@app.route('/api/updownPorts', methods=['POST'])
def updownPuertos():
    datos = request.get_json()
    brand = datos.get("brand")
    ip = datos.get("ip")
    usuario = datos.get("usuario")
    contraseña = datos.get("contraseña")
    puertos = datos.get("puertos")
    toDo = datos.get("toDo")
    alarma = datos.get('alarma')
    lista_puertos = [p.strip() for p in puertos.split(';') if p.strip()]
    
    if toDo=='up':
        if alarma==True:
            alarmas.mensajePorts('Se ha puesto en Up los siguietes puertos: ',puertos)
        updownPorts.upPorts(brand, ip, usuario, contraseña, lista_puertos)
        return 'puertos levantados'
    elif toDo=='down':
        if alarma==True:
            alarmas.mensajePorts('Se ha puesto en Down los siguietes puertos: ',puertos)
        updownPorts.downPorts(brand, ip, usuario, contraseña, lista_puertos)
        return 'puertos apagados'
    
#Api para hacer pings
@app.route('/ping-Device', methods=['POST'])
def pingEquipos():
    datos = request.get_json()

    IP = datos.get('IP')
    nombre = datos.get('nombre')
    alarmOffline=datos.get('alarmOffline', True)
    alarmHigh_latency=datos.get('alarmHigh_latency', True)
    alarmPacket_loss=datos.get('alarmPacket_loss', True)
    
    device_metrics = {}

    if not IP or IP.strip() == '':#si la ip no es valida
        device_metrics['avg_rtt'] = None
        device_metrics['status'] = 'offline'
        return jsonify(device_metrics)
    
    #Buscar equipo en la base de datos o crearlo
    equipo = Equipo.query.filter_by(nombre=nombre).first()

    if not equipo:
        equipo = Equipo(
            nombre=nombre,
            IP=IP,
            alarmOffline=alarmOffline,
            alarmHigh_latency=alarmHigh_latency,
            alarmPacket_loss=alarmPacket_loss
        )
        db.session.add(equipo)
        db.session.commit()
    else:
        # Si el usuario cambió la IP desde la interfaz, actualizarla
        if equipo.IP != IP:
            equipo.IP = IP
        equipo.alarmOffline = alarmOffline
        equipo.alarmHigh_latency = alarmHigh_latency
        equipo.alarmPacket_loss = alarmPacket_loss
        db.session.commit()

    s_result = pingDevice.ping_host(IP)
     # Determinar estado
    status = 'online'
    if s_result['packet_loss_percent'] == 100:
        status = 'offline'
        if equipo.alarmOffline:
            alarmas.mensajeDeviceOffline(nombre, IP, status)

    elif s_result['packet_loss_percent'] > 0:
        status = 'packet-loss'
        if equipo.alarmPacket_loss:
            alarmas.mensajeDeviceOffline(nombre, IP, status)

    elif s_result['avg_rtt'] and s_result['avg_rtt'] > 100:
        status = 'high-latency'
        if equipo.alarmHigh_latency:
            alarmas.mensajeDeviceOffline(nombre, IP, status)

    #Crea el registro en estado equipo
    nuevo_estado = EstadoEquipo(
        equipo_id=equipo.id,
        estado=status,
        avg_rtt=s_result['avg_rtt'],
        packet_loss=s_result['packet_loss_percent']
    )
    db.session.add(nuevo_estado)
    db.session.commit()
    device_metrics['avg_rtt'] = s_result['avg_rtt']
    device_metrics['status'] = status

    return jsonify(device_metrics)


#API para mostrar tablas
@app.route('/mostrarTablas')
def mostrar_tablas():

    temperaturas = Temperatura.query.order_by(Temperatura.id.desc()).limit(10).all()
    estados = EstadoEquipo.query.order_by(EstadoEquipo.id.desc()).limit(20).all()

    datos_temperatura = [
        {
            'id': t.id,
            'temp': t.temp,
            'fecha': t.fecha.strftime('%Y-%m-%d %H:%M:%S')
        }
        for t in temperaturas
    ]

    datos_estado = [
        {
            'id': e.id,
            'equipo': e.equipo.nombre,
            'ip': e.equipo.IP,
            'estado': e.estado,
            'avg_rtt': e.avg_rtt,
            'packet_loss': e.packet_loss,
            'fecha': e.fecha.strftime('%Y-%m-%d %H:%M:%S')
        }
        for e in estados
    ]

    return jsonify({
        'temperaturas': datos_temperatura,
        'estados': datos_estado
    })

#AUTOMATIZACION--------------------------------------------------
@app.route('/listar-backups/<tipo>')
def listar_backups(tipo):
    carpeta = os.path.join(CARPETA_BACKUPS, tipo.lower())
    if not os.path.exists(carpeta):
        return jsonify([])
    archivos = []
    for archivo in os.listdir(carpeta):
        path = os.path.join(carpeta, archivo)
        if os.path.isfile(path):
            archivos.append({
                'nombre': archivo,
                'tamano': f"{os.path.getsize(path)/1024:.1f} KB",
                'url': f"/descargar-backup/{tipo}/{archivo}"
            })
    return jsonify(archivos)

@app.route('/descargar-backup/<tipo>/<archivo>')
def descargar_backup(tipo, archivo):
    carpeta = os.path.join(CARPETA_BACKUPS, tipo.lower())
    return send_from_directory(carpeta, archivo, as_attachment=False)

#Api para guardar parametros de los dispositivos en el .txt
@app.route('/guardar-parametros', methods=['POST'])
def guardar_parametros():
    datos = request.get_json()
    ip = datos.get('ip')
    user = datos.get('user')
    password = datos.get('password')

    linea = f"IP:{ip}, User:{user}, Password:{password}\n"

    ruta = os.path.join(CARPETA_BACKUPS, 'IpUserPassword.txt')
    with open(ruta, 'a') as archivo:
        archivo.write(linea)
    with open(ruta, 'r') as archivoR:
        contenido=archivoR.read()
    return jsonify({
        'mensaje': 'Parámetros guardados correctamente.',
        'contenido': contenido
    })

#Api para borrar fila del txt de parametros
@app.route('/borrar-parametros', methods=['POST'])
def borrar_parametros():
    edittxt.borrar_ultima_linea()
    ruta = os.path.join(CARPETA_BACKUPS, 'IpUserPassword.txt')
    with open(ruta, 'r') as archivoR:
        contenido=archivoR.read()
    return jsonify({
        'mensaje': 'Parámetros modificados correctamente.',
        'contenido': contenido
    })


#Api para cargar datos 
@app.route('/datos-cargarCofig',methods=['POST'])
def cargarConfig():
    datos = request.get_json()
    hora = datos.get('hora')
    fecha = datos.get('fecha')
    nameFile = datos.get('nameFile')
    tipoDevice = datos.get('tipoDevice')
    alarma = datos.get('alarma')
    try:
        fecha_obj = datetime.strptime(fecha,"%Y-%m-%d").date()
        hora_obj = datetime.strptime(hora,"%H:%M").time()
    except ValueError:
        return jsonify({'mensaje' : 'Formatos invalidos'}),400
    
    #Verificacion de fecha y hora
    tz = pytz.timezone('America/La_Paz')
    fecha_actual = datetime.now(tz)
    hoy = fecha_actual.date()
    if fecha_obj < hoy:
        return jsonify({'mensaje': 'La fecha debe ser hoy o posterior.'}), 400
    if fecha_obj == hoy:
        if hora_obj <= fecha_actual.time():
            return jsonify({'mensaje': 'La hora debe ser posterior a la actual.'}), 400
           
    carpeta = os.path.join(CARPETA_BACKUPS, tipoDevice.lower())#RUTA CARPETA
    archivo = os.path.join(carpeta,nameFile)
    if not os.path.isfile(archivo):
        return jsonify({'mensaje': f'El archivo "{nameFile}" no se encontró en {tipoDevice}.'}),404
    
    #Si llega aca el archivo existe:
    run_at = tz.localize(datetime.combine(fecha_obj, hora_obj))
    #llamada a la funcion
    ejecutar._schedule_execution(run_at, archivo)
    return jsonify({'mensaje': f'El archivo "{nameFile}" se encontró en {tipoDevice}.' }),666


#---------------Estado equipo----------------------
@app.route('/dashboarData',methods=['POST'])
def cargarDataDashboard():
    datos = request.get_json()
    ip=datos.get('ip')
    community=datos.get('community')
    authKey=datos.get('authKey')
    encripKey=datos.get('encripKey')
    
    datosDahboard=snmpV3mikrotik.getDataSnmpJSON(ip, community, authKey, encripKey)
    #print(datosDahboard)
    return jsonify(datosDahboard)


if __name__ == '__main__':
    import os
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        tempElect.iniciar_hilo_serial()
    app.run(host='0.0.0.0', debug=True, port=5500)
