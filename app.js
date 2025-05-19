/**
 * app.js
 * Lógica frontend para enviar datos al backend, validar entradas, mostrar resultados y graficar.
 * 
 * Funcionalidad principal:
 * - Obtiene y valida datos de los formularios según el método seleccionado.
 * - Envía los datos al backend mediante fetch.
 * - Muestra resultados y errores en la interfaz.
 * - Grafica los resultados usando Chart.js.
 */

let chart = null;
const API_URL = "https://projectmodelamiento-production.up.railway.app";

/**
 * Muestra un mensaje de error en el elemento resultado correspondiente.
 * @param {string} msg - Mensaje de error a mostrar.
 * @param {string} resultadoId - ID del elemento donde mostrar el error.
 */
function mostrarError(msg, resultadoId) {
  const el = document.getElementById(resultadoId);
  el.innerText = msg;
  el.style.color = 'red';
  el.setAttribute('role', 'alert');
}

/**
 * Limpia el mensaje de error del elemento resultado correspondiente.
 * @param {string} resultadoId - ID del elemento a limpiar.
 */
function limpiarError(resultadoId) {
  const el = document.getElementById(resultadoId);
  el.innerText = '';
  el.style.color = '';
  el.removeAttribute('role');
}

/**
 * Obtiene y parsea los datos del formulario según el método seleccionado.
 * @param {string} metodo - Método seleccionado ('IntLineal', 'mincuadlin', 'PoliLagrange').
 * @returns {Object} - Objeto con los datos del formulario y referencias de elementos.
 */
function getFormData(metodo) {
  const campos = {
    IntLineal: {
      x: parseFloat(document.getElementById('x-intlineal').value),
      X: parseVector('X-intlineal'),
      Y: parseVector('Y-intlineal'),
      resultadoId: 'resultado-intlineal',
      graficaId: 'grafica-intlineal',
      btnId: 'btn-calcular-intlineal'
    },
    mincuadlin: {
      X: parseVector('X-mincuadlin'),
      Y: parseVector('Y-mincuadlin'),
      resultadoId: 'resultado-mincuadlin',
      graficaId: 'grafica-mincuadlin',
      btnId: 'btn-calcular-mincuadlin'
    },
    PoliLagrange: {
      x: parseFloat(document.getElementById('x-lagrange').value),
      X: parseVector('X-lagrange'),
      Y: parseVector('Y-lagrange'),
      resultadoId: 'resultado-lagrange',
      graficaId: 'grafica-lagrange',
      btnId: 'btn-calcular-lagrange'
    }
  };
  return campos[metodo];
}

/**
 * Parsea un vector desde un input por id.
 * @param {string} id - ID del input.
 * @returns {Array<number>} - Vector numérico.
 */
function parseVector(id) {
  return document.getElementById(id).value
    .trim()
    .split(/\s+/)
    .filter(v => v !== "")
    .map(Number);
}

/**
 * Valida los datos ingresados antes de enviarlos al backend.
 * @param {string} metodo - Método seleccionado.
 * @param {number} x - Valor de x (si aplica).
 * @param {Array<number>} X - Vector X.
 * @param {Array<number>} Y - Vector Y.
 * @param {string} resultadoId - ID del elemento resultado.
 * @returns {boolean} - true si los datos son válidos, false si hay error.
 */
function validarDatos(metodo, x, X, Y, resultadoId) {
  if (!Array.isArray(X) || X.length === 0)
    return mostrarError('El vector X no puede estar vacío.', resultadoId), false;
  if (X.some(isNaN))
    return mostrarError('Todos los valores de X deben ser numéricos.', resultadoId), false;
  if (!Array.isArray(Y) || Y.length === 0)
    return mostrarError('El vector Y no puede estar vacío.', resultadoId), false;
  if (Y.some(isNaN))
    return mostrarError('Todos los valores de Y deben ser numéricos.', resultadoId), false;
  if (X.length !== Y.length)
    return mostrarError('Los vectores X y Y deben tener el mismo tamaño.', resultadoId), false;
  if (metodo !== 'mincuadlin' && (x === undefined || x === null || x === "" || isNaN(x)))
    return mostrarError('El valor de x debe ser numérico y no vacío.', resultadoId), false;
  limpiarError(resultadoId);
  return true;
}

