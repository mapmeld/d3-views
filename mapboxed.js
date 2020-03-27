mapboxgl.accessToken = "pk.eyJ1IjoiZGlzdHJpY3RyIiwiYSI6ImNqbjUzMTE5ZTBmcXgzcG81ZHBwMnFsOXYifQ.8HRRLKHEJA0AismGk2SX2g";;

var main_map = null;
var select_state = "ma";

var state_configs = {
  ma: {
    center: [-71.5, 42.12],
    zoom: 7,
    links: {
      "40": "./json/ma_combined_results_20200327_40_util_euclidean.json",
      "60": "./json/ma_combined_results_20200327_60_util_euclidean.json",
      "80": "./json/ma_combined_results_20200327_80_util_euclidean.json"
    },
    csvs: {
      "40": "./csv/ma_ed_inst_assignments_20200327_40_util_euclidean.csv",
      "60": "./csv/ma_ed_inst_assignments_20200327_60_util_euclidean.csv",
      "80": "./csv/ma_ed_inst_assignments_20200327_80_util_euclidean.csv"
    },
    hospitals: "./geojson/ma_hospitals.geojson?v=4",
    colleges: "./geojson/ma_colleges.geojson?v=4",
    name: "Massachusetts"
  },
  ny: {
    center: [-75.6, 43],
    zoom: 5,
    links: "./json/NY_combined_results_20200325_v1.json?v=3",
    hospitals: "./geojson/ny_hospitals.geojson",
    colleges: "./geojson/ny_colleges.geojson",
    name: "New York"
  },
  mi: {
    center: [-85, 44.659],
    zoom: 4.7,
    links: "./json/MI_combined_results_20200325_v1.json?v=3",
    hospitals: "./geojson/mi_hospitals.geojson",
    colleges: "./geojson/mi_colleges.geojson?v=2",
    name: "Michigan"
  }
};

// $("#state_name_here").text(state_configs[select_state].name);

var capacity = "60";
function toggleLines(e) {
  if (e.target.value === "0") {
    // hide links
    main_map.setPaintProperty('links', 'line-opacity', 0);
  } else if (e.target.value === capacity) {
    // show existing links
    main_map.setPaintProperty('links', 'line-opacity', 1);
  } else {
    capacity = e.target.value;
    main_map.setPaintProperty('links', 'line-opacity', 0);
    fetch(state_configs["ma"].links[capacity]).then(function (res) { return res.json() }).then(function(links) {
      main_map.getSource('links').setData(processLinks(links));
      main_map.setPaintProperty('links', 'line-opacity', 1);
    });
    load_MA_CSV();
  }
}

function processLinks(links) {
  return {
    type: "FeatureCollection",
    features: links.map(function (link) {
      return {
        type: "Feature",
        geometry: {type:"LineString",coordinates:[link.hospital, link.college]},
        properties: {weight:link.weight}
      }
    })
  };
}

