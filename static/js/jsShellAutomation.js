/*Bloque de validacion de IP*/
function isValidIp(ipString) {//valida una cadena que tiene una IP
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ipString);
}

document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('tipoEquipo');
  const contenedor = document.getElementById('contenedorBackups');

  //alarma
  const alarmConfig = document.getElementById('alarmCofig');
  alarmConfig.checked = localStorage.getItem('alarmCofig')=='true';
  alarmConfig.addEventListener('change',()=>{
    localStorage.setItem('alarmCofig', alarmConfig.checked);
  });
  
  select.addEventListener('change', () => {
    const tipo = select.value;
    if (!tipo) {
      contenedor.innerHTML = '';
      return;
    }

    fetch(`/listar-backups/${tipo}`)
      .then(res => res.json())
      .then(archivos => {
        if (archivos.length === 0) {
          contenedor.innerHTML = '<p>No hay backups disponibles para este tipo de equipo.</p>';
          return;
        }
        const tabla = document.createElement('table');
        tabla.innerHTML = `
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tamaño</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            ${archivos.map(a => `
              <tr>
                <td>${a.nombre}</td>
                <td>${a.tamano}</td>
                <td><a href="${a.url}" target="_blank">Abrir</a></td>
              </tr>
            `).join('')}
          </tbody>
        `;
        contenedor.innerHTML = '';
        contenedor.appendChild(tabla);
      })
      .catch(err => {
        console.error(err);
        contenedor.innerHTML = '<p>Error al cargar los archivos.</p>';
      });
    });
    document.getElementById('borrarParametros').addEventListener('click',() =>{
      fetch('/borrar-parametros',{
        method: 'POST',              // <-- esto es esencial
        headers: {
          'Content-Type': 'application/json'
    }
      })
      .then(res=> res.json())
      .then(respuesta=>{
        const contenedor = document.getElementById('contenedorDispositivos');
            // Si no hay contenido...
            if (!respuesta.contenido.trim()) {
              contenedor.innerHTML = `<p>${respuesta.mensaje}</p><p>No hay parámetros guardados.</p>`;
              return;
            }
            // 1) Dividimos en líneas
            const líneas = respuesta.contenido.trim().split('\n');
            // 2) Construimos el HTML de la tabla
            let html = `<p>${respuesta.mensaje}</p>
              <table class="tabla-backups">
                <thead>
                  <tr><th>IP</th><th>User</th><th>Password</th></tr>
                </thead>
                <tbody>`;
            líneas.forEach(l => {
              // Partimos cada línea en ["IP", "123"] etc.
              const [_, ipVal, __, userVal, ___, passVal] = l.split(/[,:]/).map(s => s.trim());
              html += `
                <tr>
                  <td>${ipVal}</td>
                  <td>${userVal}</td>
                  <td>${passVal}</td>
                </tr>`;
            });
            html += `</tbody></table>`;
            // 3) Insertamos
            contenedor.innerHTML = html;
      })
      .catch(err=>{
        console.error(err);
        document.getElementById('contenedorDispositivos').innerText = 'Error al guardar los datos.';
      });
    });

    document.getElementById('cargarParametros').addEventListener('click', () => {
      const ip = document.getElementById('IPgestion').value;
      const user = document.getElementById('user').value;
      const password = document.getElementById('password').value;
      
      if (ip === "") {
        
      } else if (isValidIp(ip)) {
        ['IPgestion','user','password'].forEach(id => {
          document.getElementById(id).value = '';});
        fetch('/guardar-parametros', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip, user, password })
          })
          .then(res => res.json())
          .then(respuesta => {
            const contenedor = document.getElementById('contenedorDispositivos');
            // Si no hay contenido...
            if (!respuesta.contenido.trim()) {
              contenedor.innerHTML = `<p>${respuesta.mensaje}</p><p>No hay parámetros guardados.</p>`;
              return;
            }
            // 1) Dividimos en líneas
            const líneas = respuesta.contenido.trim().split('\n');
            // 2) Construimos el HTML de la tabla
            let html = `<p>${respuesta.mensaje}</p>
              <table class="tabla-backups">
                <thead>
                  <tr><th>IP</th><th>User</th><th>Password</th></tr>
                </thead>
                <tbody>`;
            líneas.forEach(l => {
              // Partimos cada línea en ["IP", "123"] etc.
              const [_, ipVal, __, userVal, ___, passVal] = l.split(/[,:]/).map(s => s.trim());
              html += `
                <tr>
                  <td>${ipVal}</td>
                  <td>${userVal}</td>
                  <td>${passVal}</td>
                </tr>`;
            });
            html += `</tbody></table>`;
            // 3) Insertamos
            contenedor.innerHTML = html;
          })
          .catch(err => {
            console.error(err);
            document.getElementById('contenedorDispositivos').innerText = 'Error al guardar los datos.';
          }); 
      } else {
        
      }
    });
  
  const botonCargarConfig = document.getElementById('cargarCofig');
  
  botonCargarConfig.addEventListener('click', () => {
    console.log('escuchado');
    const hora = document.getElementById('horaConfiguración').value;//saca valor del type='time'
    const fecha = document.getElementById('dateConfig').value;      //saca valor del type='date'
    const nameFile = document.getElementById('fileName').value;     //saca valor del type='text'
    const select = document.getElementById('tipoEquipo').value;     //saca valor del select
    const alarma = document.getAnimations('alarmCofig').checked;
    fetch('/datos-cargarCofig', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              //datos a enviar
              'hora':hora,
              'fecha':fecha,
              'nameFile':nameFile,
              'tipoDevice':select,
              'alarma':alarma
            })
          })
          .then(res => res.json()) // convierte la respuesta en JSON
          .then(respuesta => {//usa la respuesta
            //una vez obtenida la respuesta
            console.log(respuesta.mensaje);
          })
          .catch(err => {
            console.log('error')
            //por si hay error  
          }); 
  })
});