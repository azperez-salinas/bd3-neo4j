// El backend corre en otro puerto (Nginx sirve este frontend en :8080, Node escucha en :3000)
const BASE_URL = "http://localhost:3000";

// Una entrada por cada ruta de endpoints.js: qué mostrar en el combo, la consigna completa
// (para mostrarla como descripción), a qué path pegarle, y qué parámetros de query string admite
// (con un valor por defecto para completar el input)
const QUERIES = [
  {
    label: "1. Películas: año, duración y URL",
    description:
      "Listar las películas con año de estreno, duración y URL de origen.",
    path: "/movies",
    params: [],
  },
  {
    label: "2. Series: año inicio/fin, rating y URL",
    description:
      "Listar las series con año de inicio, año de finalización, rating de TVmaze y URL de origen.",
    path: "/series",
    params: [],
  },
  {
    label: "3. Obras conectadas por género",
    description:
      "Contar cuántas películas o series están conectadas a cada género.",
    path: "/genres/work-counts",
    params: [],
  },
  {
    label: "4. Reparto y personajes de una película",
    description:
      'Mostrar el reparto y los nombres de los personajes de la película "The Matrix".',
    path: "/movies/cast",
    params: [{ name: "title", label: "Película", default: "The Matrix" }],
  },
  {
    label: "5. Episodios de una temporada",
    description: 'Listar los episodios de la temporada 1 de "Game of Thrones".',
    path: "/episodes",
    params: [
      { name: "series", label: "Serie", default: "Game of Thrones" },
      { name: "season", label: "Temporada", default: "1" },
    ],
  },
  {
    label: "6. Compañías por película/serie",
    description:
      "Mostrar las compañías o cadenas conectadas a cada película o serie.",
    path: "/companies/works",
    params: [],
  },
  {
    label: "7. Episodios con mejor rating",
    description: "Mostrar los episodios con mejor rating.",
    path: "/episodes/top-rated",
    params: [{ name: "limit", label: "Límite", default: "10" }],
  },
  {
    label: "8. Duración promedio por género",
    description: "Calcular la duración promedio de las películas por género.",
    path: "/genres/average-runtime",
    params: [],
  },
  {
    label: "9. Personas con más de un rol",
    description: "Encontrar personas acreditadas en más de un tipo de rol.",
    path: "/people/multi-role",
    params: [],
  },
  {
    label: "10. Actores con más de un personaje",
    description:
      "Encontrar actores que hayan interpretado más de un personaje.",
    path: "/actors/multi-character",
    params: [],
  },
  {
    label: "20. Personajes con más de un actor",
    description: "Encontrar personajes interpretados por más de un actor.",
    path: "/characters/multi-actor",
    params: [],
  },
  {
    label: "21. Camino más corto entre dos películas",
    description:
      'Encontrar el camino más corto del grafo entre "The Matrix" y "John Wick".',
    path: "/movies/shortest-path",
    params: [
      { name: "from", label: "Desde", default: "The Matrix" },
      { name: "to", label: "Hasta", default: "John Wick" },
    ],
  },
  {
    label: "22. Actores por grado de coestrellas",
    description:
      "Ordenar actores según su grado dentro de la red de coestrellas de películas.",
    path: "/actors/costar-degree",
    params: [{ name: "limit", label: "Límite", default: "20" }],
  },
  {
    label: "23. Personas que unen series y películas",
    description:
      "Encontrar personas que conectan series de TV con películas mediante créditos de actuación.",
    path: "/people/tv-movie-bridges",
    params: [],
  },
  {
    label: "19. Nodos a dos saltos desde una película",
    description:
      'Encontrar nodos del grafo a una distancia máxima de dos saltos desde "The Matrix".',
    path: "/movies/two-hop-neighbors",
    params: [{ name: "title", label: "Película", default: "The Matrix" }],
  },
  {
    label: "25. Actores especialistas en un género",
    description:
      "Encontrar los actores con mayor cantidad de películas de un mismo género.",
    path: "/actors/genre-specialists",
    params: [],
  },
  {
    label: "26. Actores y su director más recurrente",
    description:
      "Encontrar los actores que más veces trabajaron con un mismo director.",
    path: "/actors/frequent-director-collaborators",
    params: [],
  },
  {
    label: "27. Actores con más minutos grabados",
    description: "Encontrar los actores con más minutos grabados en películas.",
    path: "/actors/total-screen-minutes",
    params: [],
  },
  {
    label: "28. Grados de separación entre dos actores",
    description:
      "Encontrar el camino más corto del grafo entre dos personas a través de personajes y obras en común.",
    path: "/actors/degrees-of-separation",
    params: [
      { name: "from", label: "Desde", type: "actorSelect", default: "Al Pacino" },
      { name: "to", label: "Hasta", type: "actorSelect", default: "Joaquin Phoenix" },
    ],
  },
  {
    label: "29. Compañías con más películas exitosas recientes",
    description:
      "Encontrar las compañías con mayor cantidad de películas exitosas (rating de 7.5 o más) en los últimos 10 años.",
    path: "/companies/successful-recent-movies",
    params: [
      //como esta harcodeado no lo ponemos en parametros
      //{ name: "minRating", label: "Rating mínimo", default: "7.5" },
      //{ name: "years", label: "Últimos N años", default: "10" },
      //{ name: "limit", label: "Límite", default: "20" },
    ],
  },
];

