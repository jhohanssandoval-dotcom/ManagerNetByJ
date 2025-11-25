from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Equipo(db.Model):
    __tablename__ = 'equipos'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False, unique=True)
    IP = db.Column(db.String(50), nullable=False, unique=True)

    # alarmas configuradas por equipo
    alarmOffline = db.Column(db.Boolean, default=True)
    alarmHigh_latency = db.Column(db.Boolean, default=True)
    alarmPacket_loss = db.Column(db.Boolean, default=True)

    estados = db.relationship('EstadoEquipo', backref='equipo', lazy=True)

class EstadoEquipo(db.Model):
    __tablename__ = 'estado_equipos'

    id = db.Column(db.Integer, primary_key=True)
    equipo_id = db.Column(db.Integer, db.ForeignKey('equipos.id'), nullable=False)

    estado = db.Column(db.String(50), nullable=False)
    avg_rtt = db.Column(db.Float)
    packet_loss = db.Column(db.Float)
    fecha = db.Column(db.DateTime, default=datetime.now)

class Temperatura(db.Model):
    __tablename__ = 'temperaturas'
    
    id = db.Column(db.Integer, primary_key=True)
    temp = db.Column(db.Float, nullable=False)
    fecha = db.Column(db.DateTime, default=datetime.now)
