const express = require("express");
const neo4j = require("neo4j-driver");

// Arma el router con las 15 consultas del TP. Recibe runQuery (definido en index.js) para no atarse al driver acá.
module.exports = function createEndpoints(runQuery) {
  const router = express.Router();

  // Envuelve un handler async para mandar el error a Express en vez de colgar el request
  function route(handler) {
    return (req, res) => {
      handler(req, res).catch((err) => {
        console.error(err);
        res.status(500).json({ error: err.message });
      });
    };
  }

  // 1. Películas con año de estreno, duración y URL de origen
  router.get(
    "/movies",
    route(async (req, res) => {
      const rows = await runQuery(
        `MATCH (m:Movie)
         RETURN m.title AS title, m.year AS year, m.runtime AS runtime, m.sourceUrl AS sourceUrl
         ORDER BY m.title`
      );
      res.json(rows);
    })
  );

  // 2. Series con año de inicio, año de finalización, rating de TVmaze y URL de origen
  router.get(
    "/series",
    route(async (req, res) => {
      const rows = await runQuery(
        `MATCH (s:Series)
         RETURN s.title AS title, s.startYear AS startYear, s.endYear AS endYear,
                s.rating AS tvmazeRating, s.sourceUrl AS sourceUrl
         ORDER BY s.title`
      );
      res.json(rows);
    })
  );

  // 3. Cantidad de películas o series conectadas a cada género
  router.get(
    "/genres/work-counts",
    route(async (req, res) => {
      const rows = await runQuery(
        `MATCH (g:Genre)<-[:HAS_GENRE]-(work)
         RETURN g.name AS genre, count(work) AS totalWorks
         ORDER BY totalWorks DESC`
      );
      res.json(rows);
    })
  );

  // 4. Reparto y nombres de personajes de una película (por defecto "The Matrix")
  router.get(
    "/movies/cast",
    route(async (req, res) => {
      const title = req.query.title || "The Matrix";
      const rows = await runQuery(
        `MATCH (m:Movie {title: $title})<-[:APPEARS_IN]-(c:Character)<-[r:PLAYED]-(p:Person)
         RETURN p.name AS actor, c.name AS character, r.roleName AS roleName
         ORDER BY actor`,
        { title }
      );
      res.json(rows);
    })
  );

  // 5. Episodios de una temporada de una serie (por defecto temporada 1 de "Game of Thrones")
  router.get(
    "/episodes",
    route(async (req, res) => {
      const series = req.query.series || "Game of Thrones";
      const seasonNumber = neo4j.int(req.query.season || 1);
      const rows = await runQuery(
        `MATCH (se:Season)-[:BELONGS_TO]->(s:Series {title: $series})
         WHERE se.seasonNumber = $seasonNumber
         MATCH (e:Episode)-[:BELONGS_TO]->(se)
         RETURN e.episodeNumber AS episodeNumber, e.title AS title,
                e.rating AS rating, e.sourceUrl AS sourceUrl
         ORDER BY e.episodeNumber`,
        { series, seasonNumber }
      );
      res.json(rows);
    })
  );

  // 6. Compañías o cadenas conectadas a cada película o serie
  router.get(
    "/companies/works",
    route(async (req, res) => {
      const rows = await runQuery(
        `MATCH (co:Company)-[:PRODUCED]->(work)
         RETURN work.title AS title, labels(work)[0] AS type, collect(co.name) AS companies
         ORDER BY title`
      );
      res.json(rows);
    })
  );

  // 7. Episodios con mejor rating
  router.get(
    "/episodes/top-rated",
    route(async (req, res) => {
      const limit = neo4j.int(req.query.limit || 10);
      const rows = await runQuery(
        `MATCH (e:Episode)
         WHERE e.rating IS NOT NULL
         RETURN e.title AS title, e.rating AS rating,
                e.seasonNumber AS seasonNumber, e.episodeNumber AS episodeNumber
         ORDER BY e.rating DESC
         LIMIT $limit`,
        { limit }
      );
      res.json(rows);
    })
  );

  // 8. Duración promedio de las películas por género
  router.get(
    "/genres/average-runtime",
    route(async (req, res) => {
      const rows = await runQuery(
        `MATCH (m:Movie)-[:HAS_GENRE]->(g:Genre)
         WHERE m.runtime IS NOT NULL
         RETURN g.name AS genre, avg(m.runtime) AS avgRuntime, count(m) AS totalMovies
         ORDER BY avgRuntime DESC`
      );
      res.json(rows);
    })
  );

  // 9. Personas acreditadas en más de un tipo de rol (dirección, guion, producción, creación, actuación)
  router.get(
    "/people/multi-role",
    route(async (req, res) => {
      const rows = await runQuery(
        `MATCH (p:Person)-[r]->()
         WHERE type(r) IN ['DIRECTED', 'WROTE', 'PRODUCED', 'CREATED', 'PLAYED']
         WITH p, collect(DISTINCT type(r)) AS roles
         WHERE size(roles) > 1
         RETURN p.name AS person, roles
         ORDER BY size(roles) DESC, person`
      );
      res.json(rows);
    })
  );

  // 10. Actores que interpretaron más de un personaje
  router.get(
    "/actors/multi-character",
    route(async (req, res) => {
      const rows = await runQuery(
        `MATCH (p:Person)-[:PLAYED]->(c:Character)
         WITH p, collect(DISTINCT c.name) AS characters
         WHERE size(characters) > 1
         RETURN p.name AS actor, characters
         ORDER BY size(characters) DESC`
      );
      res.json(rows);
    })
  );

  // 20. Personajes interpretados por más de un actor
  router.get(
    "/characters/multi-actor",
    route(async (req, res) => {
      const rows = await runQuery(
        `MATCH (c:Character)<-[:PLAYED]-(p:Person)
         WITH c, collect(DISTINCT p.name) AS actors
         WHERE size(actors) > 1
         RETURN c.name AS character, actors
         ORDER BY size(actors) DESC`
      );
      res.json(rows);
    })
  );

  // 21. Camino más corto entre dos películas (por defecto "The Matrix" y "John Wick")
  router.get(
    "/movies/shortest-path",
    route(async (req, res) => {
      const from = req.query.from || "The Matrix";
      const to = req.query.to || "John Wick";
      const rows = await runQuery(
        `MATCH (a:Movie {title: $from}), (b:Movie {title: $to}),
               path = shortestPath((a)-[*]-(b))
         RETURN [n IN nodes(path) | coalesce(n.title, n.name)] AS nodes,
                [r IN relationships(path) | type(r)] AS relationships,
                length(path) AS length`,
        { from, to }
      );
      res.json(rows[0] || null);
    })
  );

  // 22. Actores ordenados por grado dentro de la red de coestrellas de películas
  router.get(
    "/actors/costar-degree",
    route(async (req, res) => {
      const limit = neo4j.int(req.query.limit || 20);
      const rows = await runQuery(
        `MATCH (p1:Person)-[:PLAYED]->(:Character)-[:APPEARS_IN]->(m:Movie)<-[:APPEARS_IN]-(:Character)<-[:PLAYED]-(p2:Person)
         WHERE p1 <> p2
         WITH p1, collect(DISTINCT p2) AS costars
         RETURN p1.name AS actor, size(costars) AS degree
         ORDER BY degree DESC
         LIMIT $limit`,
        { limit }
      );
      res.json(rows);
    })
  );

  // 23. Personas que conectan series de TV con películas mediante créditos de actuación
  router.get(
    "/people/tv-movie-bridges",
    route(async (req, res) => {
      const rows = await runQuery(
        `MATCH (p:Person)-[:PLAYED]->(:Character)-[:APPEARS_IN]->(e:Episode)-[:PART_OF]->(s:Series)
         WITH p, collect(DISTINCT s.title) AS seriesTitles
         MATCH (p)-[:PLAYED]->(:Character)-[:APPEARS_IN]->(m:Movie)
         WITH p, seriesTitles, collect(DISTINCT m.title) AS movieTitles
         RETURN p.name AS person, seriesTitles, movieTitles
         ORDER BY person`
      );
      res.json(rows);
    })
  );

  // 24. Solapamiento de géneros entre películas y series
  router.get(
    "/genres/movie-series-overlap",
    route(async (req, res) => {
      const rows = await runQuery(
        `MATCH (m:Movie)-[:HAS_GENRE]->(g:Genre)
         WITH g, count(DISTINCT m) AS movieCount
         MATCH (s:Series)-[:HAS_GENRE]->(g)
         WITH g, movieCount, count(DISTINCT s) AS seriesCount
         RETURN g.name AS genre, movieCount, seriesCount
         ORDER BY genre`
      );
      res.json(rows);
    })
  );

  return router;
};
