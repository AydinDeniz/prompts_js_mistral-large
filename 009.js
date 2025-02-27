const d3 = require('d3');

function createBarChart(data, elementId) {
  const margin = { top: 20, right: 30, bottom: 40, left: 40 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select(`#${elementId}`)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  const x = d3.scaleBand()
    .domain(data.map(d => d.category))
    .range([0, width])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .nice()
    .range([height, 0]);

  svg.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(x));

  svg.append('g')
    .call(d3.axisLeft(y));

  svg.selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.category))
    .attr('y', d => y(d.value))
    .attr('width', x.bandwidth())
    .attr('height', d => height - y(d.value))
    .on('mouseover', function(event, d) {
      d3.select(this).attr('fill', 'orange');
      tooltip.transition().duration(200).style('opacity', 0.9);
      tooltip.html(`Category: ${d.category}<br>Value: ${d.value}`)
        .style('left', (event.pageX + 5) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this).attr('fill', 'steelblue');
      tooltip.transition().duration(500).style('opacity', 0);
    });

  const tooltip = d3.select(`#${elementId}`)
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);
}

// Example usage
const data = [
  { category: 'A', value: 30 },
  { category: 'B', value: 86 },
  { category: 'C', value: 120 },
  { category: 'D', value: 50 },
  { category: 'E', value: 90 }
];

createBarChart(data, 'chart');