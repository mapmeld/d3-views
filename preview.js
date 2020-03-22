let width = 960,
    height = 500;

const places = {
  ma: {
    path: d3.geoPath().projection(d3.geoMercator()
    				   .translate([width/2, height/2])
               .center([-71.6194366, 42.1])
    				   .scale([12000]))
  },
  boston: {
    path: d3.geoPath().projection(d3.geoMercator()
    				   .translate([width/2, height/2])
               .center([-71.0874114, 42.3609005])
    				   .scale([65000]))
  },
  springfield: {
    path: d3.geoPath().projection(d3.geoMercator()
    				   .translate([width/2, height/2])
               .center([-72.651758, 42.1441507])
    				   .scale([80000]))
  },
  worcester: {
    path: d3.geoPath().projection(d3.geoMercator()
    				   .translate([width/2, height/2])
               .center([-71.8126597, 42.2625075])
    				   .scale([80000]))
  }
};

fetch("./mass_2018_bg.topojson").then(res => res.json()).then((tj) => {
  const gj = topojson.feature(tj, tj.objects.mass_2018_bg);
  Object.keys(places).forEach((place) => {
    document.querySelector("#" + place + "_map").innerHTML = "";
    let my_svg = d3.select("#" + place + "_map")
      .append("svg")
      .attr("width", width)
      .attr("height", height);
    my_svg.selectAll("path")
    	.data(gj.features)
    	.enter()
    	.append("path")
    	.attr("d", places[place].path)
    	.style("stroke", "#000")
    	.style("stroke-width", 0.2)
    	.style("fill", (d) => {
        return "#ccc";
      });
  });
});
