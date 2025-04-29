d3.csv("data/rfm_with_clusters.csv").then(function(data) {
  data.forEach(d => {
    d.Cluster = +d.Cluster;
    d.NumDealsPurchases = +d.NumDealsPurchases;
    d.NumWebPurchases = +d.NumWebPurchases;
    d.NumCatalogPurchases = +d.NumCatalogPurchases;
    d.NumStorePurchases = +d.NumStorePurchases;
    d.NumWebVisitsMonth = +d.NumWebVisitsMonth;
  });

  const clusters = Array.from(new Set(data.map(d => d.Cluster))).sort(d3.ascending);
  const fields = ['NumDealsPurchases', 'NumWebPurchases', 'NumCatalogPurchases', 'NumStorePurchases', 'NumWebVisitsMonth'];

  const clusterData = d3.rollup(data,
    v => {
      const obj = {};
      fields.forEach(f => obj[f] = d3.mean(v, d => d[f]));
      return obj;
    },
    d => d.Cluster
  );

  const formattedData = Array.from(clusterData, ([key, value]) => {
    value.Cluster = key;
    return value;
  });

  const stack = d3.stack().keys(fields);
  const stackedData = stack(formattedData);

  const margin = { top: 50, right: 150, bottom: 50, left: 60 },
        width = 550 - margin.left - margin.right,
        height = 350 - margin.top - margin.bottom;

  const svg = d3.select("#stackedBar")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left - 10}, ${margin.top - 30})`);

  const x = d3.scaleBand()
    .domain(clusters)
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(stackedData[stackedData.length - 1], d => d[1])])
    .nice()
    .range([height, 0]);

  const color = d3.scaleOrdinal()
    .domain(fields)
    .range(d3.schemeSet2);

  const tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("background", "#f9f9f9")
    .style("padding", "5px 10px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "5px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  svg.selectAll("g.layer")
    .data(stackedData)
    .enter().append("g")
    .attr("class", "layer")
    .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(d => d)
    .enter().append("rect")
    .attr("x", d => x(d.data.Cluster))
    .attr("y", d => y(d[1]))
    .attr("height", d => y(d[0]) - y(d[1]))
    .attr("width", x.bandwidth())
    .on("mouseover", function(event, d) {
      const value = (d[1] - d[0]).toFixed(1);
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`Giá trị: ${value}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 25) + "px");
    })
    .on("mousemove", function(event) {
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY - 25) + "px");
    })
    .on("mouseout", function() {
      tooltip.transition().duration(300).style("opacity", 0);
    });

  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickFormat(d => "Cluster " + d));

  svg.append("g")
    .call(d3.axisLeft(y));

  // Legend (góc trên bên phải)
  const legend = svg.append("g")
    .attr("transform", `translate(${width - 90}, 0)`);

  fields.forEach((field, i) => {
    const legendRow = legend.append("g")
      .attr("transform", `translate(0, ${i * 20})`);

    legendRow.append("rect")
      .attr("width", 8)
      .attr("height", 8)
      .attr("fill", color(field));

    legendRow.append("text")
      .attr("x", 15)
      .attr("y", 8)
      .text(field)
      .style("font-size", "12px")
      .attr("alignment-baseline", "middle");
  });
});