function processMaps(select_state) {
  var map = new mapboxgl.Map({
    container: select_state + '_map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: state_configs[select_state].center,
    zoom: state_configs[select_state].zoom,
  });

  if (select_state === "ma") {
    main_map = map;
  }
  var popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 10
  });

  function hoverLayer(layer) {
    map.on('mouseenter', layer, function(e) {
      map.getCanvas().style.cursor = 'pointer';

      var name = e.features[0].properties.NAME
        || e.features[0].properties.FAC_NAME
        || e.features[0].properties.COLLEGE;
      popup
        .setLngLat(e.features[0].geometry.coordinates)
        .setHTML(name)
        .addTo(map);
    });

    map.on('mouseleave', layer, function(e) {
      map.getCanvas().style.cursor = '';
      popup.remove();
    });
  }

  map.on('load', function() {
    var geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      marker: {
        color: 'orange'
      },
      mapboxgl: mapboxgl
    });
    map.addControl(geocoder);
    map.addControl(new mapboxgl.NavigationControl());

    map.addSource('election', {
      type: "vector",
      url: "mapbox://mapbox.hist-pres-election-state"
    })
    map.addLayer({
      id: 'election',
      source: 'election',
      "source-layer": "historical_pres_elections_state",
      type: 'line',
      paint: {
        'line-color': '#555',
        'line-width': ["case", ["==", ["get", "state_abbrev"], select_state.toUpperCase()], 2.5, 0.5]
      }
    });

    var linkURL = (typeof state_configs[select_state].links === "object")
        ? state_configs[select_state].links[capacity]
        : state_configs[select_state].links;
    fetch(linkURL).then(function(res) { return res.json() }).then(function(links) {
      // have links but want to add coordinates

      fetch(state_configs[select_state].hospitals).then(function(res) { return res.json() }).then(function(hospitals) {
       hospitals.features = hospitals.features.filter(feature => feature.properties.BEDS >= 10);

        hospitals.features.forEach(function (feature) {

          feature.properties.NAME = feature.properties.NAME || feature.properties.FAC_NAME;

          if (select_state === "ma") {
            var row = $('<tr>');
            $('#hospitals tbody').append(row);

            if (feature.properties.BEDS < 0) {
              feature.properties.BEDS = 0;
            }

            ["NAME", hospitals.features[0].properties.TOWN ? "TOWN" : "CITY", "BEDS"].forEach(function (column) {
              var cell = $('<td>');
              if (feature.properties[column]) {
                cell.text(isNaN(1 * (feature.properties[column]))
                  ? feature.properties[column]
                  : (1 * feature.properties[column]).toLocaleString());
              }
              row.append(cell);
            });
          }

        });
        if (select_state === "ma") {
          $('#hospitals').DataTable({
            scrollY:        "400px",
            scrollCollapse: true,
            paging:         false
          });
        }

        map.addSource('hospitals', {
          type: 'geojson',
          data: hospitals
        });

        fetch(state_configs[select_state].colleges).then(function(res) { return res.json() }).then(function(colleges) {
          colleges.features = colleges.features.filter(function (college) {
            if (select_state !== "ma") {
              return true;
            }
            if (["Boston College", "Northeastern University"].includes(college.properties.COLLEGE)) {
              return college.properties.CAMPUS === "Main Campus";
            }
            return ["Wheaton College", "Stonehill College", "Springfield College", "Western New England University",
            "College of the Holy Cross", "Curry College", "Tufts University", "	Boston College",
            "Boston University", "Wentworth Institute of Technology",
            "Northeastern University", "Framingham State University", "Harvard College", "Worcester State University",
            "Eastern Nazarene College", "American International College", "Westfield State University",
            "Bridgewater State University", "University of Massachusetts Dartmouth", "Massachusetts Maritime Academy",
            "University of Massachusetts Dartmouth Center for Innovation and Entrepreneurship",
            "Northpoint Bible College", "University of Massachusetts Lowell", "Fitchburg State University",
            "Salem State University", "Lasell College", "Massachusetts College of Pharmacy and Health Science",
            "Simmons College", "Regis College", "Nichols College", "Dean College", "Becker College",
            "Emmanuel College", "Clark University","Mount Holyoke College","Worcester Polytechnic Institute","Wellesley College",
            "Assumption College","Babson College","Smith College","Hampshire College","Bentley University",
            "Emerson College", "Suffolk University", "Massachusetts Institute of Technology", "Brandeis University",
            "Amherst College", "Lesley University", "Endicott College", "Gordon College", "Merrimack College", "Williams College"
            ].includes(college.properties.COLLEGE.trim())
          });

          colleges.features.forEach(function(feature) {
            feature.properties.NAME = feature.properties.NAME || feature.properties.COLLEGE;
          });

          map.addSource('colleges', {
            type: 'geojson',
            data: colleges
          });

          var linkData = processLinks(links);

          console.log(linkData.features.filter(function(f) {
            return (typeof f.geometry.coordinates[0] === "string") || (typeof f.geometry.coordinates[1] === "string")
          }));

          map.addSource('links', {
            type: 'geojson',
            data: linkData
          });
          map.addLayer({
            id: 'links',
            type: 'line',
            source: 'links',
            paint: {
              'line-color': '#000',
              'line-width': ["*", ["get", "weight"], 0.015]
            }
          });

          map.addLayer({
            id: 'hospitals',
            type: 'circle',
            source: 'hospitals',
            paint: {
              'circle-radius': ["*", ["sqrt", ["get", "BEDS"]], 0.3],
              'circle-color': 'rgb(255, 79, 73)',
              'circle-opacity': 0.9
            }
          });
          hoverLayer('hospitals');

          map.addLayer({
            id: 'colleges',
            type: 'circle',
            source: 'colleges',
            paint: {
              'circle-radius': ["*", ["sqrt", ["get", "DORM_CAP"]], 0.3],
              'circle-color': '#006b9c',
              'circle-opacity': 0.4
            }
          });
          hoverLayer('colleges');
        });
      });
    });
  });
}
processMaps("ma");
processMaps("mi");
processMaps("ny");

