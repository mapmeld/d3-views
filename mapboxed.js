mapboxgl.accessToken = "pk.eyJ1IjoiZGlzdHJpY3RyIiwiYSI6ImNqbjUzMTE5ZTBmcXgzcG81ZHBwMnFsOXYifQ.8HRRLKHEJA0AismGk2SX2g";;

var map = new mapboxgl.Map({
  container: 'ma_map',
  style: 'mapbox://styles/mapbox/light-v10',
  center: [-71.5, 42.12],
  zoom: 7
});

map.on('load', function() {

  fetch("./ma_hospitals.geojson").then(function(res) { return res.json() }).then(function(hospitals) {

    map.addSource('hospitals', {
      type: 'geojson',
      data: hospitals
    });
    map.addLayer({
      id: 'hospitals',
      type: 'circle',
      source: 'hospitals',
      paint: {
        'circle-radius': ["*", ["sqrt", ["get", "BEDCOUNT"]], 0.4],
        'circle-color': 'rgb(255, 50, 50)',
        'circle-opacity': 0.9
      }
    });

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

      map.addSource('colleges', {
        type: 'geojson',
        data: colleges
      });
      map.addLayer({
        id: 'colleges',
        type: 'circle',
        source: 'colleges',
        paint: {
          'circle-radius': ["*", ["sqrt", ["get", "DORMCAP"]], 0.2],
          'circle-color': '#00f',
          'circle-opacity': 0.4
        }
      });

      colleges.features.forEach(function(college) {
        var coordinates = ma_projection(college.geometry.coordinates),
            row = d3.select('tbody').append('tr');
        ["COLLEGE", "CAMPUS", "CITY", "DORMCAP", "staff_assigned", "patients_assigned", "utilization"].forEach(function (column) {
          row.append('td').text(isNaN(1 * (college.properties[column] + 1))
            ? college.properties[column]
            : (1 * college.properties[column]).toLocaleString());
        });
      });
    });
  });
});
