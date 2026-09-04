// Carga los nodos de cada entidad (Person, Character, Genre, Company, Movie, Series, Season, Episode) desde sus CSV
LOAD CSV WITH HEADERS FROM 'file:///csv/people.csv' AS row
MERGE (p:Person {id: row.id})
SET p.name = row.name,
    p.birthYear = toInteger(row.birthYear),
    p.primaryProfession = row.primaryProfession,
    p.wikidataId = row.wikidataId,
    p.tvmazeId = row.tvmazeId,
    p.sourceUrl = row.sourceUrl;

LOAD CSV WITH HEADERS FROM 'file:///csv/characters.csv' AS row
MERGE (c:Character {id: row.id})
SET c.name = row.name,
    c.description = row.description,
    c.wikidataId = row.wikidataId,
    c.tvmazeId = row.tvmazeId,
    c.sourceUrl = row.sourceUrl;

LOAD CSV WITH HEADERS FROM 'file:///csv/genres.csv' AS row
MERGE (g:Genre {id: row.id})
SET g.name = row.name,
    g.wikidataId = row.wikidataId,
    g.sourceUrl = row.sourceUrl;

LOAD CSV WITH HEADERS FROM 'file:///csv/companies.csv' AS row
MERGE (co:Company {id: row.id})
SET co.name = row.name,
    co.country = row.country,
    co.foundedYear = toInteger(row.foundedYear),
    co.wikidataId = row.wikidataId,
    co.tvmazeId = row.tvmazeId,
    co.sourceUrl = row.sourceUrl;

LOAD CSV WITH HEADERS FROM 'file:///csv/movies.csv' AS row
MERGE (m:Movie {id: row.id})
SET m.title = row.title,
    m.year = toInteger(row.year),
    m.runtime = toInteger(row.runtime),
    m.rating = toFloat(row.rating),
    m.ratingSource = row.ratingSource,
    m.description = row.description,
    m.wikidataId = row.wikidataId,
    m.imdbId = row.imdbId,
    m.sourceUrl = row.sourceUrl;

LOAD CSV WITH HEADERS FROM 'file:///csv/series.csv' AS row
MERGE (s:Series {id: row.id})
SET s.title = row.title,
    s.startYear = toInteger(row.startYear),
    s.endYear = toInteger(row.endYear),
    s.rating = toFloat(row.rating),
    s.ratingSource = row.ratingSource,
    s.description = row.description,
    s.tvmazeId = row.tvmazeId,
    s.sourceUrl = row.sourceUrl;

// Season y Episode además arman su relación BELONGS_TO/PART_OF con Series de una vez, ya que dependen de ella
LOAD CSV WITH HEADERS FROM 'file:///csv/seasons.csv' AS row
MERGE (se:Season {id: row.id})
SET se.seasonNumber = toInteger(row.seasonNumber),
    se.year = toInteger(row.year),
    se.tvmazeId = row.tvmazeId,
    se.sourceUrl = row.sourceUrl
WITH se, row
MATCH (s:Series {id: row.seriesId})
MERGE (se)-[:BELONGS_TO]->(s);

LOAD CSV WITH HEADERS FROM 'file:///csv/episodes.csv' AS row
MERGE (e:Episode {id: row.id})
SET e.title = row.title,
    e.seasonNumber = toInteger(row.seasonNumber),
    e.episodeNumber = toInteger(row.episodeNumber),
    e.year = toInteger(row.year),
    e.runtime = toInteger(row.runtime),
    e.rating = toFloat(row.rating),
    e.ratingSource = row.ratingSource,
    e.description = row.description,
    e.tvmazeId = row.tvmazeId,
    e.sourceUrl = row.sourceUrl
WITH e, row
MATCH (s:Series {id: row.seriesId})
MATCH (se:Season {id: row.seasonId})
MERGE (e)-[:BELONGS_TO]->(se)
MERGE (e)-[:PART_OF]->(s);
