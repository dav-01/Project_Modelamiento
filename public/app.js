// Variable global para guardar la instancia de la gráfica de Chart.js
let chart = null;

// URL de la API backend donde se hacen los cálculos
const API_URL = "http://localhost:3000";

function mostrarError(msg, resultadoId) {
  document.getElementById(resultadoId).innerText = msg;
  document.getElementById(resultadoId).style.color = 'red';
}

function limpiarError(resultadoId) {
  document.getElementById(resultadoId).innerText = '';
  document.getElementById(resultadoId).style.color = '';
}

function validarDatos(metodo, x, X, Y, resultadoId) {
  if (!Array.isArray(X) || !Array.isArray(Y) || X.length === 0 || Y.length === 0) {
    mostrarError('Los vectores X y Y no pueden estar vacíos.', resultadoId);
    return false;
  }
  if (X.length !== Y.length) {
    mostrarError('Los vectores X y Y deben tener el mismo tamaño.', resultadoId);
    return false;
  }
  if (X.some(isNaN) || Y.some(isNaN)) {
    mostrarError('Todos los valores de X y Y deben ser numéricos.', resultadoId);
    return false;
  }
  if (metodo !== 'mincuadlin' && (isNaN(x) || x === undefined)) {
    mostrarError('El valor de x debe ser numérico.', resultadoId);
    return false;
  }
  limpiarError(resultadoId);
  return true;
}

