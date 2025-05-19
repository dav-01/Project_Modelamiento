const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const cors = require('cors');
  const { v4: uuidv4 } = require('uuid'); // npm install uuid

const app = express();
const port = 3000;

// Habilita CORS para permitir peticiones desde otros orígenes
app.use(cors());

// Sirve archivos estáticos desde la carpeta '../public' (ajusta si tu frontend está en otra carpeta)
app.use(express.static(path.join(__dirname, '../public')));

// Middleware para parsear JSON en las peticiones
app.use(express.json());

// Ruta principal (puedes quitarla si solo quieres servir el frontend)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Ruta para realizar el cálculo numérico usando Octave
app.post('/calcular', async (req, res) => {
  try {
    let { x, y, metodo } = req.body;
    
    // Sanitización básica
    if (!Array.isArray(X) || !Array.isArray(Y) || X.length !== Y.length) {
      return res.json({ error: 'Vectores X y Y inválidos o de diferente tamaño.' });
    }
    if (X.some(isNaN) || Y.some(isNaN)) {
      return res.json({ error: 'Todos los valores de X y Y deben ser numéricos.' });
    }
    if (metodo !== 'mincuadlin' && (typeof x !== 'number' || isNaN(x))) {
      return res.json({ error: 'El valor de x debe ser numérico.' });
    }

    // Nombre único para el script temporal
    const scriptName = `temp_script_${uuidv4()}.m`;
    const scriptPath = path.join(__dirname, scriptName);

    const metodoPath = path.join(__dirname, 'octave', `${metodo}.m`);

    const X_str = `[${X.join(',')}]`;
    const Y_str = `[${Y.join(',')}]`;

    // Crear contenido para el script temporal de Octave
    let scriptContent = '';

    if (metodo === 'mincuadlin') {
      scriptContent = `
        addpath(genpath("${path.dirname(metodoPath).replace(/\\/g, "/")}"));
        X = ${X_str};
        Y = ${Y_str};
        [m, b] = mincuadlin(X, Y);
        disp("RESULTADO:");
        disp([m, b]);
      `;
    } else {
      scriptContent = `
        addpath(genpath("${path.dirname(metodoPath).replace(/\\/g, "/")}"));
        x = ${x};
        X = ${X_str};
        Y = ${Y_str};
        resultado = ${metodo}(x, X, Y);
        disp(resultado);
      `;
    }

    // Escribe el script temporal
    fs.writeFileSync(scriptPath, scriptContent);

    // Ejecuta Octave con el script generado
    exec(`octave-cli --quiet "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('Error:', error.message);
        return res.status(500).json({ error: 'Error al ejecutar Octave' });
      }

      // Extrae el resultado de la salida de Octave
      const match = stdout.match(/RESULTADO:\s+([\s\S]*)/);
      const resultado = match ? match[1].trim() : stdout.trim();

      res.json({ resultado });
      if (fs.existsSync(scriptPath)) {
        fs.unlink(scriptPath, () => {}); // elimina script temporal solo si existe
      }
    });
  } catch (err) {
    res.json({ error: 'Error interno en el servidor.' });
  }
});

// Inicia el servidor en el puerto especificado
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
