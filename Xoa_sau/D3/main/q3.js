d3.csv("data/rfm_with_clusters.csv").then(data => {
  const mntCols = ['MntWines', 'MntFruits', 'MntMeatProducts', 'MntFishProducts', 'MntSweetProducts', 'MntGoldProds'];

  // Gom dữ liệu theo Cluster
  const nestedData = d3.group(data, d => d.Cluster);
  
  const clusterMeans = Array.from(nestedData, ([cluster, values]) => {
    const means = {};
    mntCols.forEach(col => {
      means[col] = d3.mean(values, v => +v[col]);
    });
    return { cluster, ...means };
  });

  // Chuyển đổi sang định dạng grouped bar chart
  const groupedData = mntCols.map(category => ({
    category,
    values: clusterMeans.map(d => ({
      cluster: `Cluster ${d.cluster}`,
      value: d[category]
    }))
  }));

  // Tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("opacity", 0)
    .style("background-color", "rgba(0, 0, 0, 0.7)")
    .style("color", "white")
    .style("padding", "5px")
    .style("border-radius", "5px");

  function drawGroupedBarChart(svgId, data) {
    const svg = d3.select(svgId),
          margin = { top: 30, right: 30, bottom: 60, left: 60 },
          width = +svg.attr("width") - margin.left - margin.right,
          height = +svg.attr("height") - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x0 = d3.scaleBand()
      .domain(data.map(d => d.category))
      .range([0, width])
      .paddingInner(0.2);

    const x1 = d3.scaleBand()
      .domain(data[0].values.map(d => d.cluster))
      .range([0, x0.bandwidth()])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d3.max(d.values, v => v.value))])
      .nice()
      .range([height, 0]);

    const color = d3.scaleOrdinal()
      .domain(data[0].values.map(d => d.cluster))
      .range(d3.schemeSet2);

    g.append("g")
      .selectAll("g")
      .data(data)
      .join("g")
        .attr("transform", d => `translate(${x0(d.category)},0)`)
      .selectAll("rect")
      .data(d => d.values)
      .join("rect")
        .attr("x", d => x1(d.cluster))
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.value))
        .attr("fill", d => color(d.cluster))
        .on("mouseover", (event, d) => {
          tooltip.transition().duration(200).style("opacity", 0.95);
          tooltip.html(`${d.cluster}<br>${d.value.toFixed(2)} triệu`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 30) + "px");
        })
        .on("mouseout", () => {
          tooltip.transition().duration(300).style("opacity", 0);
        });

    // Trục
    g.append("g").call(d3.axisLeft(y));
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0))
      .selectAll("text")
        .attr("transform", "rotate(-20)")
        .style("text-anchor", "end");

    // Legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 100},20)`);
    
    data[0].values.forEach((d, i) => {
      legend.append("rect")
        .attr("x", 0).attr("y", i * 20)
        .attr("width", 12).attr("height", 12)
        .attr("fill", color(d.cluster));

      legend.append("text")
        .attr("x", 18).attr("y", i * 20 + 10)
        .text(d.cluster)
        .style("font-size", "12px");
    });
    // Title
  // g.append("text")
  // .attr("x", width1 / 2)
  // .attr("y", -10)
  // .attr("text-anchor", "middle")
  // .style("font-size", "16px")
  // .text("Chi tiêu theo Cluster");

    // Label Y
    g.append("text")
      .attr("x", -40)
      .attr("y", -10)
      .style("font-weight", "bold")
      .style("fill", "#555");
  }

  drawGroupedBarChart("#chitieuChart", groupedData);
});