/**
 * Grafica los resultados según el método seleccionado.
 * @param {string} metodo - Método seleccionado.
 * @param {Array<number>} X - Vector X.
 * @param {Array<number>} Y - Vector Y.
 * @param {number} x - Valor de x (si aplica).
 * @param {string|number} resultado - Resultado del cálculo.
 * @param {CanvasRenderingContext2D} ctx - Contexto del canvas para graficar.
 */
function graficar(metodo, X, Y, x, resultado, ctx) {
  if (chart) chart.destroy();
  const puntos = X.map((xi, i) => ({ x: xi, y: Y[i] }));

  if (metodo === 'mincuadlin') {
    const [m, b] = resultado.trim().split(/\s+/).map(Number);
    const minX = Math.min(...X), maxX = Math.max(...X);
    const linea = [
      { x: minX, y: m * minX + b },
      { x: maxX, y: m * maxX + b }
    ];
    chart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          { label: 'Datos Originales', data: puntos, backgroundColor: 'blue', pointRadius: 5 },
          { label: 'Recta Ajustada', data: linea, borderColor: 'green', backgroundColor: 'transparent', showLine: true }
        ]
      },
      options: { scales: { x: { title: { display: true, text: 'X' } }, y: { title: { display: true, text: 'Y' } } } }
    });
  } else if (metodo === "PoliLagrange") {
    const interpolado = { x: x, y: parseFloat(resultado) };
    const minX = Math.min(...X), maxX = Math.max(...X), numPuntos = 100, paso = (maxX - minX) / (numPuntos - 1);
    const curva = [];
    for (let i = 0; i < numPuntos; i++) {
      const xi = minX + i * paso;
      let yi = 0;
      for (let j = 0; j < X.length; j++) {
        let lj = 1;
        for (let k = 0; k < X.length; k++) if (j !== k) lj *= (xi - X[k]) / (X[j] - X[k]);
        yi += Y[j] * lj;
      }
      curva.push({ x: xi, y: yi });
    }
    chart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          { label: 'Datos Originales', data: puntos, backgroundColor: 'red', borderColor: 'red', pointRadius: 6, pointStyle: 'circle', showLine: false },
          { label: 'Curva de Lagrange', data: curva, borderColor: 'blue', backgroundColor: 'transparent', showLine: true, fill: false, pointRadius: 0, borderWidth: 2, tension: 0.4 },
          { label: 'Punto Interpolado', data: [interpolado], backgroundColor: 'green', borderColor: 'green', pointRadius: 10, pointStyle: 'rect', showLine: false, fill: false, borderWidth: 2 }
        ]
      },
      options: {
        plugins: { legend: { display: true }, title: { display: true, text: 'Polinomio de Lagrange' } },
        scales: { x: { title: { display: true, text: 'x' }, grid: { display: true } }, y: { title: { display: true, text: 'y' }, grid: { display: true } } }
      }
    });
  } else {
    const interpolado = { x: x, y: parseFloat(resultado) };
    chart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          { label: 'Datos Originales', data: puntos, backgroundColor: 'red', borderColor: 'red', pointRadius: 6, pointStyle: 'circle', showLine: true, fill: false, borderWidth: 2, tension: 0 },
          { label: 'Punto Interpolado', data: [interpolado], backgroundColor: 'blue', borderColor: 'blue', pointRadius: 10, pointStyle: 'rect', showLine: false, fill: false, borderWidth: 2 }
        ]
      },
      options: {
        plugins: { legend: { display: true }, title: { display: true, text: metodo === "PoliLagrange" ? 'Polinomio de Lagrange' : 'Interpolación Lineal' } },
        scales: { x: { title: { display: true, text: 'x' }, grid: { display: true } }, y: { title: { display: true, text: 'y' }, grid: { display: true } } }
      }
    });
  }
}

/**
 * Envía los datos al backend, muestra el resultado y grafica.
 * @param {string} metodo - Método seleccionado.
 */
async function calcular(metodo) {
  let { x, X, Y, resultadoId, graficaId, btnId } = getFormData(metodo);
  if (!validarDatos(metodo, x, X, Y, resultadoId)) return;

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
    graficar(metodo, X, Y, x, data.resultado, ctx);

  } catch (err) {
    mostrarError('Error de conexión o en el cálculo: ' + err.message, resultadoId);
  } finally {
    btn.disabled = false;
    btn.innerText = 'Calcular';
  }
}
