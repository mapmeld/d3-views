mapboxgl.accessToken = "pk.eyJ1IjoiZGlzdHJpY3RyIiwiYSI6ImNqbjUzMTE5ZTBmcXgzcG81ZHBwMnFsOXYifQ.8HRRLKHEJA0AismGk2SX2g";;

var select_state = (window.location.search.split("state=")[1] || "ma").substring(0, 2).toLowerCase();
if (select_state !== "ma") {
  // $(".table-container").hide();
}
var state_configs = {
  ma: {
    center: [-71.5, 42.12],
    zoom: 7,
    links: "./ma_combined_results_20200325_v3.json",
    hospitals: "./ma_hospitals.geojson?v=4",
    colleges: "./ma_colleges.geojson?v=4"
  },
  ny: {
    center: [-75, 43],
    zoom: 5.5,
    links: "./NY_combined_results_20200325_v1.json",
    hospitals: "./ny_hospitals.geojson",
    colleges: "./ny_colleges.geojson"
  },
  mi: {
    center: [-85, 44.659],
    zoom: 5.2,
    links: "./MI_combined_results_20200325_v1.json",
    hospitals: "./mi_hospitals.geojson",
    colleges: "./mi_colleges.geojson?v=2"
  }
};
var map = new mapboxgl.Map({
  container: 'ma_map',
  style: 'mapbox://styles/mapbox/light-v10',
  center: state_configs[select_state].center,
  zoom: state_configs[select_state].zoom,
});
var popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false
});

function toggleLines(e) {
  map.setPaintProperty('links', 'line-opacity', e.target.checked ? 1 : 0);
}

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

  // var index = 0;
  fetch(state_configs[select_state].links).then(function(res) { return res.json() }).then(function(links) {
    // have links but want to add coordinates

    fetch(state_configs[select_state].hospitals).then(function(res) { return res.json() }).then(function(hospitals) {
      hospitals.features.forEach(function (feature) {
        // feature.id = index;
        // index++;

        feature.properties.NAME = feature.properties.NAME || feature.properties.FAC_NAME;
        links.forEach(function (link, index) {
          if ([feature.properties.NAME, feature.properties.SHORTNAME].includes(link.hospital)) {
            link.hospital = feature.geometry.coordinates;
          }
        });

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

      });
      $('#hospitals').DataTable();

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
          "Northeastern University",
          "Emmanuel College", "Clark University","Mount Holyoke College","Worcester Polytechnic Institute","Wellesley College",
          "Assumption College","Babson College","Smith College","Hampshire College","Bentley University",
          "Emerson College", "Suffolk University", "Massachusetts Institute of Technology", "Brandeis University",
          "Amherst College", "Lesley University", "Endicott College", "Gordon College", "Merrimack College", "Williams College"
          ].includes(college.properties.COLLEGE.trim())
        });

        colleges.features.forEach(function(feature) {
          // feature.id = index;
          // index++;
          feature.properties.NAME = feature.properties.NAME || feature.properties.COLLEGE;

          links.forEach(function (link, index) {
            if (link.college === feature.properties.NAME) {
              link.college = feature.geometry.coordinates;
            }
          });

          if (select_state !== "ma") {
            if (feature.properties.CAMPUS) {
              feature.properties.NAME += "  (" + feature.properties.CAMPUS + ")";
            }

            var row = $('<tr>');
            $('#colleges tbody').append(row);
            ["NAME", "CITY", "DORM_CAP", "staff", "patients", "util"].forEach(function (column) {
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

        if (select_state !== "ma") {
          $('#colleges').DataTable();
        }

        map.addSource('colleges', {
          type: 'geojson',
          data: colleges
        });

        var linkData = {
          type: "FeatureCollection",
          features: links.map(function (link) {
            return {
              type: "Feature",
              geometry: {type:"LineString",coordinates:[link.hospital, link.college]},
              properties: {weight:link.weight}
            }
          })
        };

        // console.log(linkData.features.filter(function(f) {
        //   return (typeof f.geometry.coordinates[0] === "string") || (typeof f.geometry.coordinates[1] === "string")
        // }));

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
            'circle-color': 'rgb(255, 50, 50)',
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
            'circle-color': '#00f',
            'circle-opacity': 0.4
          }
        });
        hoverLayer('colleges');
      });
    });
  });
});

// CSV stuff
$(document).ready(function() {
  if (select_state === "ma") {
    fetch("./ma_ed_inst_assignments_20200325_v3.csv").then(function(res) { return res.text() }).then(function (college_csv) {
      college_csv.split("\n").slice(1).sort().forEach(function(r) {
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
      $('#colleges').DataTable();
    });
  }

  $("#map_switch").val(select_state);
  $("#map_switch").change(function(e) {
    window.location = "./?state=" + e.target.value;
  });
});
