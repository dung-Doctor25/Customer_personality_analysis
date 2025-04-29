const margin4 = { top: 40, right: 30, bottom: 70, left: 60 },
      totalWidth = 800,
      totalHeight = 350,
      chartWidth = (totalWidth - margin4.left - margin4.right) / 2,
      chartHeight = totalHeight - margin4.top - margin4.bottom;
console.log('q4')
const svg4 = d3.select("#q4")
  .append("svg")
  .attr("width", totalWidth + 50)
  .attr("height", totalHeight)
  .append("g")
  .attr("transform", `translate(${margin4.left},${margin4.top + 20})`);

const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("opacity", 0)
  .style("background", "rgba(0, 0, 0, 0.7)")
  .style("color", "white")
  .style("padding", "5px")
  .style("border-radius", "5px");

d3.json("/customer-data/").then(data => {
  const clusters = Array.from(new Set(data.map(d => d.cluster)));

  function prepareStackData(field) {
    const categories = Array.from(new Set(data.map(d => d[field]).filter(d => d != null)));
    const grouped = d3.group(data, d => d.cluster);
    return {
      keys: categories,
      data: Array.from(grouped, ([cluster, items]) => {
        const total = items.length;
        const counts = Object.fromEntries(categories.map(cat => [cat, 0]));
        items.forEach(d => {
          if (d[field] != null) counts[d[field]]++;
        });
        const percentages = {};
        categories.forEach(cat => {
          percentages[cat] = counts[cat] / total;
          percentages[cat + "_count"] = counts[cat];
        });
        return { cluster, total, ...percentages };
      })
    };
  }
  console.log(data)
  const xEdu = d3.scaleBand().domain(clusters).range([0, chartWidth]).padding(0.1);
  const yEdu = d3.scaleLinear().domain([0, 1]).range([chartHeight, 0]);
  const colorEdu = d3.scaleOrdinal().range(d3.schemeSet2);

  const xMar = d3.scaleBand().domain(clusters).range([0, chartWidth]).padding(0.1);
  const yMar = d3.scaleLinear().domain([0, 1]).range([chartHeight, 0]);
  const colorMar = d3.scaleOrdinal().range(d3.schemeSet3);

  // === Education Chart ===
  const eduData = prepareStackData("education");
  colorEdu.domain(eduData.keys);
  
  const stackEdu = d3.stack().keys(eduData.keys)(eduData.data);

  const eduGroup = svg4.append("g").attr("transform", `translate(0, 0)`);

  // Add title for Education chart
  eduGroup.append("text")
    .attr("x", chartWidth / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Phân bổ theo Education");

  // Draw bars
  const eduBars = eduGroup.selectAll(".eduBars")
    .data(stackEdu)
    .enter().append("g")
    .attr("class", "eduBars")
    .attr("fill", d => colorEdu(d.key));

  eduBars.selectAll("rect")
    .data(d => d)
    .enter().append("rect")
    .attr("x", d => xEdu(d.data.cluster))
    .attr("y", d => yEdu(d[1]))
    .attr("height", d => yEdu(d[0]) - yEdu(d[1]))
    .attr("width", xEdu.bandwidth())
    .on("mouseover", (event, d) => {
      const key = d3.select(event.target.parentNode).datum().key;
      tooltip.transition().duration(200).style("opacity", 0.95);
      tooltip.html(`<strong>Cluster:</strong> ${d.data.cluster}<br>
                    <strong>Education:</strong> ${key}<br>
                    <strong>Count:</strong> ${d.data[key + "_count"]}<br>
                    <strong>Percentage:</strong> ${(d.data[key] * 100).toFixed(1)}%`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mousemove", event => tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 28) + "px"))
    .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0));

  // Add labels to show category and percentage
  eduBars.selectAll("text")
    .data(d => d.map(item => ({
      x: xEdu(item.data.cluster) + xEdu.bandwidth() / 2,
      y: (yEdu(item[0]) + yEdu(item[1])) / 2,
      height: yEdu(item[0]) - yEdu(item[1]),
      percentage: (item.data[d.key] * 100).toFixed(1),
      count: item.data[d.key + "_count"],
      category: d.key
    })))
    .enter().append("text")
    .attr("x", d => d.x)
    .attr("y", d => d.y)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .style("fill", "black")
    .style("font-size", "10px")
    .style("pointer-events", "none")
    .style("opacity", d => d.height < 25 ? 0 : 1)
    .text(d => `${d.category}: ${d.count} (${d.percentage}%)`);

  // X axis for Education
  eduGroup.append("g")
    .attr("transform", `translate(0, ${chartHeight})`)
    .call(d3.axisBottom(xEdu).tickFormat(d => `Cluster ${d}`));

  // Y axis for Education
  eduGroup.append("g")
    .call(d3.axisLeft(yEdu).tickFormat(d3.format(".0%")));

  // // Y axis label for Education
  // eduGroup.append("text")
  //   .attr("transform", "rotate(-90)")
  //   .attr("y", -50)
  //   .attr("x", -chartHeight / 2)
  //   .attr("dy", "1em")
  //   .style("text-anchor", "middle")
  //   .style("font-weight", "bold")
  //   .style("fill", "#555")
  //   .text("Tỉ lệ (%)");

  // === Marital Status Chart ===
  const marData = prepareStackData("marital_status");
  colorMar.domain(marData.keys);
  const stackMar = d3.stack().keys(marData.keys)(marData.data);

  const marGroup = svg4.append("g").attr("transform", `translate(${chartWidth + 50}, 0)`);

  // Add title for Marital Status chart
  marGroup.append("text")
    .attr("x", chartWidth / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Phân bổ theo Marital Status");

  // Draw bars
  const marBars = marGroup.selectAll(".marBars")
    .data(stackMar)
    .enter().append("g")
    .attr("class", "marBars")
    .attr("fill", d => colorMar(d.key));

  marBars.selectAll("rect")
    .data(d => d)
    .enter().append("rect")
    .attr("x", d => xMar(d.data.cluster))
    .attr("y", d => yMar(d[1]))
    .attr("height", d => yMar(d[0]) - yMar(d[1]))
    .attr("width", xMar.bandwidth())
    .on("mouseover", (event, d) => {
      const key = d3.select(event.target.parentNode).datum().key;
      tooltip.transition().duration(200).style("opacity", 0.95);
      tooltip.html(`<strong>Cluster:</strong> ${d.data.cluster}<br>
                    <strong>Marital Status:</strong> ${key}<br>
                    <strong>Count:</strong> ${d.data[key + "_count"]}<br>
                    <strong>Percentage:</strong> ${(d.data[key] * 100).toFixed(1)}%`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mousemove", event => tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 28) + "px"))
    .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0));

  // Add labels to show category and percentage
  marBars.selectAll("text")
    .data(d => d.map(item => ({
      x: xMar(item.data.cluster) + xMar.bandwidth() / 2,
      y: (yMar(item[0]) + yMar(item[1])) / 2,
      height: yMar(item[0]) - yMar(item[1]),
      percentage: (item.data[d.key] * 100).toFixed(1),
      count: item.data[d.key + "_count"],
      category: d.key
    })))
    .enter().append("text")
    .attr("x", d => d.x)
    .attr("y", d => d.y)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .style("fill", "black")
    .style("font-size", "10px")
    .style("pointer-events", "none")
    .style("opacity", d => d.height < 25 ? 0 : 1)
    .text(d => `${d.category}: ${d.count} (${d.percentage}%)`);

  // X axis for Marital Status
  marGroup.append("g")
    .attr("transform", `translate(0, ${chartHeight})`)
    .call(d3.axisBottom(xMar).tickFormat(d => `Cluster ${d}`));

  // Y axis for Marital Status
  marGroup.append("g")
    .call(d3.axisLeft(yMar).tickFormat(d3.format(".0%")));

  // // Y axis label for Marital Status
  // marGroup.append("text")
  //   .attr("transform", "rotate(-90)")
  //   .attr("y", -50)
  //   .attr("x", -chartHeight / 2)
  //   .attr("dy", "1em")
  //   .style("text-anchor", "middle")
  //   .style("font-weight", "bold")
  //   .style("fill", "#555")
  //   .text("Tỉ lệ (%)");
});