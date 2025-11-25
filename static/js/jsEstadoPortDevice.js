function cargarTablaPuertos(brand, ip, usuario, password) {
  fetch('/api/puertos', {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      brand: brand,
      ip: ip,
      usuario: usuario,
      contraseña: password
    })
  })
  .then(res => res.json())
  .then(data => {
    const tbody = document.querySelector("#contenedorPuertos tbody");
    tbody.innerHTML = ""; // Limpiar tabla antes de agregar

    data.forEach(puerto => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${puerto.interfaz}</td>
        <td>${puerto.ip}</td>
        <td>${puerto.estado_operativo}</td>
        <td>${puerto.estado_administrativo}</td>
        <td>${puerto.mac_aprendida || '-'}</td>
        <td>${puerto.ip_device || '-'}</td>
        <td>${puerto.velocidad}</td>
        <td>${puerto.duplex}</td>
        <td>${puerto.vlan}</td>
        <td>${puerto.tipo_conexion}</td>
        <td>${puerto.rx_packets}</td>
        <td>${puerto.tx_packets}</td>
        <td>${puerto.rx_errors}</td>
        <td>${puerto.tx_errors}</td>
      `;
      tbody.appendChild(fila);
    });
  })
  .catch(err => {
    console.error("[!] Error al cargar la tabla de puertos:", err);
  });
}

function portsToUP(brand, ip, usuario, password, puertos, alarmaUp){
  fetch('/api/updownPorts', {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      brand: brand,
      ip: ip,
      usuario: usuario,
      contraseña: password,
      puertos: puertos,
      toDo:'up',
      alarma: alarmaUp
    })
  })
}
function portsToDown(brand, ip, usuario, password, puertos, alarmDown){
  fetch('/api/updownPorts', {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      brand: brand,
      ip: ip,
      usuario: usuario,
      contraseña: password,
      puertos: puertos,
      toDo:'down',  
      alarma: alarmDown
    })
  })
}

document.addEventListener("DOMContentLoaded", function () {
  const alarmUp = document.getElementById("alarmUp");
  const alarmDown = document.getElementById("alarmDown");

  // Cargar estado desde localStorage al cargar
  alarmUp.checked = localStorage.getItem("alarmUp") === "true";
  alarmDown.checked = localStorage.getItem("alarmDown") === "true";

  // Guardar estado al cambiar
  alarmUp.addEventListener("change", () => {
    localStorage.setItem("alarmUp", alarmUp.checked);
  });

  alarmDown.addEventListener("change", () => {
    localStorage.setItem("alarmDown", alarmDown.checked);
  });
  /*verifica el boton para ver el estado de los puertos */
  document.getElementById("sendParameters").addEventListener("click", function () {
    const ip = document.getElementById("IPgestion").value;
    const usuario = document.getElementById("user").value;
    const contraseña = document.getElementById("password").value;
    const brand = document.getElementById("brand").value;
    cargarTablaPuertos(brand, ip, usuario, contraseña);
  });
  /*verifica si se presiona up puertos */
  document.getElementById("sendPuertosUp").addEventListener("click", function () {
    const ip = document.getElementById("IPgestion").value;
    const usuario = document.getElementById("user").value;
    const contraseña = document.getElementById("password").value;
    const brand = document.getElementById("brand").value;
    const puertosToUp = document.getElementById('puertosToUp').value;  
    const alarmaUp = document.getElementById('alarmUp').checked;/** esto sera true o false  */
    document.getElementById("puertosToUp").value = "";/*borra el contenido de la caja de texto */
    portsToUP(brand, ip, usuario, contraseña, puertosToUp, alarmaUp);
  });
  /*verifica si se presiona down puertos */
  document.getElementById("sendPuertosDown").addEventListener("click", function () {
    const ip = document.getElementById("IPgestion").value;
    const usuario = document.getElementById("user").value;
    const contraseña = document.getElementById("password").value;
    const brand = document.getElementById("brand").value;
    const puertosToDown = document.getElementById('puertosToDown').value; 
    const alarmDown = document.getElementById('alarmDown').checked/**esto sera true o false */
    document.getElementById("puertosToDown").value = "";/*borra el contenido de la caja de texto */
    portsToDown(brand, ip, usuario, contraseña, puertosToDown, alarmDown);
  });
});
