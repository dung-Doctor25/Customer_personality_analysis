d3.json("/customer-data/").then(function(data) {
  data.forEach(d => {
    d.recency = +d.recency || 0;
    // Tính frequency từ tổng số lần mua
    d.frequency = (+d.num_deals_purchases || 0) + (+d.num_web_purchases || 0) + 
                  (+d.num_catalog_purchases || 0) + (+d.num_store_purchases || 0);
    // Tính monetary từ tổng chi tiêu
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

  // Đếm số lượng theo Segment
  const segmentCounts = d3.rollup(data, v => v.length, d => d.Segment);
  const segments = Array.from(segmentCounts.keys());
  const counts = Array.from(segmentCounts.values());

  const chartData = segments.map((seg, i) => ({ segment: seg, count: counts[i] }));

  const margin = { top: 40, right: 20, bottom: 70, left: 60 },
        width = 450 - margin.left - margin.right,
        height = 350 - margin.top - margin.bottom;

  const svg = d3.select("#segmentChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(chartData.map(d => d.segment))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(chartData, d => d.count)])
    .nice()
    .range([height, 0]);

  const color = d3.scaleOrdinal()
    .domain(segments)
    .range(d3.schemeSet2);

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("opacity", 0)
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "white")
    .style("padding", "5px")
    .style("border-radius", "5px");

  svg.selectAll("rect")
    .data(chartData)
    .enter()
    .append("rect")
    .attr("x", d => x(d.segment))
    .attr("y", d => y(d.count))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.count))
    .attr("fill", d => color(d.segment))
    .on("mouseover", function(event, d) {
      tooltip.transition().duration(200).style("opacity", 0.95);
      tooltip.html(`<strong>${d.segment}</strong><br>Số lượng: ${d.count}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 30) + "px");
    })
    .on("mousemove", function(event) {
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY - 30) + "px");
    })
    .on("mouseout", function() {
      tooltip.transition().duration(300).style("opacity", 0);
    });

  // Trục X
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(45)")
    .style("text-anchor", "start");

  // Trục Y
  svg.append("g")
    .call(d3.axisLeft(y));

  // Nhãn trục Y
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -50)
    .attr("x", -height / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .style("fill", "#555")
    .text("Số lượng khách hàng");

  // Tiêu đề
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Phân phối khách hàng theo phân khúc RFM");
});