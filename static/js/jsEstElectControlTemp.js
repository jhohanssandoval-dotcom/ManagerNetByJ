//grafico
const ctx = document.getElementById('graficaTemp').getContext('2d');

// Configuración mejorada del gráfico
const config = {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Temperatura (°C)',
            data: [],
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderWidth: 2,
            tension: 0.1,
            pointRadius: 3,
            pointBackgroundColor: 'red'
        }]
    },
    options: {
        responsive: true,
        animation: {
            duration: 0 // Desactiva animación para mejor rendimiento
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Tiempo (s)',
                    color: '#000'
                },
                grid: {
                    display: false,
                },ticks:{
                    color: '#000'
                }
            },
            y: {
                beginAtZero: false,
                min: 0,  // Valor mínimo fijo
                max: 70,  // Valor máximo fijo
                title: {
                    display: true,
                    text: 'Temperatura (°C)',
                    color: '#000'
                },ticks:{
                    color: '#000'
                }
            }
        }
    }
};

const grafico = new Chart(ctx, config);

// Variables de control
let tiempo = 0;
const maxPuntos = 30;

// Función mejorada para agregar datos
async function agregarDato() {
    const switch_onoff=document.getElementById('myswitch').checked;
    if(switch_onoff==true){
        try {
            console.log("Solicitando datos..."); // Debug 1
            
            const response = await fetch('/data', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        alarmaTemp: document.getElementById('SPsuperado').checked,
                        valorSP: document.getElementById("SetPointAlarma").value
                    })
                }
            );
            console.log("Respuesta recibida:", response); // Debug 2
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const json = await response.json();
            console.log("Datos recibidos:", json); // Debug 3
            
            const valor = parseFloat(json.valor); // Asegura que es número
            
            // Agrega nuevo punto
            grafico.data.labels.push(tiempo++);
            grafico.data.datasets[0].data.push(valor);
            
            // Limita el histórico
            if (grafico.data.labels.length > maxPuntos) {
                grafico.data.labels.shift();
                grafico.data.datasets[0].data.shift();
            }
            
            grafico.update();
            console.log("Gráfico actualizado"); // Debug 4
            
        } catch (error) {
            console.error("Error en agregarDato:", error);
        }
    }
}
// Iniciar actualización periódica
const intervalo = setInterval(agregarDato, 1000);
// Limpiar al salir
window.addEventListener('beforeunload', () => {
    clearInterval(intervalo);
});

/*mostrar y esconder opciones segun el radio*/
function mostrarOpciones() {
      const seleccion = document.querySelector('input[name="opcion"]:checked').value;

      // Ocultar todo primero
      document.getElementById("opcion1").style.display = "none";
      document.getElementById("opcion2").style.display = "none";

      // Mostrar según selección
      if (seleccion === "uno") {
        document.getElementById("opcion1").style.display = "block";
      } else if (seleccion === "dos") {
        document.getElementById("opcion2").style.display = "block";
      }
}

/*boton toggle*/
let estado = false; // false = OFF, true = ON

  document.getElementById("botonOpUno").addEventListener("click", function () {
    estado = !estado; // Cambia el estado

    if (estado) {
      console.log("ON");
      this.textContent = "APAGAR"; // Cambia el texto del botón
      this.classList.add("encendido");
      this.classList.remove("apagado");
    } else {
      console.log("OFF");
      this.textContent = "ENCENDER";
      this.classList.add("apagado");
      this.classList.remove("encendido");
    }

    // Aquí puedes agregar lógica para enviar el estado (por fetch, WebSocket, etc.)
  });
  
  /*imagenes */
