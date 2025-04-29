async function calcular() {
    const metodo = document.getElementById('metodo').value;
    const x = parseFloat(document.getElementById('x').value);
    const X = document.getElementById('X').value.split(',').map(Number);
    const Y = document.getElementById('Y').value.split(',').map(Number);
  
    const res = await fetch('http://localhost:3000/calcular', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ metodo, x, X, Y })
    });
  
    const data = await res.json();
    document.getElementById('resultado').innerText = JSON.stringify(data, null, 2);
  }
  