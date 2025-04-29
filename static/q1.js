const margin1 = { top: 40, right: 30, bottom: 70, left: 60 },
      width1 = 800 - margin1.left - margin1.right,
      height1 = 500 - margin1.top - margin1.bottom;

const svg1 = d3.select("#q1")
    .append("svg") // Thêm append("svg") để tạo thẻ SVG
    .attr("width", width1 + margin1.left + margin1.right)
    .attr("height", height1 + margin1.top + margin1.bottom)
  .append("g")
    .attr("transform", `translate(${margin1.left},${margin1.top})`);

d3.json("/customer-data/").then(rawData => {
  // Tính frequency và monetary
  const data = [];
  rawData.forEach(row => {
    const frequency = (+row.num_deals_purchases || 0) + (+row.num_web_purchases || 0) + 
                     (+row.num_catalog_purchases || 0) + (+row.num_store_purchases || 0);
    const monetary = (+row.mnt_wines || 0) + (+row.mnt_fruits || 0) + (+row.mnt_meat_products || 0) + 
                    (+row.mnt_fish_products || 0) + (+row.mnt_sweet_products || 0) + (+row.mnt_gold_prods || 0);
    data.push({ cluster: +row.cluster, RFM_Metric: "Recency", Value: +row.recency || 0 });
    data.push({ cluster: +row.cluster, RFM_Metric: "Frequency", Value: frequency });
    data.push({ cluster: +row.cluster, RFM_Metric: "Monetary", Value: monetary });
  });

  // Tính giá trị trung bình của mỗi RFM Metric trong từng cụm
  const meanByCluster = d3.rollup(
    data,
    v => ({
      Recency: d3.mean(v.filter(d => d.RFM_Metric === "Recency"), d => d.Value),
      Frequency: d3.mean(v.filter(d => d.RFM_Metric === "Frequency"), d => d.Value),
      Monetary: d3.mean(v.filter(d => d.RFM_Metric === "Monetary"), d => d.Value)
    }),
    d => d.cluster
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
    .call(d3.axisBottom(x0).tickFormat(d => `Cluster ${d}`));

  // Nhãn trục Y
  svg1.append("text")
    .attr("x", -40)
    .attr("y", -10)
    .text("Giá trị trung bình")
    .style("font-weight", "bold")
    .style("fill", "#555");

  // Tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "white")
    .style("padding", "5px 10px")
    .style("border-radius", "5px")
    .style("opacity", 0);

  // Bars
  svg1.selectAll("g.bar-group")
    .data(Array.from(meanByCluster))
    .join("g")
      .attr("transform", d => `translate(${x0(d[0])},0)`)
    .selectAll("rect")
    .data(d => [
        { cluster: d[0], RFM_Metric: "Recency", Value: d[1].Recency },
        { cluster: d[0], RFM_Metric: "Frequency", Value: d[1].Frequency },
        { cluster: d[0], RFM_Metric: "Monetary", Value: d[1].Monetary }
      ])      
    .join("rect")
      .attr("x", d => x1(d.RFM_Metric))
      .attr("y", d => y(d.Value))
      .attr("width", x1.bandwidth())
      .attr("height", d => height1 - y(d.Value))
      .attr("fill", d => color(d.RFM_Metric))
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`<strong>Cluster:</strong> ${d.cluster}<br><strong>${d.RFM_Metric}:</strong> ${d.Value.toFixed(2)}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", (event) => {
        tooltip.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(300).style("opacity", 0);
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