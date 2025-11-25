    // 2. CONFIGURACIÓN INICIAL DE DISPOSITIVOS Y TOPOLOGÍA
    const initialConfig = {
        devices: [
            { id: 1, name: 'Device_1', ip: '', status: 'online', latencia: null },
            { id: 2, name: 'Device_2', ip: '', status: 'online', latencia: null },
            { id: 3, name: 'Device_3', ip: '', status: 'online', latencia: null },
            { id: 4, name: 'Device_4', ip: '', status: 'online', latencia: null },
            { id: 5, name: 'Device_5', ip: '', status: 'online', latencia: null }
        ],
        topology: [
            { id: 'conn1', from: 1, to: 2, label: 'Enlace 1-2', status: 'online' },
            { id: 'conn2', from: 1, to: 3, label: 'Enlace 1-3', status: 'online' },
            { id: 'conn3', from: 1, to: 4, label: 'Enlace 1-4', status: 'online' },
            { id: 'conn4', from: 1, to: 5, label: 'Enlace 1-5', status: 'online' }
        ]
    };
    // Mapeo de estados a colores para los nodos de Vis.js
    //Objeto que asocia un color a un estado
    const statusColors = {
        online: { background: '#2ecc71', border: '#27ae60' }, // Verde
        offline: { background: '#e74c3c', border: '#c0392b' }, // Rojo
        'high-latency': { background: '#f39c12', border: '#e67e22' }, // Naranja
        'packet-loss': { background: '#9b59b6', border: '#8e44ad' } // Púrpura
    };
    // 3. INICIALIZAR VIS.NETWORK (GRÁFICO DE TOPOLOGÍA)
    // Crea un DataSet de nodos a partir de la configuración inicial
    // crea los nodos a partir de las cofiguraciones iniciales
    let nodes = new vis.DataSet(initialConfig.devices.map(device => ({
        id: device.id,
        label: device.name,
        title: `${device.name} (${device.ip}) - Estado: ${device.status}`, // Tooltip con IP y estado
        color: statusColors[device.status], // Asigna color según el estado inicial
        font: { size: 14, color: '#fff' }, // Fuente blanca para mejor contraste
        shape: 'box', // Forma de caja para los nodos
        margin: 10 // Margen alrededor del texto del nodo
    })));
    // Crea un DataSet de aristas (conexiones) a partir de la topología
    //hace las conexiones entre los nodos
    let edges = new vis.DataSet(initialConfig.topology.map(conn => ({
        id: conn.id,
        from: conn.from,
        to: conn.to,
        label: conn.label, // Etiqueta de la conexión (ej. "Gigabit Ethernet")
        width: 2, // Ancho de la línea
        color: {
            color: '#7f8c8d', // Color por defecto de la línea
            highlight: '#3498db' // Color al pasar el ratón por encima
        },
        smooth: {
            type: 'continuous' // Tipo de suavizado de la línea
        }
    })));

    // Opciones de configuración para el gráfico de red
    // Son configuraciones para la visualizacion del grafico de red
    const networkOptions = {
        physics: {
            stabilization: {
                enabled: true,
                iterations: 1000 // Número de iteraciones para estabilizar el diseño de la red
            },
            barnesHut: {
                gravitationalConstant: -2000, // Fuerza de repulsión entre nodos
                centralGravity: 0.3, // Fuerza que atrae los nodos al centro
                springLength: 150, // Longitud deseada de los "resortes" entre nodos conectados
                springConstant: 0.04 // Rigidez de los "resortes"
            }
        },
        layout: {
            improvedLayout: true // Utiliza un algoritmo de diseño mejorado
        },
        interaction: {
            hover: true, // Habilita el efecto hover en nodos y aristas
            tooltipDelay: 300 // Retraso antes de mostrar el tooltip
        }
    };

function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
}

/*Bloque de validacion de IP*/
function isValidIp(ipString) {//valida una cadena que tiene una IP
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ipString);
}