// Función principal que se ejecuta al presionar el botón de calcular
async function calcular(metodo) {
  let x, X, Y, resultadoId, graficaId, btnId;

  if (metodo === "IntLineal") {
    x = parseFloat(document.getElementById('x-intlineal').value);
    X = document.getElementById('X-intlineal').value.split(' ').map(Number);
    Y = document.getElementById('Y-intlineal').value.split(' ').map(Number);
    resultadoId = 'resultado-intlineal';
    graficaId = 'grafica-intlineal';
    btnId = 'btn-calcular-intlineal';
  } else if (metodo === "mincuadlin") {
    X = document.getElementById('X-mincuadlin').value.split(' ').map(Number);
    Y = document.getElementById('Y-mincuadlin').value.split(' ').map(Number);
    resultadoId = 'resultado-mincuadlin';
    graficaId = 'grafica-mincuadlin';
    btnId = 'btn-calcular-mincuadlin';
  } else if (metodo === "PoliLagrange") {
    x = parseFloat(document.getElementById('x-lagrange').value);
    X = document.getElementById('X-lagrange').value.split(' ').map(Number);
    Y = document.getElementById('Y-lagrange').value.split(' ').map(Number);
    resultadoId = 'resultado-lagrange';
    graficaId = 'grafica-lagrange';
    btnId = 'btn-calcular-lagrange';
  }

  const btn = document.getElementById(btnId);
  btn.disabled = true;
  btn.innerText = 'Calculando...';

  // Validación
  if (!validarDatos(metodo, x, X, Y, resultadoId)) {
    btn.disabled = false;
    btn.innerText = 'Calcular';
    return;
  }

  let body = { metodo, X, Y };
  if (metodo !== 'mincuadlin') {
    body.x = x;
  }

  try {
    const response = await fetch(`${API_URL}/calcular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error('Error en el servidor. Intenta de nuevo.');
    }

    const data = await response.json();
    if (data.error) {
      mostrarError('Error: ' + data.error, resultadoId);
    } else {
      document.getElementById(resultadoId).style.color = '';
      document.getElementById(resultadoId).innerText = JSON.stringify(data, null, 2);

      const ctx = document.getElementById(graficaId).getContext('2d');
      if (chart) chart.destroy();

      if (metodo === 'mincuadlin') {
        const valores = data.resultado.trim().split(/\s+/).map(Number);
        const [m, b] = valores;
        const puntos = X.map((xi, i) => ({ x: xi, y: Y[i] }));
        const minX = Math.min(...X);
        const maxX = Math.max(...X);
        const linea = [
          { x: minX, y: m * minX + b },
          { x: maxX, y: m * maxX + b }
        ];

        chart = new Chart(ctx, {
          type: 'scatter',
          data: {
            datasets: [
              {
                label: 'Datos Originales',
                data: puntos,
                backgroundColor: 'blue',
                pointRadius: 5
              },
              {
                label: 'Recta Ajustada',
                data: linea,
                borderColor: 'green',
                backgroundColor: 'transparent',
                showLine: true
              }
            ]
          },
          options: {
            scales: {
              x: { title: { display: true, text: 'X' } },
              y: { title: { display: true, text: 'Y' } }
            }
          }
        });

      } else if (metodo === "PoliLagrange") {
        const puntos = X.map((xi, i) => ({ x: xi, y: Y[i] }));
        const interpolado = { x: x, y: parseFloat(data.resultado) };

        // Generar puntos intermedios para la curva
        const minX = Math.min(...X);
        const maxX = Math.max(...X);
        const numPuntos = 100;
        const paso = (maxX - minX) / (numPuntos - 1);
        const curva = [];

        for (let i = 0; i < numPuntos; i++) {
          const xi = minX + i * paso;
          // Calcular el valor de Lagrange en xi usando los datos actuales
          let yi = 0;
          for (let j = 0; j < X.length; j++) {
            let lj = 1;
            for (let k = 0; k < X.length; k++) {
              if (j !== k) {
                lj *= (xi - X[k]) / (X[j] - X[k]);
              }
            }
            yi += Y[j] * lj;
          }
          curva.push({ x: xi, y: yi });
        }

        chart = new Chart(ctx, {
          type: 'scatter',
          data: {
            datasets: [
              {
                label: 'Datos Originales',
                data: puntos,
                backgroundColor: 'red',
                borderColor: 'red',
                pointRadius: 6,
                pointStyle: 'circle',
                showLine: false,
              },
              {
                label: 'Curva de Lagrange',
                data: curva,
                borderColor: 'blue',
                backgroundColor: 'transparent',
                showLine: true,
                fill: false,
                pointRadius: 0,
                borderWidth: 2,
                tension: 0.4, // suaviza la curva
              },
              {
                label: 'Punto Interpolado',
                data: [interpolado],
                backgroundColor: 'green',
                borderColor: 'green',
                pointRadius: 10,
                pointStyle: 'rect',
                showLine: false,
                fill: false,
                borderWidth: 2,
              }
            ]
          },
          options: {
            plugins: {
              legend: { display: true },
              title: {
                display: true,
                text: 'Polinomio de Lagrange'
              }
            },
            scales: {
              x: {
                title: { display: true, text: 'x' },
                grid: { display: true }
              },
              y: {
                title: { display: true, text: 'y' },
                grid: { display: true }
              }
            }
          }
        });
      } else {
        const puntos = X.map((xi, i) => ({ x: xi, y: Y[i] }));
        const interpolado = { x: x, y: parseFloat(data.resultado) };

        chart = new Chart(ctx, {
          type: 'scatter',
          data: {
            datasets: [
              {
                label: 'Datos Originales',
                data: puntos,
                backgroundColor: 'red',
                borderColor: 'red',
                pointRadius: 6,
                pointStyle: 'circle',
                showLine: true,
                fill: false,
                borderWidth: 2,
                tension: 0,
              },
              {
                label: 'Punto Interpolado',
                data: [interpolado],
                backgroundColor: 'blue',
                borderColor: 'blue',
                pointRadius: 10,
                pointStyle: 'rect',
                showLine: false,
                fill: false,
                borderWidth: 2,
              }
            ]
          },
          options: {
            plugins: {
              legend: { display: true },
              title: {
                display: true,
                text: metodo === "PoliLagrange" ? 'Polinomio de Lagrange' : 'Interpolación Lineal'
              }
            },
            scales: {
              x: {
                title: { display: true, text: 'x' },
                grid: { display: true }
              },
              y: {
                title: { display: true, text: 'y' },
                grid: { display: true }
              }
            }
          }
        });
      }
    }
  } catch (err) {
    mostrarError('Error de conexión o en el cálculo: ' + err.message, resultadoId);
  } finally {
    btn.disabled = false;
    btn.innerText = 'Calcular';
  }
}
