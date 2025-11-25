document.addEventListener('DOMContentLoaded', () => {
  const IPgestion = document.getElementById('IPgestion');
  const SNMP_COMMUNITY = document.getElementById('SNMP_COMMUNITY');
  const SNMP_AUTH_KEY = document.getElementById('SNMP_AUTH_KEY');
  const SNMP_ENCRIP_KEY = document.getElementById('SNMP_ENCRIP_KEY');
  const myswitch = document.getElementById('myswitch');
  
  IPgestion.value = localStorage.getItem('IPgestion') || '';
  SNMP_COMMUNITY.value = localStorage.getItem('SNMP_COMMUNITY') || '';
  SNMP_AUTH_KEY.value = localStorage.getItem('SNMP_AUTH_KEY') || '';
  SNMP_ENCRIP_KEY.value = localStorage.getItem('SNMP_ENCRIP_KEY') || '';
  myswitch.checked = JSON.parse(localStorage.getItem('myswitch')) || false;

  IPgestion.addEventListener('input', function() {
    localStorage.setItem('IPgestion', IPgestion.value);
  });
  SNMP_COMMUNITY.addEventListener('input', function() {
    localStorage.setItem('SNMP_COMMUNITY', SNMP_COMMUNITY.value);
  });
  SNMP_AUTH_KEY.addEventListener('input', function() {
    localStorage.setItem('SNMP_AUTH_KEY', SNMP_AUTH_KEY.value);
  });
  SNMP_ENCRIP_KEY.addEventListener('input', function() {
    localStorage.setItem('SNMP_ENCRIP_KEY', SNMP_ENCRIP_KEY.value);
  });
  myswitch.addEventListener('change', function() {
    localStorage.setItem('myswitch', myswitch.checked);
   });

  // 1) Generar etiquetas de tiempo (ej: segundos)
  const labels = ['t1','t2','t3','t4','t5','t6','t7','t8','t9','t10',];

  // 2) Datos iniciales aleatorios
  const cpuData = labels.map(() => Math.floor(Math.random() * 81) + 10);
  const memData = 0;

  // 3) Configuración del sparkline de CPU
  const cpuCtx = document.getElementById('cpuSparkline').getContext('2d');
  const cpuChart = new Chart(cpuCtx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'CPU (%)',
        data: cpuData,
        borderColor: '#007bff',
        backgroundColor: '#7acada',
        tension: 0.4,
        pointRadius: 2,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Tiempo',
            color: '#000',
            font: { size: 12, family: '"Segoe UI", sans-serif', weight: 'bold' }
          },
          grid: {
            display: true,
            color: '#eee'
          },
          ticks: {
            color: '#000',
            maxTicksLimit: 10,
            font: { size: 12, weight: 'bold', weight: 'bold' }
          }
        },
        y: {
          display: true,
          beginAtZero: true,
          suggestedMax: 100,
          title: {
            display: true,
            text: 'Uso CPU (%)',
            color: '#000',
            font: { size: 12, family: '"Segoe UI", sans-serif', weight: 'bold' }
          },
          grid: {
            color: '#eee'
          },
          ticks: {
            callback: value => value + '%',
            color: '#000',
            font: { size: 12, weight: 'bold' }
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            label: ctx => `CPU: ${ctx.parsed.y}%`
          }
        }
      }
    }
  });

  // 4) Configuración del gauge de Memoria
  const grafGauge = new RadialGauge({
        renderTo: 'memGauge',
        width: 300,
        height: 300,
        units: "RAM%",
        minValue: 0,
        maxValue: 100,
        majorTicks: ["0","20","40","60","80","100"],
        minorTicks: 2,
        value:23,
        strokeTicks: true,
        highlights: [
          { from: 80, to: 100, color: 'rgba(237, 44, 44, 0.75)' }
        ],
        colorPlate: "#fff",
        borderShadowWidth: 15,
        borders: false,

        //valores para la caja de texto
        valueBox: true,//habilita deshabilita
        colorValueBoxRect: "#0056b3",//color contorno
        colorValueBoxRectEnd: "#0056b3",//color contorno
        colorValueBoxBackground: "#689fd9",//color del fondo
        colorValueText: "#fff",//color de texto
        valueInt: 2,//cantidad de enteros
        valueDec: 1,//cantidad de decimales

        needleType: "arrow",
        needleWidth: 2,
        needleCircleSize: 7,
        needleCircleOuter: true,
        needleCircleInner: false,
        animationDuration: 1500,
        animationRule: "linear"
  });
  grafGauge.draw();


  // 5) Función de simulación de actualización
  function randomPct(){   
    return Math.floor(Math.random() * 81) + 10; 
  }
  function isValidIp(ipString) {//valida una cadena que tiene una IP
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ipString);
  } 
  function updateDate() {
    const switch_onoff=document.getElementById('myswitch').checked;
    if(switch_onoff==true){
      const ip=document.getElementById('IPgestion').value;
      const valido=isValidIp(ip);
      if(valido){
        const community=document.getElementById('SNMP_COMMUNITY').value;
        const authKey=document.getElementById('SNMP_AUTH_KEY').value;
        const encripKey=document.getElementById('SNMP_ENCRIP_KEY').value;
        fetch('/dashboarData', {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            ip:ip,
            community:community,
            authKey:authKey,
            encripKey:encripKey
          })
        })
        .then(response => response.json())
        .then(data => {
          console.log(data);
          //Llenar tarjetas
          const sysDescr=document.getElementById('sysDescr');
          sysDescr.textContent=data.modelo;

          const sysName=document.getElementById('sysName');
          sysName.textContent=data.hostName;

          const sysUpTime=document.getElementById('sysUpTime');
          sysUpTime.textContent=data.uptime;

          const sysFrec=document.getElementById('sysFrec');
          sysFrec.textContent=data.frecuencia;

          //CPU
          cpuData.push(parseFloat(data.cpu));
          cpuData.shift();
          cpuChart.data.datasets[0].data = cpuData;
          cpuChart.update();

          // Memoria RAM
          const newPct=parseFloat(data.ram);
          grafGauge.value = newPct;

          //Llenar tabla
          const tbody = document.getElementById('contenedorPuertos').getElementsByTagName('tbody')[0];
          tbody.innerHTML='';
          data.interfaces.forEach(interfaz => {
            const row = document.createElement('tr');
            row.innerHTML=`
              <td>${interfaz.nombre}</td>
              <td>${interfaz.estado}</td>
              <td>${interfaz.conectado}</td>
              <td>${interfaz.traficoIn}</td>
              <td>${interfaz.traficoOut}</td>
              <td>${interfaz.erroresIn}</td>
              <td>${interfaz.erroresOut}</td>
              <td>${interfaz.dropsIn}</td>
              <td>${interfaz.dropsOut}</td>
            `;
            tbody.appendChild(row);
          });
          return;
        })
        .catch(err => {
          console.error("[!] Error al cargar los datos", err);
        }); 
      }
    }

    
  }
  //Iniciar actualizaciones cada 5 seg
  setInterval(updateDate, 10000);
});
