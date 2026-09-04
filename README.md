# Neo4j Movie Graph

Este proyecto contiene una instancia local de Neo4j, los archivos CSV del grafo de películas y series, un servicio (`armadorgrafo`) que arma el grafo automáticamente la primera vez que se levanta el stack, y bases mínimas de `backend` (Node.js) y `frontend` (HTML/CSS/JS) listas para extender.

Cuando el volumen de datos está vacío, `armadorgrafo` espera a que Neo4j esté saludable y corre los scripts de `armadorgrafo/scripts/` (restricciones, nodos y relaciones) contra los CSV. Si el volumen ya tiene datos (reinicios normales), detecta que el grafo ya fue armado y no hace nada.

## Iniciar Neo4j

Desde esta carpeta:

```bash
docker compose up
```

## Neo4j Browser

Abre Neo4j Browser en:

```text
http://localhost:7474
```

Credenciales:

```text
usuario: neo4j
contraseña: password123
```

Bolt está disponible en:

```text
bolt://localhost:7687
```

## Backend y frontend

Son bases mínimas, todavía sin lógica real:

- `backend/`: servidor Node.js (`index.js` + `package.json`) que solo responde un healthcheck en `http://localhost:3000`.
- `frontend/`: sitio estático (`index.html`, `style.css`, `script.js`) servido por Nginx en `http://localhost:8080`.

Ambos se buildean y levantan junto con el resto vía `docker compose up`.

## CSV

Los CSV están en:

```text
armadorgrafo/data/csv/
```

## Armado automático del grafo

El servicio `armadorgrafo` corre los scripts de `armadorgrafo/scripts/` en orden (`01_restricciones.cypher`, `02_nodos.cypher`, `03_relaciones.cypher`) apenas Neo4j está saludable. Al terminar, deja un nodo `_ImportMeta {id: 'seed'}` como marca; si ese nodo ya existe (porque el volumen `neo4j_data` persiste entre reinicios), el servicio no vuelve a importar.

Para forzar un re-armado desde cero:

```bash
docker compose down -v
docker compose up
```

Podés seguir el progreso del armado con:

```bash
docker compose logs -f armadorgrafo
```

## Persistencia

Los datos de Neo4j se guardan en volúmenes Docker. Esto conserva la base de datos cuando detienes o reinicias el contenedor:

```bash
docker compose down
```

Solo este comando borra los volúmenes y los datos de Neo4j:

```bash
docker compose down -v
```

