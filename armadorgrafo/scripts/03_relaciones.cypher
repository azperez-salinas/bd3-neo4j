// Vincula el resto de las relaciones del grafo (cast, géneros, productoras, dirección, guion) una vez que todos los nodos ya existen
LOAD CSV WITH HEADERS FROM 'file:///csv/movie_cast.csv' AS row
MATCH (m:Movie {id: row.movieId})
MATCH (p:Person {id: row.personId})
MATCH (c:Character {id: row.characterId})
MERGE (p)-[r:PLAYED]->(c)
SET r.roleName = row.roleName,
    r.sourceUrl = row.sourceUrl
MERGE (c)-[:APPEARS_IN]->(m);

LOAD CSV WITH HEADERS FROM 'file:///csv/episode_cast.csv' AS row
MATCH (e:Episode {id: row.episodeId})
MATCH (p:Person {id: row.personId})
MATCH (c:Character {id: row.characterId})
MERGE (p)-[r:PLAYED]->(c)
SET r.roleName = row.roleName,
    r.sourceUrl = row.sourceUrl
MERGE (c)-[:APPEARS_IN]->(e);

LOAD CSV WITH HEADERS FROM 'file:///csv/movie_genres.csv' AS row
MATCH (m:Movie {id: row.movieId})
MATCH (g:Genre {id: row.genreId})
MERGE (m)-[:HAS_GENRE]->(g);

LOAD CSV WITH HEADERS FROM 'file:///csv/series_genres.csv' AS row
MATCH (s:Series {id: row.seriesId})
MATCH (g:Genre {id: row.genreId})
MERGE (s)-[:HAS_GENRE]->(g);

// production_companies.csv mezcla pelis y series en un solo archivo (workType); se separa en dos pasadas porque cada una apunta a un label distinto
LOAD CSV WITH HEADERS FROM 'file:///csv/production_companies.csv' AS row
WITH row WHERE row.workType = 'Movie'
MATCH (m:Movie {id: row.workId})
MATCH (co:Company {id: row.companyId})
MERGE (co)-[:PRODUCED]->(m);

LOAD CSV WITH HEADERS FROM 'file:///csv/production_companies.csv' AS row
WITH row WHERE row.workType = 'Series'
MATCH (s:Series {id: row.workId})
MATCH (co:Company {id: row.companyId})
MERGE (co)-[:PRODUCED]->(s);

LOAD CSV WITH HEADERS FROM 'file:///csv/series_creators.csv' AS row
MATCH (s:Series {id: row.seriesId})
MATCH (p:Person {id: row.personId})
MERGE (p)-[:CREATED]->(s);

LOAD CSV WITH HEADERS FROM 'file:///csv/movie_directors.csv' AS row
MATCH (m:Movie {id: row.movieId})
MATCH (p:Person {id: row.personId})
MERGE (p)-[:DIRECTED]->(m);

LOAD CSV WITH HEADERS FROM 'file:///csv/movie_writers.csv' AS row
MATCH (m:Movie {id: row.movieId})
MATCH (p:Person {id: row.personId})
MERGE (p)-[:WROTE]->(m);

LOAD CSV WITH HEADERS FROM 'file:///csv/movie_producers.csv' AS row
MATCH (m:Movie {id: row.movieId})
MATCH (p:Person {id: row.personId})
MERGE (p)-[:PRODUCED]->(m);

LOAD CSV WITH HEADERS FROM 'file:///csv/episode_directors.csv' AS row
MATCH (e:Episode {id: row.episodeId})
MATCH (p:Person {id: row.personId})
MERGE (p)-[:DIRECTED]->(e);

LOAD CSV WITH HEADERS FROM 'file:///csv/episode_writers.csv' AS row
MATCH (e:Episode {id: row.episodeId})
MATCH (p:Person {id: row.personId})
MERGE (p)-[:WROTE]->(e);
