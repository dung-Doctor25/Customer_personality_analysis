const margin1 = { top: 40, right: 30, bottom: 70, left: 60 },
    width1 = 800 - margin1.left - margin1.right,
    height1 = 500 - margin1.top - margin1.bottom;

const svg1 = d3.select("#q1")
    .attr("width", width1 + margin1.left + margin1.right)
    .attr("height", height1 + margin1.top + margin1.bottom)
  .append("g")
    .attr("transform", `translate(${margin1.left},${margin1.top})`);

d3.csv("data/rfm_with_clusters.csv").then(rawData => {
  // Chuyển từ dạng wide -> long format
  const data = [];
  rawData.forEach(row => {
    data.push({ Cluster: row.Cluster, RFM_Metric: "Recency", Value: +row.Recency });
    data.push({ Cluster: row.Cluster, RFM_Metric: "Frequency", Value: +row.Frequency });
    data.push({ Cluster: row.Cluster, RFM_Metric: "Monetary", Value: +row.Monetary });
  });

  // Tính giá trị trung bình của mỗi RFM Metric trong từng cụm
  const meanByCluster = d3.rollup(
    data,
    v => ({
      Recency: d3.mean(v.filter(d => d.RFM_Metric === "Recency"), d => d.Value),
      Frequency: d3.mean(v.filter(d => d.RFM_Metric === "Frequency"), d => d.Value),
      Monetary: d3.mean(v.filter(d => d.RFM_Metric === "Monetary"), d => d.Value)
    }),
    d => d.Cluster
  );

  const x0 = d3.scaleBand()
    .domain([...meanByCluster.keys()])
    .range([0, width1])
    .padding(0.2);

  const x1 = d3.scaleBand()
    .domain(["Recency", "Frequency", "Monetary"])
    .range([0, x0.bandwidth()])
    .padding(0.05);

  const y = d3.scaleLinear()
    .domain([0, d3.max(Array.from(meanByCluster.values()), d => Math.max(d.Recency, d.Frequency, d.Monetary))]).nice()
    .range([height1, 0]);

  const color = d3.scaleOrdinal()
    .domain(["Recency", "Frequency", "Monetary"])
    .range(d3.schemeSet2);

  // Axes
  svg1.append("g")
    .call(d3.axisLeft(y));

  svg1.append("g")
    .attr("transform", `translate(0,${height1})`)
    .call(d3.axisBottom(x0));

  // Title
  // svg1.append("text")
  //   .attr("x", width1 / 2)
  //   .attr("y", -10)
  //   .attr("text-anchor", "middle")
  //   .style("font-size", "16px")
  //   .text("Trung bình RFM của mỗi cụm");

  const tooltip1 = d3.select("#tooltip1");

  // Bars
  svg1.selectAll("g.bar-group")
    .data(Array.from(meanByCluster))
    .join("g")
      .attr("transform", d => `translate(${x0(d[0])},0)`)
    .selectAll("rect")
    .data(d => [
        { Cluster: d[0], RFM_Metric: "Recency", Value: d[1].Recency },
        { Cluster: d[0], RFM_Metric: "Frequency", Value: d[1].Frequency },
        { Cluster: d[0], RFM_Metric: "Monetary", Value: d[1].Monetary }
      ])      
    .join("rect")
      .attr("x", d => x1(d.RFM_Metric))
      .attr("y", d => y(d.Value))
      .attr("width", x1.bandwidth())
      .attr("height", d => height1 - y(d.Value))
      .attr("fill", d => color(d.RFM_Metric))
      .on("mouseover", (event, d) => {
        tooltip1
          .style("opacity", 1)
          .html(`
            <strong>Cluster:</strong> ${d.Cluster}<br>
            <strong>${d.RFM_Metric}:</strong> ${d.Value.toFixed(2)}
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", (event) => {
        tooltip1
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltip1.style("opacity", 0);
      });

  // Legend
  const legend = svg1.selectAll(".legend")
    .data(color.domain())
    .join("g")
      .attr("transform", (d, i) => `translate(${i * 120}, ${height1 + 20})`);

  legend.append("rect")
    .attr("x", 0)
    .attr("width", 12)
    .attr("height", 12)
    .attr("fill", color);

  legend.append("text")
    .attr("x", 18)
    .attr("y", 10)
    .text(d => d);
});
