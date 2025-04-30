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

  const ctx = document.getElementById('grafica').getContext('2d');
  if (chart) chart.destroy();

  if (metodo === 'mincuadlin') {
    const [m, b] = JSON.parse(data.resultado.replace(/\s+/g, ','));

    const puntos = X.map((xi, i) => ({ x: xi, y: Y[i] }));
    const minX = Math.min(...X);
    const maxX = Math.max(...X);
    const line = [
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
            data: line,
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
  } else {
    const puntos = X.map((xi, i) => ({ x: xi, y: Y[i] }));
    const interpolado = { x: x, y: parseFloat(data.resultado) };

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

}