function actualizarImagen(estadoPrincipal, estadoSecundario) {
    const imagenLPrincipal  = document.getElementById('imagenEstadoLPrincipal');
    const imagenLSecundario = document.getElementById('imagenEstadoLSecundario');
    const rutaBase = "/static/img/";
    // Transición suave
    [imagenLPrincipal, imagenLSecundario].forEach(img => img.style.opacity = 0);
    setTimeout(() => {
        if (estadoPrincipal === 'activo') {
            imagenLPrincipal.src = rutaBase + 'estadoOn.png';
        }else if(estadoPrincipal === 'inactivo') {
            imagenLPrincipal.src = rutaBase + 'estadoOff.png';
        }

        if (estadoSecundario === 'activo') {
            imagenLSecundario.src = rutaBase + 'estadoOn.png';
        }else if(estadoSecundario === 'inactivo'){
            imagenLSecundario.src = rutaBase + 'estadoOff.png';
        }

        // Restaurar opacidad
        [imagenLPrincipal, imagenLSecundario].forEach(img => img.style.opacity = 1);
    }, 300);

}
function monitorearEstado() {
    fetch('/estado-imagen',{
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({
            alarmaL1:document.getElementById('offMainLine').checked,//verifica si la alarma para L1 esta activa
            alarmaL2:document.getElementById('offSecondLine').checked//verifica si la alarma para L2 esta activa
        })
    })
    .then(response => response.json())
    .then(data => {
        actualizarImagen(data.estadoPrincipal,data.estadoSecundario);
        setTimeout(monitorearEstado, 2000); // Consulta cada 2 segundos
    });
}

function enviarModo(valor, n,LineToActivate){
        fetch('/modoWork', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                valor: valor,
                n:n,
                LineToActivate:LineToActivate
            })
        })
}

// Iniciar monitoreo
document.addEventListener('DOMContentLoaded', function(){
    const switchDom = document.getElementById('myswitch');
    const SPsuperado = document.getElementById('SPsuperado');
    const offMainLine = document.getElementById('offMainLine');
    const offSecondLine = document.getElementById('offSecondLine');
    const SetPointAlarma = document.getElementById('SetPointAlarma');

    SetPointAlarma.value = localStorage.getItem('SetPointAlarma') || '';
    switchDom.checked = JSON.parse(localStorage.getItem('switchTmp')) || false;
    SPsuperado.checked = JSON.parse(localStorage.getItem('SPsuperado')) || false;
    offMainLine.checked = JSON.parse(localStorage.getItem('offMainLine')) || false;
    offSecondLine.checked = JSON.parse(localStorage.getItem('offSecondLine')) || false;

    SetPointAlarma.addEventListener('input', function() {
        localStorage.setItem('SetPointAlarma', SetPointAlarma.value);
    });
    switchDom.addEventListener('change', function() {
        localStorage.setItem('switchTmp', switchDom.checked);
    });
    SPsuperado.addEventListener('change', function() {
        localStorage.setItem('SPsuperado', SPsuperado.checked);
    });
    offMainLine.addEventListener('change', function() {
        localStorage.setItem('offMainLine', offMainLine.checked);
    });
    offSecondLine.addEventListener('change', function() {
        localStorage.setItem('offSecondLine', offSecondLine.checked);
    });

    monitorearEstado()

    //Modo automatico
    document.getElementById('botonOpDos').addEventListener('click',function(){
        const setPoint = document.getElementById('SetPoint').value;
        enviarModo(setPoint,1,0);
    });
    
    //Modo manual
    let estado = false; // false = OFF, true = ON
    document.getElementById("botonOpUno").addEventListener("click", function () {
        estado = !estado; // Cambia el estado
        if (estado) {
            enviarModo(1,2,0);
            console.log("ON");
            this.textContent = "APAGAR"; // Cambia el texto del botón
            this.classList.add("encendido");
            this.classList.remove("apagado");
        } else {
            enviarModo(0,2,0);
            console.log("OFF");
            this.textContent = "ENCENDER";
            this.classList.add("apagado");
            this.classList.remove("encendido");
        }
        
    });

    //activar linea 1
    document.getElementById('activarLineaUno').addEventListener('click',function(){
        enviarModo(0,0,1);
    });
    //activar linea 2
    document.getElementById('activarLineaDos').addEventListener('click',function(){
        enviarModo(0,0,2);
    });
});