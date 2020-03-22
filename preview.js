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

let gj = null,
    ma_data = null,
    selection = null;
function paintMap() {
  Object.keys(places).forEach((place) => {
    document.querySelector("#" + place + "_map").innerHTML = "";
  });
  Object.keys(places).forEach((place) => {
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
        let id = d.properties.GEOID;
        if (!selection || selection === "none" || !ma_data) {
          return "#ccc";
        } else {
          let total_pop = ma_data[id].total_pop,
              tract_id = id.substring(0, id.length - 1),
              pct = 0, sum = 0;
          if (selection === "english") {
            Object.keys(ma_data[id])
              .filter(key => key.includes("some_english") || key.includes("no_english"))
              .forEach(key => { pct += ma_data[id][key] });
            pct /= total_pop;
            if (pct < 0.1) {
              return "#fff";
            } else if (pct < 0.2) {
              return "#edf8e9";
            } else if (pct < 0.3) {
              return "#bae4b3";
            } else if (pct < 0.4) {
              return "#74c476";
            } else {
              return "#238b45";
            }
          } else if (selection === "grandchildren") {
            sum = ma_data[tract_id]["grandparent_grandchildren"];
            if (sum < 10) {
              return "#fff";
            } else if (sum < 20) {
              return "#eff3ff";
            } else if (sum < 30) {
              return "#bdd7e7";
            } else if (sum < 40) {
              return "#6baed6";
            } else {
              return "#2171b5";
            }
          } else if (selection === "poverty_percent") {
            let tract_pop = ma_data[tract_id].total_pop;
            sum = ma_data[tract_id]["poverty_total"];
            pct = sum / tract_pop;
            if (pct < 0.08) {
              return "#fff";
            } else if (pct < 0.16) {
              return "#f2f0f7";
            } else if (pct < 0.24) {
              return "#cbc9e2";
            } else if (pct < 0.32) {
              return "#9e9ac8";
            } else {
              return "#6a51a3";
            }
          } else if (selection === "poverty_seniors_percent") {
            let elder_sum = 0;
            for (let bg = 0; bg < 10; bg++) {
              let bgid = tract_id + String(bg);
              if (ma_data[bgid]) {
                Object.keys(ma_data[bgid])
                  .filter(key => key.includes("65_66") || key.includes("67_69")
                    || key.includes("70_74")
                    || key.includes("75_79")
                    || key.includes("80_84")
                    || key.includes("85_plus"))
                  .forEach(key => { elder_sum += ma_data[bgid][key] });
              }
            }
            Object.keys(ma_data[tract_id])
              .filter(key => ["poverty_m_65_74", "poverty_m_75_plus", "poverty_f_65_74", "poverty_f_75_plus"].includes(key))
              .forEach(key => { sum += ma_data[tract_id][key] });
            pct = sum / elder_sum;
            if (pct < 0.1) {
              return "#fff";
            } else if (pct < 0.2) {
              return "#eff3ff";
            } else if (pct < 0.3) {
              return "#bdd7e7";
            } else if (pct < 0.4) {
              return "#6baed6";
            } else {
              return "#2171b5";
            }
          } else if (selection === "poverty_kids") {
            Object.keys(ma_data[tract_id])
              .filter(key => key.includes("poverty_m_kids") || key.includes("poverty_f_kids"))
              .forEach(key => { sum += ma_data[tract_id][key] });
            if (sum < 100) {
              return "#fff";
            } else if (sum < 200) {
              return "#eff3ff";
            } else if (sum < 300) {
              return "#bdd7e7";
            } else if (sum < 400) {
              return "#6baed6";
            } else {
              return "#2171b5";
            }
          } else if (selection === "over_65") {
            Object.keys(ma_data[id])
              .filter(key => key.includes("65_66") || key.includes("67_69")
                || key.includes("70_74")
                || key.includes("75_79")
                || key.includes("80_84")
                || key.includes("85_plus"))
              .forEach(key => { pct += ma_data[id][key] });
            pct /= total_pop;
            if (pct < 0.1) {
              return "#fff";
            } else if (pct < 0.2) {
              return "#eff3ff";
            } else if (pct < 0.3) {
              return "#bdd7e7";
            } else if (pct < 0.4) {
              return "#6baed6";
            } else {
              return "#2171b5";
            }
          }
        }
      });
  });
}

fetch("./mass_2018_bg.topojson").then(res => res.json()).then((tj) => {
  gj = topojson.feature(tj, tj.objects.mass_2018_bg);
  paintMap();

  fetch("./ma_data.json").then(res => res.json()).then((blockgroups) => {
    ma_data = blockgroups;

    let dropdown = document.querySelector("select");
    dropdown.disabled = false;
    dropdown.onchange = (e) => {
      selection = e.target.value;
      console.log(selection);
      paintMap();
    };
  });
});
