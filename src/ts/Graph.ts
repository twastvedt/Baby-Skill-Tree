import * as d3 from 'd3';
import { D3ZoomEvent } from 'd3-zoom';

import { settings } from './settings';

import { Data } from './model/Data';
import { Skill, SkillSelection } from './model/Skill';
import Pt from './model/Pt';

export class Graph {
  data: Data = new Data();

  svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
  defs: d3.Selection<SVGDefsElement, unknown, HTMLElement, unknown>;

  main: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>;

  drawing: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>;

  zoom: d3.ZoomBehavior<Element, unknown>;

  constructor() {
    this.svg = d3.select('svg');
    this.defs = this.svg.select('defs');

    void this.setupGraph();
  }

  async setupGraph(): Promise<void> {
    await this.data.parseData(settings.dataPath);

    const width = window.innerWidth - 50,
      svgNode: SVGElement = this.svg.node(),
      height = window.innerHeight - svgNode.getBoundingClientRect().top - 50,
      scale = this.data.tree.scale;

    this.svg.attr('viewBox', [0, 0, width, height].toString());

    this.zoom = d3
      .zoom()
      .scaleExtent([1, 6])
      .on('zoom', (event: D3ZoomEvent<SVGGElement, unknown>) => {
        this.setZoom(event.transform);
      });

    this.main = this.svg.append('g');

    //////////////////////
    // Grid background

    const grid = this.main.append('g').classed('grid', true);

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

      const circle = grid
        .append('circle')
        .classed('level', true)
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', r)
        .attr('id', `level-${i}`);

      if (i % 12 == 0) {
        circle.classed('level-year', true);

        if (i > 0) {
          grid
            .append('text')
            .classed('label', true)
            .attr('x', r)
            .text(i / 12);
        }
      } else if (i % 3 == 0) {
        circle.classed('level-quarter', true);
      }
    }

    ///////////
    // Draw tree

    this.drawing = this.main.append('g').attr('filter', 'url(#dropShadow)');

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
      .attr('class', 'skill')
      .attr('id', function (d) {
        return d.id;
      })
      .sort((a, b) => a.level - b.level)
      .each(function (skill) {
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

        const skillGroup = d3.select(this) as d3.Selection<
          SVGGElement,
          Skill,
          SVGGElement,
          unknown
        >;

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
          .attr('stroke-width', settings.text.margin * 2);

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
            .attr('mask', 'url(#linearMask)');
        }

        if (skill.barRanges.end) {
          clipGroup
            .append('rect')
            .classed('skillBox skillBoxEnd', true)
            .attr('y', -settings.layout.skillWidth / 2)
            .attr('height', settings.layout.skillWidth)
            .attr('x', skill.barRanges.end.start)
            .attr('width', skill.barRanges.end.length)
            .attr('mask', 'url(#linearMask)');
        }

        const innerGroup = skillGroup
          .append('g')
          .classed('skillInner', true)
          .attr('mask', `url(#${skill.id}-maskInner)`);

        // Add text and events to each person.
        innerGroup
          .append('text')
          .classed('name', true)
          .each(async function (skill) {
            if ((skill.angle + 90) % 360 > 180) {
              d3.select(this)
                .attr('x', -(skill.barRanges.total.end - settings.text.margin))
                .attr('transform', 'rotate(180)')
                .classed('reversed', true);
            } else {
              d3.select(this).attr(
                'x',
                skill.barRanges.total.start + settings.text.margin
              );
            }

            if (skill.icon) {
              const details = settings.icons.get(skill.icon);

              const svg = await d3.text(`icons/${skill.icon}.svg`);

              d3.select(this).append('tspan').html(svg);
            }
          })
          .append('tspan')
          .text((d) => d.name);

        skillGroup
          .append('use')
          .attr('href', outlineSelector)
          .classed('skillBoxBackground', true)
          .attr('y', -settings.layout.skillWidth / 2)
          .attr('x', skill.barRanges.total.start);
      });

    this.svg.call(this.zoom);

    this.zoomFit(0.85);
  }

  setZoom(transform: d3.ZoomTransform): void {
    this.main.attr('transform', transform.toString());

    this.main
      .selectAll('text')
      .style('font-size', settings.text.size / transform.k + 'px');
  }

  zoomFit(paddingPercent = 0.75): void {
    var bounds = this.drawing.node().getBBox();
    var fullWidth = this.svg.node().clientWidth,
      fullHeight = this.svg.node().clientHeight;

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
        this.zoom.transform,
        d3.zoomIdentity
          .translate(fullWidth / 2, fullHeight / 2)
          .scale(scale)
          .translate(...translate)
      );
  }
}
