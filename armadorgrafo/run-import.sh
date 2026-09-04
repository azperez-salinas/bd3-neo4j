#!/usr/bin/env bash
# Arma el grafo corriendo los .cypher de ./scripts contra Neo4j, pero solo si el volumen todavía está vacío.
set -euo pipefail

HOST="neo4j"
PORT="7687"
USER="${NEO4J_USERNAME:-neo4j}"
PASS="${NEO4J_PASSWORD:-password123}"
ADDR="bolt://${HOST}:${PORT}"
SCRIPTS_DIR="$(dirname "$0")/scripts"

run_cypher() {
  cypher-shell -a "$ADDR" -u "$USER" -p "$PASS" "$@"
}

# El nodo _ImportMeta actúa de marca: si existe, el grafo ya se armó antes y no hay que repetirlo
echo "[armadorgrafo] Verificando si el grafo ya fue armado..."
ALREADY=$(run_cypher --format plain "MATCH (m:_ImportMeta {id: 'seed'}) RETURN count(m) AS c;" | tail -n 1 | tr -d '"')

if [ "$ALREADY" = "1" ]; then
  echo "[armadorgrafo] El grafo ya estaba armado (volumen no vacío). No hago nada."
  exit 0
fi

echo "[armadorgrafo] Volumen vacío detectado. Armando el grafo desde los CSV..."

# Corre los .cypher en orden alfabético (01_restricciones, 02_nodos, 03_relaciones)
for file in "$SCRIPTS_DIR"/*.cypher; do
  echo "[armadorgrafo] Ejecutando $(basename "$file")"
  run_cypher -f "$file"
done

# Deja la marca para que la próxima vez que arranque el contenedor no vuelva a importar
run_cypher "MERGE (:_ImportMeta {id: 'seed', armadoEn: datetime()});"

echo "[armadorgrafo] Grafo armado con éxito."
