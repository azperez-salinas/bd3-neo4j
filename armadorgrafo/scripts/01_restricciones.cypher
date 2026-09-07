// Constraints de unicidad por id: obligatorios para poder usar MERGE y acelerar los MATCH del resto de los scripts
CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT movie_id IF NOT EXISTS FOR (m:Movie) REQUIRE m.id IS UNIQUE;
CREATE CONSTRAINT series_id IF NOT EXISTS FOR (s:Series) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT season_id IF NOT EXISTS FOR (se:Season) REQUIRE se.id IS UNIQUE;
CREATE CONSTRAINT episode_id IF NOT EXISTS FOR (e:Episode) REQUIRE e.id IS UNIQUE;
CREATE CONSTRAINT character_id IF NOT EXISTS FOR (c:Character) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT genre_id IF NOT EXISTS FOR (g:Genre) REQUIRE g.id IS UNIQUE;
CREATE CONSTRAINT company_id IF NOT EXISTS FOR (co:Company) REQUIRE co.id IS UNIQUE;
