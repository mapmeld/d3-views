mapboxgl.accessToken = "pk.eyJ1IjoiZGlzdHJpY3RyIiwiYSI6ImNqbjUzMTE5ZTBmcXgzcG81ZHBwMnFsOXYifQ.8HRRLKHEJA0AismGk2SX2g";;

var map = new mapboxgl.Map({
  container: 'ma_map',
  style: 'mapbox://styles/mapbox/light-v10',
  center: [-71.5, 42.12],
  zoom: 7,
});

function hoverLayer(layer) {
  map.on('mousemove', layer, function(e) {
    if (e.features.length) {
      console.log(e.features);
    } else {

    }
  });

  map.on('mouseleave', layer, function(e) {

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
  fetch("./links.json").then(function(res) { return res.json() }).then(function(links) {
    // have links but want to add coordinates

    fetch("./ma_hospitals.geojson").then(function(res) { return res.json() }).then(function(hospitals) {
      hospitals.features.forEach(function (feature) {
        // feature.id = index;
        // index++;
        links.forEach(function (link, index) {
          if (link.hospital === feature.properties.NAME) {
            link.hospital = feature.geometry.coordinates;
          }
        });
      });

      map.addSource('hospitals', {
        type: 'geojson',
        data: hospitals
      });
      map.addLayer({
        id: 'hospitals',
        type: 'circle',
        source: 'hospitals',
        paint: {
          'circle-radius': ["*", ["sqrt", ["get", "BEDCOUNT"]], 0.3],
          'circle-color': 'rgb(255, 50, 50)',
          'circle-opacity': 0.9
        }
      });
      hoverLayer('hospitals');

      fetch("./ma_colleges.geojson?v=2").then(function(res) { return res.json() }).then(function(colleges) {
        colleges.features = colleges.features.filter(function (college) {
          if (college.properties.COLLEGE === "Boston College") {
            return college.properties.CAMPUS === "Main Campus";
          }
          return ["Wheaton College", "Stonehill College", "Springfield College", "Western New England University",
          "College of the Holy Cross", "Curry College", "Tufts University", "	Boston College",
          "Boston University", "Wentworth Institute of Technology",
          /*"Northeastern University",*/
          "Emmanuel College", "Clark University","Mount Holyoke College","Worcester Polytechnic Institute","Wellesley College",
          "Assumption College","Babson College","Smith College","Hampshire College","Bentley University",
          "Emerson College", "Suffolk University", "Massachusetts Institute of Technology", "Brandeis University",
          "Amherst College", "Lesley University", "Endicott College", "Gordon College", "Merrimack College", "Williams College"
          ].includes(college.properties.COLLEGE.trim())
        });

        colleges.features.forEach(function(college) {
          // college.id = index;
          // index++;

          links.forEach(function (link, index) {
            if (link.college === college.properties.COLLEGE) {
              link.college = college.geometry.coordinates;
            }
          })

          var row = d3.select('tbody').append('tr');
          ["COLLEGE", "CAMPUS", "CITY", "DORMCAP", "staff_assigned", "patients_assigned", "utilization"].forEach(function (column) {
            row.append('td').text(isNaN(1 * (college.properties[column] + 1))
              ? college.properties[column]
              : (1 * college.properties[column]).toLocaleString());
          });
        });

        map.addSource('colleges', {
          type: 'geojson',
          data: colleges
        });
        map.addLayer({
          id: 'colleges',
          type: 'circle',
          source: 'colleges',
          paint: {
            'circle-radius': ["*", ["sqrt", ["get", "DORMCAP"]], 0.3],
            'circle-color': '#00f',
            'circle-opacity': 0.4
          }
        });
        hoverLayer('colleges');

        var linkData = {
          type: "FeatureCollection",
          features: links.map(function (link) {
            return {
              type: "Feature",
              geometry: {type:"LineString",coordinates:[link.hospital, link.college]},
              properties: {}
            }
          })
        };
        console.log(linkData);
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
            'line-width': 2
          }
        });
      });
    });
  });
});
