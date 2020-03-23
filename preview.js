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

function formatNumber(num) {
  if (num <= 1.0) {
    return Math.round(num * 100) + '%';
  }
  return num;
}

function drawLegend(colorbreaks) {
  if (!colorbreaks) {
    document.querySelector('#legend').style.display = "none";
    return null;
  }

  document.querySelector('#legend').style.display = "block";
  document.querySelectorAll('.square .box').forEach((box, index) => {
    if (index) {
      box.style.backgroundColor = colorbreaks[index - 1].color;
    }
  });
  let lastMax = 0;
  document.querySelectorAll('.square .number').forEach((box, index) => {
    if (!index) {
      // 0-th white box
      box.innerText = '0' + (colorbreaks[0].max > 1 ? '' : '%') + ' - ' + formatNumber(colorbreaks[0].min);
      lastMax = colorbreaks[0].min;
    } else if (index === colorbreaks.length) {
      // last box
      box.innerText = '≥ ' + formatNumber(lastMax);
    } else {
      box.innerText = formatNumber(lastMax) + ' - ' + formatNumber(colorbreaks[index - 1].max);
      lastMax = colorbreaks[index - 1].max;
    }
  });

  return (val) => {
    if (val <= colorbreaks[0].min) {
      return "#fff";
    }
    for (let c = 0; c < colorbreaks.length - 1; c++) {
      if (colorbreaks[c].max > val) {
        return colorbreaks[c].color;
      }
    }
    return colorbreaks[colorbreaks.length - 1].color;
  };
}

function paintMap() {
  let coloration = null;
  Object.keys(places).forEach((place) => {
    document.querySelector("#" + place + "_map").innerHTML = "";
  });
  if (selection === "english") {
    coloration = drawLegend([
      {min: 0.1, max: 0.2, color: "#edf8e9"},
      {max: 0.3, color: "#bae4b3"},
      {max: 0.4, color: "#74c476"},
      {max: 1.0, color: "#238b45"}
    ]);
  } else if (selection === "grandchildren") {
    coloration = drawLegend([
      {min: 10, max: 20, color: "#eff3ff"},
      {max: 30, color: "#bdd7e7"},
      {max: 40, color: "#6baed6"},
      {max: 10000000, color: "#2171b5"}
    ]);
  } else if (selection === "large_households") {
    coloration = drawLegend([
      {min: 0.1, max: 0.2, color: "#edf8e9"},
      {max: 0.3, color: "#bae4b3"},
      {max: 0.4, color: "#74c476"},
      {max: 1.0, color: "#238b45"}
    ]);
  } else if (selection === "poverty_percent") {
    coloration = drawLegend([
      {min: 0.08, max: 0.16, color: "#f2f0f7"},
      {max: 0.24, color: "#cbc9e2"},
      {max: 0.32, color: "#9e9ac8"},
      {max: 1.0, color: "#6a51a3"}
    ]);
  } else if (selection === "poverty_seniors_percent") {
    coloration = drawLegend([
      {min: 0.1, max: 0.2, color: "#eff3ff"},
      {max: 0.3, color: "#bdd7e7"},
      {max: 0.4, color: "#6baed6"},
      {max: 1.0, color: "#2171b5"}
    ]);
  } else if (selection === "poverty_kids") {
    coloration = drawLegend([
      {min: 100, max: 200, color: "#eff3ff"},
      {max: 300, color: "#bdd7e7"},
      {max: 400, color: "#6baed6"},
      {max: 10000000, color: "#2171b5"}
    ]);
  } else if (selection === "over_65") {
    coloration = drawLegend([
      {min: 0.1, max: 0.2, color: "#eff3ff"},
      {max: 0.3, color: "#bdd7e7"},
      {max: 0.4, color: "#6baed6"},
      {max: 1.0, color: "#2171b5"}
    ]);
  } else {
    coloration = drawLegend(null);
  }
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
              val = 0;
          if (selection === "english") {
            Object.keys(ma_data[id])
              .filter(key => key.includes("some_english") || key.includes("no_english"))
              .forEach(key => { val += ma_data[id][key] });
            val /= total_pop;
            return coloration(val);
          } else if (selection === "grandchildren") {
            val = ma_data[tract_id]["grandparent_grandchildren"];
            return coloration(val);
          } else if (selection === "large_households") {
            Object.keys(ma_data[id])
              .filter(key => key.includes("fam_6") || key.includes("fam_7"))
              .forEach(key => {
                val += key.includes("fam_6")
                  ? ma_data[id][key] * 6
                  : ma_data[id][key] * 7
              });
            val /= total_pop;
            return coloration(val);
          } else if (selection === "poverty_percent") {
            let tract_pop = ma_data[tract_id].total_pop;
            val = ma_data[tract_id]["poverty_total"] / tract_pop;
            return coloration(val);
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
              .forEach(key => { val += ma_data[tract_id][key] });
            val /= elder_sum;
            return coloration(val);
          } else if (selection === "poverty_kids") {
            Object.keys(ma_data[tract_id])
              .filter(key => key.includes("poverty_m_kids") || key.includes("poverty_f_kids"))
              .forEach(key => { val += ma_data[tract_id][key] });
            return coloration(val);
          } else if (selection === "over_65") {
            Object.keys(ma_data[id])
              .filter(key => key.includes("65_66") || key.includes("67_69")
                || key.includes("70_74")
                || key.includes("75_79")
                || key.includes("80_84")
                || key.includes("85_plus"))
              .forEach(key => { val += ma_data[id][key] });
            val /= total_pop;
            return coloration(val);
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
