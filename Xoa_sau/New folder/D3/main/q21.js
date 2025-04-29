d3.csv("data/rfm_with_clusters.csv").then(rawData => {
  const data = rawData.map(d => ({
    Cluster: +d.Cluster,
    Age: 2025 - +d.Year_Birth,
    Income: +d.Income
  }));

  const clusters = d3.group(data, d => d.Cluster);
  const summary = Array.from(clusters, ([cluster, values]) => ({
    Cluster: cluster,
    Age_mean: d3.mean(values, d => d.Age),
    Income_mean: d3.mean(values, d => d.Income)
  }));

  // Tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip");

  function drawBarChart(svgId, measureKey, color, yLabel, suffix = '') {
    const svg = d3.select(svgId),
          margin = { top: 30, right: 20, bottom: 50, left: 60 },
          width = +svg.attr("width") - margin.left - margin.right,
          height = +svg.attr("height") - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(summary.map(d => d.Cluster))
      .range([0, width])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(summary, d => d[measureKey])])
      .nice()
      .range([height, 0]);

    g.selectAll("rect")
      .data(summary)
      .join("rect")
        .attr("x", d => x(d.Cluster))
        .attr("y", d => y(d[measureKey]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d[measureKey]))
        .attr("fill", color)
        .on("mouseover", (event, d) => {
          tooltip.transition().duration(200).style("opacity", 0.95);
          tooltip.html(`${yLabel}: <strong>${d[measureKey].toFixed(2)}${suffix}</strong><br/>Cluster: ${d.Cluster}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 30) + "px");
        })
        .on("mouseout", () => {
          tooltip.transition().duration(300).style("opacity", 0);
        });

    // Label values
    g.selectAll(".label")
      .data(summary)
      .join("text")
        .attr("x", d => x(d.Cluster) + x.bandwidth() / 2)
        .attr("y", d => y(d[measureKey]) - 5)
        .attr("text-anchor", "middle")
        .text(d => d[measureKey].toFixed(1))
        .style("fill", "#333")
        .style("font-size", "11px");

    g.append("g").call(d3.axisLeft(y));

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d => "Cluster " + d));

    // Y-axis label (optional)
    g.append("text")
      .attr("x", -40)
      .attr("y", -10)
      .text(yLabel)
      .style("font-weight", "bold")
      .style("fill", "#555");
      
    g.append("text")
     .attr("x", width1 / 5)
     .attr("y", -15)
     .attr("text-anchor", "middle")
     .style("font-size", "16px")
     .text("Tuổi trung bình theo Cluster");
  }

  drawBarChart("#ageChart", "Age_mean", "steelblue");
});
