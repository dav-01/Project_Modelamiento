let chart = null;

async function calcular() {
  const metodo = document.getElementById('metodo').value;
  const x = parseFloat(document.getElementById('x').value);
  const X = document.getElementById('X').value.split(',').map(Number);
  const Y = document.getElementById('Y').value.split(',').map(Number);

  const res = await fetch('http://localhost:3000/calcular', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metodo, x, X, Y })
  });

  const data = await res.json();
  document.getElementById('resultado').innerText = JSON.stringify(data, null, 2);

  // Gráfica
  const puntos = X.map((xi, i) => ({ x: xi, y: Y[i] }));
  const interpolado = { x: x, y: parseFloat(data.resultado) };

  // Construir curva interpolada para graficar
  const lagrangeCurve = [];
  const steps = 100;
  const minX = Math.min(...X);
  const maxX = Math.max(...X);
  for (let i = 0; i <= steps; i++) {
    const xi = minX + (i * (maxX - minX)) / steps;
    const res = await fetch('http://localhost:3000/calcular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metodo, x: xi, X, Y })
    });
    const punto = await res.json();
    lagrangeCurve.push({ x: xi, y: parseFloat(punto.resultado) });
  }

  // Dibujar con Chart.js
  const ctx = document.getElementById('grafica').getContext('2d');
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Puntos Originales',
          data: puntos,
          backgroundColor: 'blue',
          pointRadius: 5
        },
        {
          label: 'Curva Interpolada',
          data: lagrangeCurve,
          borderColor: 'green',
          backgroundColor: 'transparent',
          showLine: true,
          fill: false
        },
        {
          label: 'Punto Interpolado',
          data: [interpolado],
          backgroundColor: 'red',
          pointRadius: 6
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
}
