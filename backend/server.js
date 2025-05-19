/**
 * server.js
 * Servidor backend para ejecutar métodos de interpolación y ajuste de mínimos cuadrados usando Octave.
 * 
 * Funcionalidad:
 * - Expone una API para recibir datos y método de cálculo.
 * - Valida la entrada recibida.
 * - Genera un script temporal de Octave con los datos y método solicitado.
 * - Ejecuta el script usando Octave y retorna el resultado.
 * 
 * Endpoints:
 *   GET  /           : Devuelve la página principal.
 *   POST /calcular   : Recibe { x, X, Y, metodo } y retorna el resultado del cálculo.
 * 
 * Dependencias:
 *   express, cors, uuid, child_process, fs/promises, path, util
 */

const express = require('express');
const fs = require('fs/promises');
const { exec } = require('child_process');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const util = require('util');

const execAsync = util.promisify(exec);
const app = express();
const port = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

/**
 * GET /
 * Devuelve la página principal.
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

/**
 * Valida la entrada recibida en el body.
 * @param {Object} param0 - Objeto con x, X, Y, metodo
 * @returns {string|null} - Mensaje de error o null si es válido
 */
function validarEntrada({ x, X, Y, metodo }) {
  if (!Array.isArray(X) || !Array.isArray(Y) || X.length !== Y.length)
    return 'Vectores X y Y inválidos o de diferente tamaño.';
  if (X.length === 0 || Y.length === 0)
    return 'Los vectores X y Y no pueden estar vacíos.';
  if (X.some(isNaN) || Y.some(isNaN))
    return 'Todos los valores de X y Y deben ser numéricos.';
  if (X.length > 1000 || Y.length > 1000)
    return 'Los vectores no deben tener más de 1000 elementos.';
  if (metodo !== 'mincuadlin' && (typeof x !== 'number' || isNaN(x)))
    return 'El valor de x debe ser numérico.';
  return null;
}

/**
 * Genera y ejecuta un script Octave temporal con los datos y método solicitados.
 * @param {Object} param0 - Objeto con x, X, Y, metodo
 * @returns {Promise<Object>} - Resultado del cálculo
 */
async function ejecutarOctave({ x, X, Y, metodo }) {
  const scriptName = `temp_script_${uuidv4()}.m`;
  const scriptPath = path.join(__dirname, scriptName);
  const metodoPath = path.join(__dirname, 'octave', `${metodo}.m`);
  const X_str = `[${X.join(',')}]`;
  const Y_str = `[${Y.join(',')}]`;

  let scriptContent = '';
  if (metodo === 'mincuadlin') {
    // Script para mínimos cuadrados lineal
    scriptContent = `
      addpath(genpath("${path.dirname(metodoPath).replace(/\\/g, "/")}"));
      X = ${X_str};
      Y = ${Y_str};
      [m, b] = mincuadlin(X, Y);
      disp("RESULTADO:");
      disp([m, b]);
    `;
  } else {
    // Script para interpolación
    scriptContent = `
      addpath(genpath("${path.dirname(metodoPath).replace(/\\/g, "/")}"));
      x = ${x};
      X = ${X_str};
      Y = ${Y_str};
      resultado = ${metodo}(x, X, Y);
      disp(resultado);
    `;
  }

  try {
    await fs.writeFile(scriptPath, scriptContent);
    const { stdout } = await execAsync(`octave-cli --quiet "${scriptPath}"`);
    const match = stdout.match(/RESULTADO:\s+([\s\S]*)/);
    const resultado = match ? match[1].trim() : stdout.trim();
    return { resultado };
  } finally {
    await fs.unlink(scriptPath).catch(() => {});
  }
}

/**
 * POST /calcular
 * Recibe los datos y método, valida y ejecuta el cálculo en Octave.
 */
app.post('/calcular', async (req, res) => {
  const error = validarEntrada(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const result = await ejecutarOctave(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error al ejecutar Octave.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
