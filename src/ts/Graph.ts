import * as d3 from 'd3';
import { D3ZoomEvent } from 'd3-zoom';

import { settings } from './settings';

import { Data } from './Data';
import { TreeNode } from './model/TreeNode';
import { Skill, SkillSelection } from './model/Skill';

export class Graph {
  scale: d3.ScaleLinear<number, number>;
  data: Data;

  svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
  defs: d3.Selection<SVGDefsElement, unknown, HTMLElement, unknown>;

  main: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>;

  constructor(csv: string) {
    this.data = new Data(csv);

    this.svg = d3.select('body').append('svg:svg');
    this.defs = this.svg.append('defs');

    this.scale = d3
      .scaleLinear()
      .domain([
        0,
        Object.values(this.data.tree.skills).reduce(
          (prev, curr) => Math.max(prev, curr.actualEnd),
          0
        ),
      ])
      .range([settings.layout.width / 2, 0]);

    this.setupGraph();
  }

  setupGraph(): void {
    const width = window.innerWidth - 50,
      svgNode: SVGElement = this.svg.node(),
      height = window.innerHeight - svgNode.getBoundingClientRect().top - 50;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;

    this.svg.attr('width', width);
    this.svg.attr('height', height);

    this.main = this.svg
      .append('g')
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')
      .call(
        d3
          .zoom()
          .scaleExtent([1, 8])
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

    for (let i = 0; i <= this.scale.invert(Math.max(width, height)); i++) {
      const r = this.scale(i);

      const circle = grid
        .append('circle')
        .classed('level', true)
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', r)
        .attr('id', 'level-' + i);

      if (i % 52 == 0) {
        circle.classed('level-year', true);

        grid
          .append('text')
          .classed('label', true)
          .append('textPath')
          .attr('startOffset', '75%')
          .attr('xlink:href', '#level-' + i)
          .text(i);
      } else if (i % 13 == 0) {
        circle.classed('level-quarter', true);
      }
    }

    ///////////
    // Draw tree

    const links = this.main
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

    const nodes = this.main
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

    // Drag nodes.
    d3
      .drag<SVGElement, TreeNode>()
      .on(
        'drag',
        (event: d3.D3DragEvent<SVGElement, TreeNode, unknown>, dragNode) => {
          const startAngle =
            (Math.atan2(event.y - event.dy, event.x - event.dx) * 180)
            / Math.PI;

          const delta =
            (Math.atan2(event.y, event.x) * 180) / Math.PI - startAngle;

          for (const child of dragNode.rotationChildren) {
            child.angle += delta;
          }
        }
      )(nodes);

    const people: SkillSelection = this.main.selectAll<SVGGElement, Skill>(
      '.Skill'
    );

    // Add text and events to each person.
    people
      .append('text')
      .classed('name personName', true)
      .text((d) => d.name)
      .each(function (d) {
        if ((d.angle + 270) % 360 > 180) {
          d3.select(this)
            .attr(
              'transform',
              `translate(3, ${that.scale(d.start) - 7}) rotate(90)`
            )
            .classed('reversed', true);
        } else {
          d3.select(this).attr(
            'transform',
            `translate(-3, ${that.scale(d.start) - 7}) rotate(-90)`
          );
        }
      });

    people
      .sort((a, b) => a.level - b.level)
      .each(function (d) {
        const lifeLine = d3.select(this).append('line') as d3.Selection<
          SVGLineElement,
          Skill,
          SVGElement,
          unknown
        >;

        lifeLine
          .classed('life', true)
          .attr('x1', 0)
          .attr('x2', 0)
          .attr('y1', that.scale(d.start))
          .attr('y2', that.scale(d.actualEnd));

        d.updateRotation();
      });

    this.setZoom(d3.zoomIdentity);
  }

  setZoom(transform: d3.ZoomTransform): void {
    this.main.attr('transform', transform.toString());

    this.main
      .selectAll('text')
      .style('font-size', settings.layout.textSize / transform.k + 'px');
  }

  addLifeGradient(year: number, isBirth: boolean): void {
    const id = `#radialGradient-${year}-${isBirth}`;

    let gradient = this.svg.select(id);

    if (gradient === undefined) {
      gradient = this.defs
        .append('radialGradient')
        .attr('id', id)
        .attr('cx', '0')
        .attr('cy', '0')
        .attr('y1', '0%')
        .attr('y2', '100%');
    }
  }
}
