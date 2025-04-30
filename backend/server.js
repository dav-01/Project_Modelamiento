const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.post('/calcular', (req, res) => {
  const { metodo, x, X, Y } = req.body;

  const tempScriptPath = path.join(__dirname, 'temp_script.m');
  const metodoPath = path.join(__dirname, 'octave', `${metodo}.m`);

  const X_str = `[${X.join(',')}]`;
  const Y_str = `[${Y.join(',')}]`;

  // Crear contenido para el script temporal
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
      disp("RESULTADO:");
      disp(resultado);
    `;
  }



  fs.writeFileSync(tempScriptPath, scriptContent);

  exec(`octave-cli --quiet "${tempScriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error('Error:', error.message);
      return res.status(500).json({ error: 'Error al ejecutar Octave' });
    }

    const match = stdout.match(/RESULTADO:\s+([\s\S]*)/);
    const resultado = match ? match[1].trim() : stdout.trim();

    res.json({ resultado });
    fs.unlinkSync(tempScriptPath); // elimina script temporal
  });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
