const express = require("express");
const cors = require("cors");
const neo4j = require("neo4j-driver");
const createEndpoints = require("./endpoints");

const PORT = process.env.PORT || 3000;

// disableLosslessIntegers: los count()/size() de Cypher vuelven como number de JS en vez de neo4j.Integer
const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://neo4j:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || "neo4j",
    process.env.NEO4J_PASSWORD || "password123"
  ),
  { disableLosslessIntegers: true }
);

async function runQuery(cypher, params = {}) {
  const session = driver.session();
  try {
    const result = await session.run(cypher, params);
    return result.records.map((record) => record.toObject());
  } finally {
    await session.close();
  }
}

const app = express();

// El frontend corre en otro puerto (Nginx en :8080), así que necesita permiso CORS para poder llamar a esta API
app.use(cors());

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "backend" });
});

app.use(createEndpoints(runQuery));

app.listen(PORT, () => {
  console.log(`Backend escuchando en el puerto ${PORT}`);
});
