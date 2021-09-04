import * as d3 from 'd3';
import { D3ZoomEvent } from 'd3-zoom';

import { settings } from './settings';

import { Data } from './model/Data';
import { Skill } from './model/Skill';
import Pt from './model/Pt';

export class Graph {
  svg: d3.Selection<SVGSVGElement, unknown, null, unknown>;
  defs: d3.Selection<SVGDefsElement, unknown, null, unknown>;

  main: d3.Selection<SVGGElement, unknown, null, unknown>;

  grid: d3.Selection<SVGGElement, unknown, null, unknown>;
  drawing: d3.Selection<SVGGElement, unknown, null, unknown>;

  zoom: d3.ZoomBehavior<Element, unknown>;

  constructor(private data: Data, svg: SVGSVGElement) {
    this.svg = d3.select(svg);
    this.defs = this.svg.select('defs');
    this.main = this.svg.select('.main');
    this.grid = this.main.select('.grid');
    this.drawing = this.main.select('.drawing');

    this.zoom = d3
      .zoom()
      .scaleExtent([1, 6])
      .on('zoom', (event: D3ZoomEvent<SVGGElement, unknown>) => {
        this.setZoom(event.transform);
      });

    void this.setupGraph();
  }

  async setupGraph(): Promise<void> {
    ///////////
    // Draw tree

    const that = this;

    // const skills = this.drawing
    //   .selectAll<SVGGElement, Skill>('.skill')
    //   .each(async function (skill) {
    //     const skillGroup = d3.select<SVGGElement, Skill>(this);

    //     const innerGroup = skillGroup
    //       .append('g')
    //       .classed('skillInner', true)
    //       .attr('mask', `url(#${skill.id}-maskInner)`);

    //     const innerGroupTransformed = innerGroup.append('g');

    //     let isMirrored = false;

    //     const innerHeight =
    //       settings.layout.skillWidth - 2 * settings.layout.skillMargin;
    //     const innerLength =
    //       skill.barRanges.total.length - 2 * settings.layout.skillMargin;

    //     if (skill.iconDetails) {
    //       const svg = await d3.text(`icons/${skill.icon}.svg`);

    //       innerGroupTransformed.html(svg);

    //       innerGroupTransformed
    //         .select('svg')
    //         .classed('skillIcon', true)
    //         .attr('y', -innerHeight / 2)
    //         .attr('x', isMirrored ? innerLength - innerHeight : -innerHeight)
    //         .attr('height', innerHeight)
    //         .attr('width', innerHeight);
    //     }
    //   });

    this.svg.call(this.zoom as any);

    this.zoomFit(0.85);
  }

  setZoom(transform: d3.ZoomTransform): void {
    this.main.attr('transform', transform.toString());

    this.main
      .selectAll('text')
      .style('font-size', settings.text.size / transform.k + 'px');
  }

  zoomFit(paddingPercent = 0.75): void {
    var bounds = this.drawing.node()?.getBBox();
    var fullWidth = this.svg.node()?.clientWidth,
      fullHeight = this.svg.node()?.clientHeight;

    if (!bounds || !fullWidth || !fullHeight) {
      throw new Error('Nodes not found.');
    }

    var width = bounds.width,
      height = bounds.height;

    var midX = bounds.x + width / 2,
      midY = bounds.y + height / 2;

    if (width == 0 || height == 0) return; // nothing to fit

    var scale =
      paddingPercent / Math.max(width / fullWidth, height / fullHeight);
    var translate: [number, number] = [-midX, -midY];

    console.trace('zoomFit', translate, scale);

    this.svg
      .transition()
      .duration(750)
      .call(
        this.zoom.transform as any,
        d3.zoomIdentity
          .translate(fullWidth / 2, fullHeight / 2)
          .scale(scale)
          .translate(...translate)
      );
  }
}
