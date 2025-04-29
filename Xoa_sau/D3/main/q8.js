const margin8 = { top: 50, right: 30, bottom: 50, left: 100 },
      width8 = 450 - margin8.left - margin8.right,
      height8 = 350 - margin8.top - margin8.bottom;

const svg8 = d3.select("#q8")
  .attr("width", width8 + margin8.left + margin8.right)
  .attr("height", height8 + margin8.top + margin8.bottom)
  .append("g")
  .attr("transform", `translate(${margin8.left - 30},${margin8.top - 20})`);

const tooltip8 = d3.select("#tooltip8")
  .style("position", "absolute")
  .style("opacity", 0)
  .style("background", "#fff")
  .style("border", "1px solid #ccc")
  .style("padding", "8px");

d3.csv("data/rfm_with_clusters.csv", d3.autoType).then(data => {
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

  const recencyScores = assignQuantileScore(data.map(d => d.Recency), true);
  const frequencyScores = assignQuantileScore(data.map(d => d.Frequency));
  const monetaryScores = assignQuantileScore(data.map(d => d.Monetary));

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

  const segments = Array.from(new Set(data.map(d => d.Segment)));
  const clusters = Array.from(new Set(data.map(d => d.Cluster)));

  const matrix = [];
  clusters.forEach(cluster => {
    segments.forEach(segment => {
      const count = data.filter(d => d.Cluster === cluster && d.Segment === segment).length;
      matrix.push({ cluster, segment, value: count });
    });
  });

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
      tooltip8
        .style("opacity", 1)
        .html(`
          <strong>Cluster:</strong> ${d.cluster}<br>
          <strong>Segment:</strong> ${d.segment}<br>
          <strong>Value:</strong> ${d.value.toFixed(2)}
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mousemove", (event) => {
      tooltip8
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => tooltip8.style("opacity", 0));
    // 🆕 Thêm nhãn số lên mỗi ô
    svg8.selectAll("text")
    .data(matrix)
    .join("text")
    .attr("x", d => x(d.segment) + x.bandwidth() / 2)
    .attr("y", d => y(d.cluster) + y.bandwidth() / 2)
    .attr("text-anchor", "middle")
    
    .attr("dominant-baseline", "middle")
    .style("fill", d => d.value > d3.max(matrix, d => d.value) / 2 ? "white" : "black")
    .style("font-size", "12px")
    .text(d => d.value);

  svg8.append("g").call(d3.axisLeft(y));
  svg8.append("g")
    .attr("transform", `translate(0,${height8})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(45)")
    .style("text-anchor", "start");
  svg8.append("text")
    .attr("x", width1 / 5)
    .attr("y", -15)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Phân khúc khách hàng trong Cluster")
});