// CSV stuff
var alreadyMadeTable = false;
function load_MA_CSV() {
  fetch(state_configs.ma.csvs[capacity]).then(function(res) { return res.text() }).then(function (college_csv) {
    if (alreadyMadeTable) {
      $('#colleges').DataTable().destroy();
      $("#colleges tbody").html("");
    }

    college_csv.split("\n").slice(1).forEach(function(r) {
      var college = r.split(","),
          row = $('<tr>');
      if (!r.length) {
        return;
      }
      $('#colleges tbody').append(row);

      college.forEach(function (column) {
        var cell = $('<td>');
        if (column) {
          cell.text(isNaN(1 * column)
            ? column
            : (1 * column).toLocaleString());
        }
        row.append(cell);
      });
    });

    alreadyMadeTable = true;
    $('#colleges').DataTable({
      scrollY:        "400px",
      scrollCollapse: true,
      paging:         false,
      order: [[ 5, "desc" ]]
    });
  });
}
$(document).ready(function() {
  $("#ma_map .no-script").html("");
  load_MA_CSV();
});


$(document).ready(function() {
  fetch("state_total_dorms_vs_beds.json").then(response => response.json()).then(function (states) {

    states.forEach(function (state) {
      var row = $('<tr>');
      $('#nation tbody').append(row);

      ["STATE", "CIRCLE", "DORM_CAP", "BEDS"].forEach(function (column) {
        var cell = $('<td>');
        if (column === "CIRCLE") {
          const h = 100;
          if (state["DORM_CAP"] > state["BEDS"]) {
            var scale = Math.sqrt(state["DORM_CAP"] / state["BEDS"]);

            cell.html(`<svg height="80" width="80">
              <circle cx="40" cy="40" r="40" fill="#0099cd" />
              <circle cx="40" cy="40" r="${40/scale}" fill="#ff4f49" />
               </svg>`);
          } else {
            var scale = Math.sqrt(state["BEDS"] / state["DORM_CAP"]);

            cell.html(`<svg height="80" width="80">
              <circle cx="40" cy="40" r="40" fill="#ff4f49" />
              <circle cx="40" cy="40" r="${40/scale}" fill="#0099cd" />
               </svg>`);
          }
        }
        else {
          if (state[column]) {
          cell.text(isNaN(1 * (state[column]))
            ? state[column]
            : (1 * state[column]).toLocaleString());
          }
        }
        row.append(cell);
      });

    });
    $('#nation').DataTable({
      scrollY:        "400px",
      scrollCollapse: true,
      paging:         false,
        order: [[ 3, "desc" ]]
      });
  });
});
