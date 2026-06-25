import { Component, ElementRef, input, OnChanges, SimpleChanges, viewChild, effect } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  template: '<div #chartContainer class="w-full h-full"></div>',
  host: { 'class': 'block w-full h-full' }
})
export class BarChartComponent {
  chartContainer = viewChild<ElementRef>('chartContainer');
  data = input<any[]>([]);

  constructor() {
    effect(() => {
      const currentData = this.data();
      const container = this.chartContainer();
      if (container && currentData && currentData.length > 0) {
        this.createChart(currentData, container.nativeElement);
      }
    });
  }

  private createChart(chartData: any[], element: any): void {
    try {
      d3.select(element).selectAll('*').remove();

    const width = element.offsetWidth || 500;
    const height = element.offsetHeight || 400;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const x = d3.scaleBand()
      .domain(chartData.map(d => d.questionId))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.responsesCount) || 100]).nice()
      .range([height - margin.bottom, margin.top]);

    const xAxis = (g: any) => g
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .attr('color', '#94a3b8')
      .selectAll('text')
      .attr('font-size', '12px');

    const yAxis = (g: any) => g
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .attr('color', '#94a3b8')
      .call((g: any) => g.select('.domain').remove());

    svg.append('g').call(xAxis);
    svg.append('g').call(yAxis);

    // Bars with animation
    svg.append('g')
      .selectAll('rect')
      .data(chartData)
      .join('rect')
      .attr('x', d => x(d.questionId)!)
      .attr('y', height - margin.bottom)
      .attr('width', x.bandwidth())
      .attr('height', 0)
      .attr('fill', 'url(#barGradient)')
      .attr('rx', 4) // Rounded corners
      .transition()
      .duration(1000)
      .ease(d3.easeCubicOut)
      .attr('y', d => y(d.responsesCount))
      .attr('height', d => y(0) - y(d.responsesCount));

    // Gradient defs
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'barGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#60a5fa');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#4f46e5');
    } catch (e) {
      console.error("D3 rendering error:", e);
    }
  }
}
