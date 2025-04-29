d3.csv("data/rfm_with_clusters.csv").then(function(data) {
  data.forEach(d => {
    d.Cluster = +d.Cluster;
    d.Kidhome = +d.Kidhome;
    d.Teenhome = +d.Teenhome;
  });

  const color = d3.scaleOrdinal(d3.schemeSet2);
  const categories = [0, 1, 2];
  const clusters = [0, 1, 2];

  function getValueCounts(data, field) {
    const result = {};
    clusters.forEach(cluster => {
      result[cluster] = { 0: 0, 1: 0, 2: 0 };
    });
    data.forEach(d => {
      if (clusters.includes(d.Cluster)) {
        result[d.Cluster][d[field]]++;
      }
    });
    return result;
  }

  const kidData = getValueCounts(data, 'Kidhome');
  const teenData = getValueCounts(data, 'Teenhome');

  function drawPiePerCluster(containerId, fullData, titleText) {
    const width = 250, height = 250, radius = 100;

    const container = d3.select(containerId);
    container.append("h3").text(titleText);

    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    clusters.forEach(cluster => {
      const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("margin", "10px");

      const g = svg.append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

      const pie = d3.pie().value(d => d.value);
      const arc = d3.arc().innerRadius(0).outerRadius(radius);

      const pieData = categories.map(cat => ({
        category: cat,
        value: fullData[cluster][cat]
      }));

      const arcs = g.selectAll(".arc")
        .data(pie(pieData))
        .enter().append("g")
        .attr("class", "arc");

      arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.category))
        .on("mouseover", (event, d) => {
          tooltip.transition().duration(200).style("opacity", 1);
          tooltip.html(`Cluster ${cluster} - Kid/Teen = ${d.data.category}<br>Số lượng: ${d.data.value}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mousemove", (event) => {
          tooltip.style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0));

      arcs.append("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .text(d => `${d.data.category} (${Math.round(d.data.value / d3.sum(pieData, d => d.value) * 100)}%)`);

      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text(`Cluster ${cluster}`);
    });
  }

  drawPiePerCluster("#kidPieContainer", kidData);
  drawPiePerCluster("#teenPieContainer", teenData);
});
