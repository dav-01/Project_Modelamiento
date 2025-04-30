# Base image con Ubuntu + Octave
FROM ubuntu:22.04

# Instala Octave y Node.js
RUN apt-get update && \
    apt-get install -y gnupg curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs octave && \
    apt-get clean

# Crea carpeta para la app
WORKDIR /app

# Copia el proyecto
COPY . .

# Instala dependencias de Node.js
RUN npm install

# Expone el puerto del servidor
EXPOSE 3000

# Comando para iniciar el servidor
CMD ["node", "server.js"]
