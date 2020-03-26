mapboxgl.accessToken = "pk.eyJ1IjoiZGlzdHJpY3RyIiwiYSI6ImNqbjUzMTE5ZTBmcXgzcG81ZHBwMnFsOXYifQ.8HRRLKHEJA0AismGk2SX2g";;

var select_state = "ma";
var state_configs = {
  ma: {
    center: [-71.5, 42.12],
    zoom: 7,
    hospitals: "./ma_hospitals.geojson?v=4",
    name: "Massachusetts"
  }
};

function processMaps(select_state) {
  var map = new mapboxgl.Map({
    container: select_state + '_map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: state_configs[select_state].center,
    zoom: state_configs[select_state].zoom,
  });
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
    fetch(state_configs[select_state].hospitals).then(function(res) { return res.json() }).then(function(hospitals) {
      map.addSource('hospitals', {
        type: 'geojson',
        data: hospitals
      });

      map.addLayer({
        id: 'hospitals',
        type: 'circle',
        source: 'hospitals',
        paint: {
          'circle-radius': 5, //["*", ["sqrt", ["get", "BEDS"]], 0.3],
          'circle-color': 'rgb(255, 79, 73)',
          'circle-opacity': 0.9
        }
      });
      hoverLayer('hospitals');
    });
  });
}
processMaps("ma");
