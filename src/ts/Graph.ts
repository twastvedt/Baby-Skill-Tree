import * as d3 from 'd3';
import { D3ZoomEvent } from 'd3-zoom';

import { settings } from './settings';

import { Data } from './Data';
import { TreeNode } from './model/TreeNode';
import { Skill, SkillSelection } from './model/Skill';

export class Graph {
  data: Data = new Data();

  svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
  defs: d3.Selection<SVGDefsElement, unknown, HTMLElement, unknown>;

  main: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>;

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

    this.svg.attr('width', width);
    this.svg.attr('height', height);

    this.main = this.svg
      .append('g')
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')
      .call(
        d3
          .zoom()
          .scaleExtent([1, 6])
          .on('zoom', (event: D3ZoomEvent<SVGGElement, unknown>) => {
            this.setZoom(event.transform);
          })
      )
      .append('g');

    this.main
      .append('rect')
      .classed('overlay', true)
      .attr('transform', 'translate(' + -width / 2 + ',' + -height / 2 + ')')
      .attr('width', width)
      .attr('height', height);

    //////////////////////
    //grid background

    const grid = this.main.append('g').classed('grid', true);

    for (
      let i = 0;
      i <= scale.invert(Math.max(width, height) / Math.SQRT2);
      i++
    ) {
      const r = scale(i);

      const circle = grid
        .append('circle')
        .classed('level', true)
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', r)
        .attr('id', 'level-' + i);

      if (i % 12 == 0) {
        circle.classed('level-year', true);

        grid
          .append('text')
          .classed('label', true)
          .append('textPath')
          .attr('startOffset', '75%')
          .attr('xlink:href', '#level-' + i)
          .text(i);
      } else if (i % 3 == 0) {
        circle.classed('level-quarter', true);
      }
    }

    ///////////
    // Draw tree

    const drawing = this.main.append('g').attr('filter', 'url(#dropShadow)');

    const links = drawing
      .selectAll('.link')
      .data(this.data.tree.links)
      .enter()
      .append('line')
      .attr('class', function (d) {
        let c = 'link';
        if (d.hasOwnProperty('type')) {
          c += ' ' + d.type;
        }
        return c;
      });

    const nodes = drawing
      .selectAll<SVGGElement, TreeNode>('.node')
      .data(this.data.tree.nodeList, (d) => d.id)
      .enter()
      .append('g')
      .attr('class', function (d) {
        return 'node ' + d.constructor.name;
      })
      .attr('id', function (d) {
        return d.id;
      })
      .each(function (node) {
        node.element = this;
        node.rotationChildren = node.getRotationChildren();
      });

    const skills: SkillSelection = drawing.selectAll<SVGGElement, Skill>(
      '.Skill'
    );

    const that = this;

    skills
      .sort((a, b) => a.level - b.level)
      .each(function (d) {
        d.updateRotation();

        const outlineId = `skillOutline-${(
          Math.round(d.barRanges.total.length * 100) / 100
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
            .attr('width', settings.layout.skillWidth)
            .attr('height', d.barRanges.total.length);
        }

        const skillGroup = d3.select(this) as d3.Selection<
          SVGGElement,
          Skill,
          SVGGElement,
          unknown
        >;

        skillGroup
          .append('clipPath')
          .attr('id', `${d.id}-clip`)
          .append('use')
          .attr('href', outlineSelector)
          .classed('skillBoxBackground', true)
          .attr('x', -settings.layout.skillWidth / 2)
          .attr('y', d.barRanges.total.start);

        const clipGroup = skillGroup
          .append('g')
          .attr('clip-path', `url(#${d.id}-clip)`);

        clipGroup
          .append('use')
          .attr('href', outlineSelector)
          .classed('skillBoxBackground', true)
          .attr('x', -settings.layout.skillWidth / 2)
          .attr('y', d.barRanges.total.start);

        clipGroup
          .append('rect')
          .classed('skillBox skillBoxMain', true)
          .attr('x', -settings.layout.skillWidth / 2)
          .attr('width', settings.layout.skillWidth)
          .attr('y', d.barRanges.main.start)
          .attr('height', d.barRanges.main.length);

        if (d.barRanges.start) {
          clipGroup
            .append('rect')
            .classed('skillBox skillBoxStart', true)
            .attr('x', -settings.layout.skillWidth / 2)
            .attr('width', settings.layout.skillWidth)
            .attr('y', d.barRanges.start.start)
            .attr('height', d.barRanges.start.length)
            .attr('mask', 'url(#linearMask)');
        }

        if (d.barRanges.end) {
          clipGroup
            .append('rect')
            .classed('skillBox skillBoxEnd', true)
            .attr('x', -settings.layout.skillWidth / 2)
            .attr('width', settings.layout.skillWidth)
            .attr('y', d.barRanges.end.start)
            .attr('height', d.barRanges.end.length)
            .attr('mask', 'url(#linearMask)');
        }
      });

    // Add text and events to each person.
    skills
      .append('text')
      .classed('name', true)
      .text((d) => d.name)
      .each(function (d) {
        if ((d.angle + 270) % 360 > 180) {
          d3.select(this)
            .attr(
              'transform',
              `translate(-2, ${d.barRanges.total.start + 5}) rotate(90)`
            )
            .classed('reversed', true);
        } else {
          d3.select(this).attr(
            'transform',
            `translate(2, ${d.barRanges.total.end - 5}) rotate(-90)`
          );
        }
      });

    this.setZoom(d3.zoomIdentity);
  }

  setZoom(transform: d3.ZoomTransform): void {
    this.main.attr('transform', transform.toString());

    this.main
      .selectAll('text')
      .style('font-size', settings.layout.textSize / transform.k + 'px');
  }
}
