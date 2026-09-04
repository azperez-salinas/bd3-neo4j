# Backend Node.js mínimo (solo responde un healthcheck), listo como base para agregar rutas y el driver de Neo4j
FROM node:20-alpine

WORKDIR /app

# Se copian los manifiestos primero para aprovechar el cache de capas de Docker
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
