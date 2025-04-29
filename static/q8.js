d3.json("/customer-data/").then(data => {
  if (!data || data.length === 0) {
    d3.select("#q8")
      .append("svg")
      .attr("width", 450)
      .attr("height", 350)
      .append("text")
      .attr("x", 225)
      .attr("y", 175)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text("Không có dữ liệu để hiển thị");
    return;
  }

  data.forEach(d => {
    d.cluster = +d.cluster || 0;
    d.recency = +d.recency || 0;
    d.frequency = (+d.num_deals_purchases || 0) + (+d.num_web_purchases || 0) + 
                  (+d.num_catalog_purchases || 0) + (+d.num_store_purchases || 0);
    d.monetary = (+d.mnt_wines || 0) + (+d.mnt_fruits || 0) + (+d.mnt_meat_products || 0) + 
                 (+d.mnt_fish_products || 0) + (+d.mnt_sweet_products || 0) + (+d.mnt_gold_prods || 0);
  });

  function assignQuantileScore(arr, reverse = false) {
    const sorted = [...arr].sort((a, b) => a - b);
    const quantile = v => {
      const i = d3.bisect(sorted, v);
      return Math.floor(i / (arr.length / 5)) + 1;
    };
    return arr.map(v => {
      const q = quantile(v);
      return reverse ? 6 - Math.min(5, q) : Math.min(5, q);
    });
  }

  const recencyScores = assignQuantileScore(data.map(d => d.recency), true);
  const frequencyScores = assignQuantileScore(data.map(d => d.frequency));
  const monetaryScores = assignQuantileScore(data.map(d => d.monetary));

  data.forEach((d, i) => {
    d.R = recencyScores[i];
    d.F = frequencyScores[i];
    d.M = monetaryScores[i];
    const { R, F, M } = d;
    if (R >= 4 && F >= 4 && M >= 4) d.Segment = "Champions";
    else if (R >= 3 && F >= 3 && M >= 3) d.Segment = "Loyal";
    else if (R >= 3 && F >= 2) d.Segment = "Potential Loyalists";
    else if (R >= 2 && F >= 2) d.Segment = "Needs Attention";
    else if (R >= 1 && F >= 1) d.Segment = "At Risk";
    else if (R <= 2 && F <= 2) d.Segment = "Hibernating";
    else d.Segment = "Promising";
  });

  const segmentOrder = [
    "Champions", "Loyal", "Potential Loyalists", "Promising",
    "Needs Attention", "At Risk", "Hibernating"
  ];
  const segments = Array.from(new Set(data.map(d => d.Segment)))
    .sort((a, b) => segmentOrder.indexOf(a) - segmentOrder.indexOf(b));
  const clusters = Array.from(new Set(data.map(d => d.cluster))).sort(d3.ascending);

  const matrix = Array.from(
    d3.group(data, d => d.cluster, d => d.Segment),
    ([cluster, segmentMap]) => {
      return segments.map(segment => ({
        cluster,
        segment,
        value: segmentMap.get(segment)?.length || 0
      }));
    }
  ).flat();

  const margin8 = { top: 50, right: 30, bottom: 50, left: 100 },
        width8 = 450 - margin8.left - margin8.right,
        height8 = 350 - margin8.top - margin8.bottom;

  const svg8 = d3.select("#q8")
    .append("svg")
    .attr("width", width8 + margin8.left + margin8.right)
    .attr("height", height8 + margin8.top + margin8.bottom)
    .append("g")
    .attr("transform", `translate(${margin8.left - 30},${margin8.top - 20})`);

  const tooltip = d3.select(".tooltip") || d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("opacity", 0)
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "white")
    .style("padding", "5px")
    .style("border-radius", "5px");

  const x = d3.scaleBand().domain(segments).range([0, width8]).padding(0.05);
  const y = d3.scaleBand().domain(clusters).range([0, height8]).padding(0.05);
  const color = d3.scaleSequential(d3.interpolateYlGnBu)
    .domain([0, d3.max(matrix, d => d.value)]);

  svg8.selectAll("rect")
    .data(matrix)
    .join("rect")
    .attr("x", d => x(d.segment))
    .attr("y", d => y(d.cluster))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("fill", d => color(d.value))
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 0.95);
      tooltip.html(`<strong>Cluster:</strong> ${d.cluster}<br>
                    <strong>Segment:</strong> ${d.segment}<br>
                    <strong>Số lượng:</strong> ${d.value}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0));

  // Nhãn số trên mỗi ô
  svg8.selectAll("text.label")
    .data(matrix)
    .join("text")
    .attr("class", "label")
    .attr("x", d => x(d.segment) + x.bandwidth() / 2)
    .attr("y", d => y(d.cluster) + y.bandwidth() / 2)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .style("fill", d => d.value > d3.max(matrix, d => d.value) / 2 ? "white" : "black")
    .style("font-size", "12px")
    .text(d => d.value > 0 ? d.value : "");

  // Trục Y
  svg8.append("g")
    .call(d3.axisLeft(y).tickFormat(d => `Cluster ${d}`));

  // Trục X
  svg8.append("g")
    .attr("transform", `translate(0,${height8})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(45)")
    .style("text-anchor", "start");

  // Tiêu đề
  svg8.append("text")
    .attr("x", width8 / 2)
    .attr("y", -15)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Phân khúc khách hàng trong các cụm");

  // Nhãn trục X
  svg8.append("text")
    .attr("x", width8 / 2)
    .attr("y", height8 + 40)
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .style("fill", "#555")
    .text("Phân khúc RFM");

  // Nhãn trục Y
  svg8.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -70)
    .attr("x", -height8 / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .style("fill", "#555")
    .text("Cụm");
});
