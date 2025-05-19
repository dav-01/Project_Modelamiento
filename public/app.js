let chart = null;
const API_URL = "http://localhost:3000";

function mostrarError(msg, resultadoId) {
  const el = document.getElementById(resultadoId);
  el.innerText = msg;
  el.style.color = 'red';
  el.setAttribute('role', 'alert');
}

function limpiarError(resultadoId) {
  const el = document.getElementById(resultadoId);
  el.innerText = '';
  el.style.color = '';
  el.removeAttribute('role');
}

function getFormData(metodo) {
  function parseVector(id) {
    return document.getElementById(id).value
      .trim()
      .split(/\s+/)
      .filter(v => v !== "") // Filtra vacíos
      .map(Number);
  }

  if (metodo === "IntLineal") {
    return {
      x: parseFloat(document.getElementById('x-intlineal').value),
      X: parseVector('X-intlineal'),
      Y: parseVector('Y-intlineal'),
      resultadoId: 'resultado-intlineal',
      graficaId: 'grafica-intlineal',
      btnId: 'btn-calcular-intlineal'
    };
  }
  if (metodo === "mincuadlin") {
    return {
      X: parseVector('X-mincuadlin'),
      Y: parseVector('Y-mincuadlin'),
      resultadoId: 'resultado-mincuadlin',
      graficaId: 'grafica-mincuadlin',
      btnId: 'btn-calcular-mincuadlin'
    };
  }
  if (metodo === "PoliLagrange") {
    return {
      x: parseFloat(document.getElementById('x-lagrange').value),
      X: parseVector('X-lagrange'),
      Y: parseVector('Y-lagrange'),
      resultadoId: 'resultado-lagrange',
      graficaId: 'grafica-lagrange',
      btnId: 'btn-calcular-lagrange'
    };
  }
}

function validarDatos(metodo, x, X, Y, resultadoId) {
  // Validar X
  if (!Array.isArray(X) || X.length === 0) {
    mostrarError('El vector X no puede estar vacío.', resultadoId);
    return false;
  }
  if (X.some(isNaN)) {
    mostrarError('Todos los valores de X deben ser numéricos.', resultadoId);
    return false;
  }
  // Validar Y
  if (!Array.isArray(Y) || Y.length === 0) {
    mostrarError('El vector Y no puede estar vacío.', resultadoId);
    return false;
  }
  if (Y.some(isNaN)) {
    mostrarError('Todos los valores de Y deben ser numéricos.', resultadoId);
    return false;
  }
  // Validar tamaño
  if (X.length !== Y.length) {
    mostrarError('Los vectores X y Y deben tener el mismo tamaño.', resultadoId);
    return false;
  }
  // Validar x solo si aplica
  if (metodo !== 'mincuadlin') {
    if (x === undefined || x === null || x === "" || isNaN(x)) {
      mostrarError('El valor de x debe ser numérico y no vacío.', resultadoId);
      return false;
    }
  }
  limpiarError(resultadoId);
  return true;
}

async function calcular(metodo) {
  let { x, X, Y, resultadoId, graficaId, btnId } = getFormData(metodo);

  if (!validarDatos(metodo, x, X, Y, resultadoId)) {
    return;
  }

  const btn = document.getElementById(btnId);
  btn.disabled = true;
  btn.innerText = 'Calculando...';

  let body = { metodo, X, Y };
  if (metodo !== 'mincuadlin') body.x = x;

  try {
    limpiarError(resultadoId);
    document.getElementById(resultadoId).innerText = '';
    if (chart) chart.destroy();

    const response = await fetch(`${API_URL}/calcular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error('Error en el servidor. Intenta de nuevo.');
    const data = await response.json();

    if (data.error) {
      mostrarError('Error: ' + data.error, resultadoId);
      return;
    }

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
  } catch (err) {
    mostrarError('Error de conexión o en el cálculo: ' + err.message, resultadoId);
  } finally {
    btn.disabled = false;
    btn.innerText = 'Calcular';
  }
}