function obtenerIPsDeInputs() {
    const ipInputIds = ['IP_uno', 'IP_dos', 'IP_tres', 'IP_cuatro', 'IP_cinco'];
    const ipsRecogidas = [];
    
    for (const id of ipInputIds) {
        const ipAddress = document.getElementById(id).value.trim();
        
        if (ipAddress === "") {
            ipsRecogidas.push(''); 
            console.warn(`El campo '${id}' está vacío.`);
        } else if (isValidIp(ipAddress)) {
            ipsRecogidas.push(ipAddress);
        } else {
            ipsRecogidas.push(''); 
            console.warn(`La IP "${ipAddress}" del campo '${id}' no es válida.`);
        }
    }
    return ipsRecogidas;
}
function actualizarIPsEnConfiguracion() {
    const nuevasIPs = obtenerIPsDeInputs(); 
    initialConfig.devices.forEach((device, index) => {
        const ipDesdeInput = nuevasIPs[index]; // Obtener la IP correspondiente al índice
        if (ipDesdeInput !== '') { // Si la IP recogida del input es válida (no es null)
            device.ip = ipDesdeInput;// Actualizar la propiedad 'ip' del dispositivo
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    //cargar los valores del localStorage
    const IP_uno = document.getElementById('IP_uno');
    const IP_dos = document.getElementById('IP_dos');
    const IP_tres = document.getElementById('IP_tres');
    const IP_cuatro = document.getElementById('IP_cuatro');
    const IP_cinco = document.getElementById('IP_cinco');
    const alarmoffline = document.getElementById('alarmoffline');
    const alarmhigh_latency = document.getElementById('alarmhigh_latency');
    const alarmpacket_loss = document.getElementById('alarmpacket_loss');


    IP_uno.value = localStorage.getItem('IP_uno') || '';
    IP_dos.value = localStorage.getItem('IP_dos') || '';
    IP_tres.value = localStorage.getItem('IP_tres') || '';
    IP_cuatro.value = localStorage.getItem('IP_cuatro') || '';
    IP_cinco.value = localStorage.getItem('IP_cinco') || '';

    alarmoffline.checked = JSON.parse(localStorage.getItem('alarmoffline')) || false;
    alarmhigh_latency.checked = JSON.parse(localStorage.getItem('alarmhigh_latency')) || false;
    alarmpacket_loss.checked = JSON.parse(localStorage.getItem('alarmpacket_loss')) || false;

    
    IP_uno.addEventListener('input', function() {
        localStorage.setItem('IP_uno', IP_uno.value);
    });
    IP_dos.addEventListener('input', function() {
        localStorage.setItem('IP_dos', IP_dos.value);
    });
    IP_tres.addEventListener('input', function() {
        localStorage.setItem('IP_tres', IP_tres.value);
    });
    IP_cuatro.addEventListener('input', function() {
        localStorage.setItem('IP_cuatro', IP_cuatro.value);
    });
    IP_cinco.addEventListener('input', function() {
        localStorage.setItem('IP_cinco', IP_cinco.value);
    });

    alarmoffline.addEventListener('change', function() {
        localStorage.setItem('alarmoffline', JSON.stringify(alarmoffline.checked));
    });
    alarmhigh_latency.addEventListener('change', function() {
        localStorage.setItem('alarmhigh_latency', JSON.stringify(alarmhigh_latency.checked));
    });
    alarmpacket_loss.addEventListener('change', function() {
        localStorage.setItem('alarmpacket_loss', JSON.stringify(alarmpacket_loss.checked));
    });

    // 1. VERIFICAR QUE LOS ELEMENTOS DEL DOM EXISTEN
    const networkContainer = document.getElementById('network-graph');
    const latencyChartCanvas = document.getElementById('latency-chart');
    const liveMetricsPanel = document.getElementById('live-metrics'); // Referencia al panel de métricas en vivo

    if (!networkContainer || !latencyChartCanvas || !liveMetricsPanel) {
        console.error('Error: No se encontraron todos los elementos del DOM necesarios. Asegúrate de que los IDs sean correctos en tu HTML.');
        return; // Detener la ejecución si los elementos no se encuentran
    }
    // Crea la instancia de la red de Vis.js
    const network = new vis.Network(
        networkContainer,
        { nodes, edges },
        networkOptions
    );

    // 4. INICIALIZAR GRÁFICO DE LATENCIA (Chart.js)
    const ctx = latencyChartCanvas.getContext('2d');
    const latencyChart = new Chart(ctx, {
        type: 'line', // Tipo de gráfico: línea
        data: {
            labels: [], // Se llenarán con las marcas de tiempo
            datasets: initialConfig.devices.map(device => ({
                label: device.name, // Nombre del dispositivo como etiqueta de la línea
                data: [], // Se llenarán con los puntos de latencia {x: tiempo, y: latencia}
                borderColor: getRandomColor(), // Color aleatorio para cada línea del gráfico
                fill: false, // No rellenar el área bajo la línea
                tension: 0.1 // Suaviza la línea del gráfico
            }))
        },
        options: {
            responsive: true, // El gráfico se adapta al tamaño del contenedor
            maintainAspectRatio: false, // Permite que el gráfico se ajuste libremente al tamaño del contenedor
            scales: {
                x: {
                    type: 'time', // Eje X basado en el tiempo
                    time: {
                        unit: 'minute', // Unidad de tiempo para las etiquetas
                        displayFormats: {
                            minute: 'HH:mm:ss' // Formato de visualización de la hora
                        }
                    },
                    title: {
                        display: true,
                        text: 'Tiempo'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Latencia (ms)'
                    },
                    min: 0, // Valor mínimo del eje Y
                    max: 200 // Valor máximo del eje Y para la simulación
                }
            },
            plugins: {
                tooltip: {
                    mode: 'index', // Muestra tooltips para todos los datasets en un punto X
                    intersect: false // Los tooltips se muestran incluso si el cursor no intersecta directamente un punto
                },
                legend: {
                    display: true, // Muestra la leyenda del gráfico
                    position: 'top' // Posición de la leyenda
                }
            }
        }
    });

    // 5. ACTUALIZACIÓN EN TIEMPO REAL
    const MAX_DATA_POINTS = 15; // Número máximo de puntos de datos a mostrar en el gráfico de latencia
    const UPDATE_INTERVAL = 5000; // Intervalo de actualización de la simulación en milisegundos (3 segundos)
    const LINK_STATUS_COLORS = {
        'online': { color: '#7f8c8d', dashes: false }, // Gris por defecto
        'down': { color: '#e74c3c', dashes: true }, // Rojo y punteado
        'degraded': { color: '#f39c12', dashes: [5, 5] } // Naranja y guiones más cortos
    };
    
    function updateNetworkStatus() {
        const updatedNodes = [];
        const updatedEdges = [];
        liveMetricsPanel.innerHTML = '';

        const alarmOffline=document.getElementById('alarmoffline').checked;    //true o false
        const alarmHigh_latency=document.getElementById('alarmhigh_latency').checked;
        const alarmPacket_loss=document.getElementById('alarmpacket_loss').checked;
        
        // Actualizar estado de los dispositivos
        const promesas = initialConfig.devices.map(device => {
            return fetch('/ping-Device', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    IP: device.ip, 
                    nombre: device.name,
                    alarmOffline: alarmOffline,
                    alarmHigh_latency: alarmHigh_latency,
                    alarmPacket_loss: alarmPacket_loss
                })
            })
            .then(response => response.json())
            .then(data => {
                device.status = data.status;
                device.latencia = data.avg_rtt;

                const colors = statusColors[device.status] || statusColors['offline'];
                updatedNodes.push({
                    id: device.id,
                    color: {
                        background: colors.background,
                        border: colors.border
                    },
                    label: `${device.name}\n(${device.ip})`
                });
                return device;
            })
            .catch(err => {
                device.status = 'offline';
                device.latencia = 'N/A';

                updatedNodes.push({
                    id: device.id,
                    color: {
                        background: 'red'
                    },
                    label: `${device.name}\n(${device.ip})`
                });

                return device;
            });
        });

        Promise.all(promesas).then(updatedDevices => {
            // Mostrar tarjetas de métricas
            updatedDevices.forEach(device => {
                const deviceCard = document.createElement('div');
                deviceCard.className = `device-card ${device.status}`;
                deviceCard.innerHTML = `
                    <h3>${device.name}</h3>
                    <p><strong>IP:</strong> ${device.ip}</p>
                    <p><strong>Estado:</strong> <span class="status-dot ${device.status}"></span> ${device.status.toUpperCase()}</p>
                    <p><strong>Latencia:</strong> ${device.latencia}</p>
                `;
                liveMetricsPanel.appendChild(deviceCard);
            });

            // Actualizar enlaces basados en el estado real de los nodos
            initialConfig.topology.forEach(conn => {
                const fromDevice = initialConfig.devices.find(d => d.id === conn.from);
                const toDevice = initialConfig.devices.find(d => d.id === conn.to);

                if (!fromDevice || !toDevice) return;

                // Si uno de los extremos está offline, el enlace se marca como down
                if (fromDevice.status === 'offline' || toDevice.status === 'offline') {
                    conn.status = 'down';
                } else if (
                    fromDevice.status === 'high-latency' || toDevice.status === 'high-latency' ||
                    fromDevice.status === 'packet-loss'  || toDevice.status === 'packet-loss'
                ) {
                    conn.status = 'degraded';
                } else {
                    conn.status = 'online';
                }


                const linkColor = LINK_STATUS_COLORS[conn.status].color;
                const linkDashes = LINK_STATUS_COLORS[conn.status].dashes;

                updatedEdges.push({
                    id: conn.id,
                    color: { color: linkColor },
                    dashes: linkDashes,
                    title: `Link: ${conn.label} (${conn.from} via ${conn.interfaceFrom} - ${conn.to} via ${conn.interfaceTo}) - Estado: ${conn.status.toUpperCase()}`
                });
            });

            nodes.update(updatedNodes);
            edges.update(updatedEdges);
        });
    }


    function updateLatencyChart() {
        const currentTime = new Date(); // Hora actual
        latencyChart.data.labels.push(currentTime); // Añadir etiqueta X (tiempo)

        initialConfig.devices.forEach((device, index) => {
            const latency = device.latencia;

            // Solo agregar el punto si la latencia es válida (número)
            if (latency !== null && typeof latency === 'number') {
                latencyChart.data.datasets[index].data.push({ x: currentTime, y: latency });
            } else {
                // Para que el dataset mantenga coherencia temporal, se puede agregar null (Chart.js lo ignora visualmente)
                latencyChart.data.datasets[index].data.push({ x: currentTime, y: null });
            }

            // Limitar cantidad de puntos (FIFO)
            if (latencyChart.data.datasets[index].data.length > MAX_DATA_POINTS) {
                latencyChart.data.datasets[index].data.shift();
            }
        });

        // Mantener coherencia también en las etiquetas X (tiempo)
        if (latencyChart.data.labels.length > MAX_DATA_POINTS) {
            latencyChart.data.labels.shift();
        }

        latencyChart.update(); // Redibujar gráfico
    }


    updateNetworkStatus();
    updateLatencyChart();
    setInterval(() => {
        actualizarIPsEnConfiguracion();
        updateNetworkStatus();// Actualiza el estado de la red y las métricas
        updateLatencyChart(); 
    }, UPDATE_INTERVAL);
});