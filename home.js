const width = Math.min(960, window.innerWidth - 40),
      height = 500,
      ma_projection = d3.geoMercator()
      				   .translate([width/2, height/2])
                 .center([-71.6194366, 42.1])
      				   .scale([12000 * (width / 960)]),
      places = {
  ma: {
    path: d3.geoPath().projection(ma_projection)
               .pointRadius(3)
  }
};

let prevName = null;
function tooltip(name, isCollege) {
  if (name) {
    prevName = name;
  }
  d3.select(".my_tooltip")
    .text(name || prevName)
    .style("visibility", name ? "visible" : "hidden");
}

fetch("./ma_state.topojson").then(res => res.json()).then((state) => {
  const gj = topojson.feature(state, state.objects.ma_state);

  d3.select("#ma_map").html("");

  const my_svg = d3.select("#ma_map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);
  my_svg.selectAll("path")
    .data(gj.features)
    .enter()
    .append("path")
    .attr("d", places.ma.path)
    .style("stroke", "#000")
    .style("stroke-width", 0.2)
    .style("fill", "#eee");

  let tt = d3.select("#ma_map")
      .append("div")
      .classed("my_tooltip", true);

  fetch("./ma_hospitals.geojson").then(res => res.json()).then((hospitals) => {
    hospitals.features.forEach((hospital) => {
      let coordinates = ma_projection(hospital.geometry.coordinates),
            size = Math.round(Math.sqrt(hospital.properties.BEDCOUNT * 1) * 0.4);
      my_svg.append('rect')
        .attr('x', coordinates[0] - size/2)
        .attr('y', coordinates[1] - size/2)
        .attr('width', size)
        .attr('height', size)
        .style('fill', 'rgba(255, 79, 73, 0.9)')
        .on('mouseover', (e) => {
          tooltip(hospital.properties.NAME, false);
        })
        .on('mouseout', (e) => {
          tooltip();
        });
    });

    fetch("./ma_colleges.geojson?v=2").then(res => res.json()).then((colleges) => {
      colleges.features.filter((college) => {
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
      })
      .forEach((college) => {
          let coordinates = ma_projection(college.geometry.coordinates),
              row = d3.select('tbody').append('tr');
          ["COLLEGE", "CAMPUS", "CITY", "DORMCAP", "staff_assigned", "patients_assigned", "utilization"].forEach((column) => {
            row.append('td').text(isNaN(1 * (college.properties[column] + 1))
              ? college.properties[column]
              : (1 * college.properties[column]).toLocaleString());
          });
          my_svg.append('circle')
            .attr('cx', coordinates[0])
            .attr('cy', coordinates[1])
            .attr('r', Math.sqrt(college.properties.DORMCAP * 1) * 0.2)
            .style('fill', 'rgba(0, 153, 205, 0.4)')
            .on('mouseover', (e) => {
                tooltip(college.properties.COLLEGE);
            })
            .on('mouseout', (e) => {
              tooltip();
            });
      });
    });
  });
});