const selectEl = document.getElementById("query-select");
const descriptionEl = document.getElementById("query-description");
const paramsEl = document.getElementById("params");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const runBtn = document.getElementById("run-btn");

function populateSelect() {
  QUERIES.forEach((query, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = query.label;
    selectEl.appendChild(option);
  });
}

function renderDescription(query) {
  descriptionEl.textContent = query.description;
}

// Cache: la lista de actores no cambia entre consultas, así que la pedimos una sola vez
// y reutilizamos la misma promesa (evita pegarle al backend cada vez que se cambia el combo)
let actorsPromise = null;
function fetchActors() {
  if (!actorsPromise) {
    actorsPromise = fetch(BASE_URL + "/people/actors")
      .then((res) => res.json())
      .catch((err) => {
        actorsPromise = null; // si falla, dejamos que el próximo intento vuelva a pedirla
        throw err;
      });
  }
  return actorsPromise;
}

async function renderParams(query) {
  paramsEl.innerHTML = "";

  for (const param of query.params) {
    const label = document.createElement("label");
    label.textContent = param.label;
    paramsEl.appendChild(label);

    if (param.type === "actorSelect") {
      const select = document.createElement("select");
      select.id = `param-${param.name}`;

      const loadingOption = document.createElement("option");
      loadingOption.textContent = "Cargando actores...";
      select.appendChild(loadingOption);
      paramsEl.appendChild(select);

      try {
        const actors = await fetchActors();
        select.innerHTML = "";
        actors.forEach((actor) => {
          const option = document.createElement("option");
          option.value = actor.name;
          option.textContent = actor.name;
          if (actor.name === param.default) {
            option.selected = true;
          }
          select.appendChild(option);
        });
      } catch (err) {
        select.innerHTML = "";
        const errorOption = document.createElement("option");
        errorOption.textContent = "Error al cargar actores";
        select.appendChild(errorOption);
      }
    } else {
      const input = document.createElement("input");
      input.type = "text";
      input.id = `param-${param.name}`;
      input.value = param.default;
      paramsEl.appendChild(input);
    }
  }
}

function buildUrl(query) {
  const url = new URL(BASE_URL + query.path);
  query.params.forEach((param) => {
    const input = document.getElementById(`param-${param.name}`);
    if (input.value) {
      url.searchParams.set(param.name, input.value);
    }
  });
  return url.toString();
}

function formatColumnName(name) {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (character) => character.toUpperCase());
}

function formatCellValue(value) {
  if (value === null || value === undefined) {
    return "-";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function renderResults(data) {
  resultEl.innerHTML = "";

  if (Array.isArray(data) && data.length === 0) {
    resultEl.textContent = "La consulta no devolvió resultados.";
    return;
  }

  const rows = Array.isArray(data) ? data : data === null ? [] : [data];
  if (rows.length === 0) {
    resultEl.textContent = "La consulta no devolvió resultados.";
    return;
  }

  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const table = document.createElement("table");
  const header = document.createElement("thead");
  const headerRow = document.createElement("tr");

  columns.forEach((column) => {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = formatColumnName(column);
    headerRow.appendChild(cell);
  });
  header.appendChild(headerRow);
  table.appendChild(header);

  const body = document.createElement("tbody");
  rows.forEach((row) => {
    const tableRow = document.createElement("tr");
    columns.forEach((column) => {
      const cell = document.createElement("td");
      cell.textContent = formatCellValue(row[column]);
      tableRow.appendChild(cell);
    });
    body.appendChild(tableRow);
  });
  table.appendChild(body);
  resultEl.appendChild(table);
}

async function runSelectedQuery() {
  const query = QUERIES[selectEl.value];
  const url = buildUrl(query);

  statusEl.textContent = "Ejecutando...";
  resultEl.textContent = "";

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    renderResults(data);
    statusEl.textContent = `OK (${url})`;
  } catch (err) {
    statusEl.textContent = "Error";
    resultEl.textContent = String(err);
  }
}

selectEl.addEventListener("change", async () => {
  const query = QUERIES[selectEl.value];
  renderDescription(query);
  await renderParams(query);
});

runBtn.addEventListener("click", runSelectedQuery);

populateSelect();
renderDescription(QUERIES[0]);
renderParams(QUERIES[0]);
