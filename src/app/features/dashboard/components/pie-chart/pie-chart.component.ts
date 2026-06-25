import { Component, ElementRef, input, viewChild, effect } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  template: '<div #chartContainer class="w-full h-full flex items-center justify-center"></div>',
  host: { 'class': 'block w-full h-full' }
})
export class PieChartComponent {
  chartContainer = viewChild<ElementRef>('chartContainer');
  data = input<{ option: string; count: number }[]>([]);

  constructor() {
    effect(() => {
      const currentData = this.data();
      const container = this.chartContainer();
      if (container && currentData && currentData.length > 0) {
        this.createChart(currentData, container.nativeElement);
      }
    });
  }

  private createChart(chartData: { option: string; count: number }[], element: any): void {
    d3.select(element).selectAll('*').remove();

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal<string>()
      .domain(chartData.map(d => d.option))
      .range(['#4f46e5', '#60a5fa', '#3b82f6', '#93c5fd', '#1d4ed8']);

    const pie = d3.pie<{ option: string; count: number }>()
      .value(d => d.count)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<{ option: string; count: number }>>()
      .innerRadius(radius * 0.5) // Donut chart
      .outerRadius(radius * 0.8)
      .cornerRadius(4)
      .padAngle(0.02);

    const outerArc = d3.arc<d3.PieArcDatum<{ option: string; count: number }>>()
      .innerRadius(radius * 0.9)
      .outerRadius(radius * 0.9);

    const arcs = svg.selectAll('arc')
      .data(pie(chartData))
      .enter()
      .append('g')
      .attr('class', 'arc');

    // Draw Paths
    arcs.append('path')
      .attr('fill', d => color(d.data.option))
      .attr('d', arc)
      .attr('stroke', '#1e293b') // Match surface bg color
      .style('stroke-width', '2px')
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .style('opacity', 1)
      .attrTween('d', function(d) {
        const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function(t) { return arc(i(t)) as string; };
      });

    // Add Labels
    arcs.append('text')
      .attr('transform', d => `translate(${outerArc.centroid(d)})`)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => (d.endAngle + d.startAngle) / 2 > Math.PI ? 'end' : 'start')
      .text(d => d.data.option)
      .attr('fill', '#f8fafc')
      .attr('font-size', '12px')
      .style('opacity', 0)
      .transition()
      .delay(1000)
      .duration(500)
      .style('opacity', 1);
  }
}
