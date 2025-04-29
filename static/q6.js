d3.json("/customer-data/").then(function(data) {
  data.forEach(d => {
    d.cluster = +d.cluster || 0;
    d.num_deals_purchases = +d.num_deals_purchases || 0;
    d.num_web_purchases = +d.num_web_purchases || 0;
    d.num_catalog_purchases = +d.num_catalog_purchases || 0;
    d.num_store_purchases = +d.num_store_purchases || 0;
    d.num_web_visits_month = +d.num_web_visits_month || 0;
  });

  const clusters = Array.from(new Set(data.map(d => d.cluster))).sort(d3.ascending);
  const fields = ['num_deals_purchases', 'num_web_purchases', 'num_catalog_purchases', 'num_store_purchases', 'num_web_visits_month'];

  const clusterData = d3.rollup(data,
    v => {
      const obj = {};
      fields.forEach(f => obj[f] = d3.mean(v, d => d[f]));
      return obj;
    },
    d => d.cluster
  );

  const formattedData = Array.from(clusterData, ([key, value]) => {
    value.cluster = key;
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
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("opacity", 0)
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "white")
    .style("padding", "5px")
    .style("border-radius", "5px");

  svg.selectAll("g.layer")
    .data(stackedData)
    .enter().append("g")
    .attr("class", "layer")
    .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(d => d)
    .enter().append("rect")
    .attr("x", d => x(d.data.cluster))
    .attr("y", d => y(d[1]))
    .attr("height", d => y(d[0]) - y(d[1]))
    .attr("width", x.bandwidth())
    .on("mouseover", function(event, d) {
      const field = d3.select(this.parentNode).datum().key;
      const value = (d[1] - d[0]).toFixed(1);
      tooltip.transition().duration(200).style("opacity", 0.95);
      tooltip.html(`Cluster: ${d.data.cluster}<br>${field}: ${value}`)
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

  // Title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Hành vi mua sắm trung bình theo cụm");

  // X axis
  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickFormat(d => `Cluster ${d}`));

  // Y axis
  svg.append("g")
    .call(d3.axisLeft(y));

  // Y axis label
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -50)
    .attr("x", -height / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .style("fill", "#555")
    .text("Giá trị trung bình");

  // Legend
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
      .text(field.replace('num_', '').replace('_purchases', '').replace('_month', ''))
      .style("font-size", "12px")
      .attr("alignment-baseline", "middle");
  });
});