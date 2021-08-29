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
    this.main = this.svg.append('g');
    this.grid = this.main.append('g');
    this.drawing = this.main.append('g');

    this.zoom = d3
      .zoom()
      .scaleExtent([1, 6])
      .on('zoom', (event: D3ZoomEvent<SVGGElement, unknown>) => {
        this.setZoom(event.transform);
      });

    void this.setupGraph();
  }

  async setupGraph(): Promise<void> {
    const width = window.innerWidth - 50,
      svgNode = this.svg.node();

    if (!svgNode) {
      throw new Error('SVG not found');
    }

    const height =
      window.innerHeight - svgNode.getBoundingClientRect().top - 50;

    const scale = this.data.tree.scale;

    this.svg.attr('viewBox', [0, 0, width, height].toString());

    //////////////////////
    // Grid background

    this.grid.classed('grid', true);

    for (
      let i = 0;
      i <= scale.invert(scale(this.data.tree.skillRange[1]) * Math.SQRT2);
      i++
    ) {
      if (
        (i % 12 && i > settings.rings.lastQuarterly)
        || (i % 12 && i % 3 && i > settings.rings.lastYearly)
      ) {
        continue;
      }

      const r = scale(i);

      const circle = this.grid
        .append('circle')
        .classed('level', true)
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', r)
        .attr('id', `level-${i}`);

      if (i % 12 == 0) {
        circle.classed('level-year', true);

        if (i > 0) {
          const point = Pt.fromPolar(r + 2, (-5 * Math.PI) / 180);

          this.grid
            .append('text')
            .classed('label', true)
            .attr('x', point[0])
            .attr('y', point[1])
            .text(i / 12);
        }
      } else if (i % 3 == 0) {
        circle.classed('level-quarter', true);
      }
    }

    ///////////
    // Draw tree

    this.drawing.attr('filter', 'url(#dropShadow)');

    const that = this;

    const links = this.drawing
      .selectAll('.link')
      .data(this.data.tree.links)
      .enter()
      .append('line')
      .each(function (link) {
        const start = Pt.fromPolar(
          link.source.barRanges.total.end,
          (link.source.angle * Math.PI) / 180
        );
        const end = Pt.fromPolar(
          link.target.barRanges.total.start,
          (link.target.angle * Math.PI) / 180
        );

        this.setAttribute('x1', start[0].toString());
        this.setAttribute('x2', end[0].toString());
        this.setAttribute('y1', start[1].toString());
        this.setAttribute('y2', end[1].toString());
      })
      .attr('class', function (link) {
        let c = 'link';
        if (link.hasOwnProperty('type')) {
          c += ' ' + link.type;
        }
        return c;
      });

    const skills = this.drawing
      .selectAll<SVGGElement, Skill>('.skill')
      .data(this.data.tree.nodeList, (d) => d.id)
      .enter()
      .append('g')
      .classed('skill', true)
      .attr('id', function (d) {
        return d.id;
      })
      .each(async function (skill) {
        skill.element = this;

        skill.updateRotation();

        const outlineId = `skillOutline-${(
          Math.round(skill.barRanges.total.length * 100) / 100
        )
          .toString()
          .replace('.', '-')}`;
        const outlineSelector = `#${outlineId}`;

        if (that.defs.selectChild(outlineSelector).empty()) {
          that.defs
            .append('rect')
            .attr('id', outlineId)
            .classed('skillOutline', true)
            .attr('x', 0)
            .attr('y', 0)
            .attr('rx', 4)
            .attr('height', settings.layout.skillWidth)
            .attr('width', skill.barRanges.total.length);
        }

        const skillGroup = d3.select<SVGGElement, Skill>(this);

        skillGroup
          .append('clipPath')
          .attr('id', `${skill.id}-clipOuter`)
          .append('use')
          .attr('href', outlineSelector)
          .classed('skillBoxBackground', true)
          .attr('y', -settings.layout.skillWidth / 2)
          .attr('x', skill.barRanges.total.start);

        skillGroup
          .append('mask')
          .attr('id', `${skill.id}-maskInner`)
          .attr('maskUnits', 'objectBoundingBox')
          .append('use')
          .attr('href', outlineSelector)
          .classed('skillBoxInner', true)
          .attr('y', -settings.layout.skillWidth / 2)
          .attr('x', skill.barRanges.total.start)
          .attr('stroke-width', settings.layout.skillMargin * 2);

        const clipGroup = skillGroup
          .append('g')
          .attr('clip-path', `url(#${skill.id}-clipOuter)`);

        clipGroup
          .append('rect')
          .classed('skillBox skillBoxMain', true)
          .attr('y', -settings.layout.skillWidth / 2)
          .attr('height', settings.layout.skillWidth)
          .attr('x', skill.barRanges.main.start)
          .attr('width', skill.barRanges.main.length);

        if (skill.barRanges.start) {
          clipGroup
            .append('rect')
            .classed('skillBox skillBoxStart', true)
            .attr('y', -settings.layout.skillWidth / 2)
            .attr('height', settings.layout.skillWidth)
            .attr('x', skill.barRanges.start.start)
            .attr('width', skill.barRanges.start.length)
            .attr('fill', 'url(#linearGradient)');
        }

        if (skill.barRanges.end) {
          clipGroup
            .append('rect')
            .classed('skillBox skillBoxEnd', true)
            .attr('y', -settings.layout.skillWidth / 2)
            .attr('height', settings.layout.skillWidth)
            .attr('x', skill.barRanges.end.start)
            .attr('width', skill.barRanges.end.length)
            .attr('fill', 'url(#linearGradient)');
        }

        const innerGroup = skillGroup
          .append('g')
          .classed('skillInner', true)
          .attr('mask', `url(#${skill.id}-maskInner)`);

        const innerGroupTransformed = innerGroup.append('g');

        let isMirrored = false;

        const innerHeight =
          settings.layout.skillWidth - 2 * settings.layout.skillMargin;
        const innerLength =
          skill.barRanges.total.length - 2 * settings.layout.skillMargin;

        let innerGroupTransform = '';

        if ((skill.angle + 90) % 360 > 180) {
          isMirrored = true;

          innerGroupTransform = `rotate(180) translate(${
            -skill.barRanges.total.end + settings.layout.skillMargin
          })`;

          innerGroupTransformed.classed('reversed', true);
        } else {
          innerGroupTransform = `translate(${
            skill.barRanges.total.start
            + settings.layout.skillMargin
            + (skill.icon ? innerHeight : 0)
          })`;
        }

        if (skill.iconDetails) {
          const svg = await d3.text(`icons/${skill.icon}.svg`);

          innerGroupTransformed.html(svg);

          innerGroupTransformed
            .select('svg')
            .classed('skillIcon', true)
            .attr('y', -innerHeight / 2)
            .attr('x', isMirrored ? innerLength - innerHeight : -innerHeight)
            .attr('height', innerHeight)
            .attr('width', innerHeight);
        }

        innerGroupTransformed.attr('transform', innerGroupTransform);

        const text = innerGroupTransformed
          .append('text')
          .attr('x', settings.layout.skillMargin)
          .classed('name', true)
          .append('tspan')
          .text((d) => d.name);

        skillGroup
          .append('use')
          .attr('href', outlineSelector)
          .classed('skillBoxBackground', true)
          .attr('y', -settings.layout.skillWidth / 2)
          .attr('x', skill.barRanges.total.start);
      });

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
