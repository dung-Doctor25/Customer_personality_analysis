d3.json("/customer-data/").then(function(data) {
  data.forEach(d => {
    d.cluster = +d.cluster || 0;
    d.kidhome = +d.kidhome || 0;
    d.teenhome = +d.teenhome || 0;
  });

  const color = d3.scaleOrdinal(d3.schemeSet2);
  const clusters = [...new Set(data.map(d => d.cluster))];
  const categories = Array.from(new Set([...data.map(d => d.kidhome), ...data.map(d => d.teenhome)])).filter(d => d != null);

  function getValueCounts(data, field) {
    const result = {};
    clusters.forEach(cluster => {
      result[cluster] = Object.fromEntries(categories.map(cat => [cat, 0]));
    });
    data.forEach(d => {
      if (clusters.includes(d.cluster) && d[field] != null) {
        result[d.cluster][d[field]]++;
      }
    });
    return result;
  }

  const kidData = getValueCounts(data, 'kidhome');
  const teenData = getValueCounts(data, 'teenhome');

  function drawPiePerCluster(containerId, fullData, titleText, fieldLabel) {
    const width = 250, height = 250, radius = 100;

    const container = d3.select(containerId);
    container.append("h3").text(titleText);

    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("opacity", 0)
      .style("background", "rgba(0, 0, 0, 0.7)")
      .style("color", "white")
      .style("padding", "5px")
      .style("border-radius", "5px");

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
          tooltip.transition().duration(200).style("opacity", 0.95);
          tooltip.html(`Cluster ${cluster}<br>${fieldLabel}: ${d.data.category}<br>Số lượng: ${d.data.value}`)
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
        .text(d => d.data.value > 0 ? `${d.data.category} (${Math.round(d.data.value / d3.sum(pieData, d => d.value) * 100)}%)` : "");

      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text(`Cluster ${cluster}`);
    });
  }

  drawPiePerCluster("#kidPieContainer", kidData, "Phân bổ số trẻ nhỏ theo cụm", "Số trẻ nhỏ");
  drawPiePerCluster("#teenPieContainer", teenData, "Phân bổ số thanh thiếu niên theo cụm", "Số thanh thiếu niên");
});