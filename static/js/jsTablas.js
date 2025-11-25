
document.addEventListener("DOMContentLoaded", () => {
  fetch('/mostrarTablas')
    .then(response => response.json())
    .then(data => {
      mostrarTemperaturas(data.temperaturas);
      mostrarEstadosEquipos(data.estados);
    })
    .catch(error => {
      console.error('Error al obtener los datos:', error);
    });
});

function mostrarTemperaturas(temperaturas) {
  const lista = document.getElementById('lista-temperaturas');
  lista.innerHTML = ''; // Limpiar antes de insertar

  const tabla = document.createElement('table');
  tabla.border = "1";

  const thead = document.createElement('thead');
  thead.innerHTML = `<tr><th>ID</th><th>Temperatura</th><th>Fecha</th></tr>`;
  tabla.appendChild(thead);
  
  const tbody = document.createElement('tbody');

  temperaturas.forEach(t => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
        <td>${t.id}</td>
        <td>${t.temp}</td>
        <td>${t.fecha}</td>
      `;
      tbody.appendChild(fila);
  });
  tabla.appendChild(tbody);       
  lista.appendChild(tabla);
}

function mostrarEstadosEquipos(data) {
  const contenedor = document.getElementById('estados-equipos');
  contenedor.innerHTML = ''; // Limpiar

  const tabla = document.createElement('table');
  tabla.border = "1";

  // Cabecera
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>ID</th>
      <th>Nombre</th>
      <th>IP</th>
      <th>Estado</th>
      <th>avg_rtt[ms]</th>
      <th>Packet loss[%]</th>
      <th>Fecha</th>
    </tr>`;
  tabla.appendChild(thead);

  // Cuerpo
  const tbody = document.createElement('tbody');

  data.forEach(e => {
    const fila = document.createElement('tr');

    // ---------- Pintar rojo cuando offline ----------
    if (e.estado === "offline") {
      fila.style.backgroundColor = "#ffcccc"; // rojo claro
    }else if(e.estado === "online"){
      fila.style.backgroundColor = "#B9FEDB"; // rojo claro
    }else if(e.estado === "packet-loss"){
      fila.style.backgroundColor = "#EDE6FF"; // rojo claro
    }else if(e.estado === "high-latency"){
      fila.style.backgroundColor = "#FFE6B8"; // rojo claro
    }
    // -------------------------------------------------

    fila.innerHTML = `
      <td>${e.id}</td>
      <td>${e.equipo}</td>
      <td>${e.ip}</td>
      <td>${e.estado}</td>
      <td>${e.avg_rtt}</td>
      <td>${e.packet_loss}</td>
      <td>${e.fecha}</td>
    `;

    tbody.appendChild(fila);
  });

  tabla.appendChild(tbody);
  contenedor.appendChild(tabla);
}


