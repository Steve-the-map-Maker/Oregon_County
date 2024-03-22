// Base map setup
const mapStyle = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap Contributors",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
    },
  ],
};

const map = new maplibregl.Map({
  container: "map", // The container ID
  style: mapStyle, // Your style object
  center: [-120.5, 44.0], // Starting position [lng, lat]
  zoom: 6, // Starting zoom level
});

map.on("load", function () {
  const queryURL =
    "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1/query?where=STATE='41'&outFields=NAME&outSR=4326&f=geojson";

  fetch(queryURL)
    .then((response) => response.json())
    .then((data) => {
      // Add GeoJSON data as a source to the map
      map.addSource("oregon-counties", {
        type: "geojson",
        data: data,
      });

      map.addLayer({
        id: "oregon-counties-layer",
        type: "fill",
        source: "oregon-counties",
        paint: {
          "fill-color": "#008fff",
          "fill-opacity": 0.5,
          "fill-outline-color": "#000000",
        },
      });

      // Fetch and process population data
      fetchPopulationData(); // Ensure this is defined and called within the map load
    })
    .catch((error) =>
      console.error("Error fetching Oregon county boundaries:", error)
    );
});

function fetchPopulationData() {
  fetch(
    "https://api.census.gov/data/2019/pep/population?get=NAME,POP&for=county:*&in=state:41&key=74a87d99b53d3b3effd2bd3148493f810c40bb5e"
  )
    .then((response) => response.json())
    .then((data) => {
      // Transform into a Map for easy access
      const populationMap = new Map(
        data.slice(1).map((item) => [item[0].split(", ")[0], item[1]])
      );

      // Setup click event with population data
      setupClickEvent(populationMap);
    })
    .catch((error) => console.error("Error fetching population data:", error));
}

function setupClickEvent(populationMap) {
  map.on("click", "oregon-counties-layer", function (e) {
    const countyName = e.features[0].properties.NAME;
    const population =
      populationMap.get(countyName) || "Population data not available";

    new maplibregl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`<strong>${countyName}</strong><p>Population: ${population}</p>`)
      .addTo(map);
  });
}
