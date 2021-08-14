<template>
  <svg ref="svg" width="100%" height="100%">
    <g class="zoomFrame" ref="zoomFrame">
      <g class="main">
        <rect class="overlay" ref="overlay" />
        <g class="grid" />
      </g>
    </g>
  </svg>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

import * as d3 from 'd3';
import { D3ZoomEvent } from 'd3-zoom';

export default defineComponent({
  data() {
    return {};
  },
  mounted() {
    const svg = ref<SVGSVGElement>();
    const zoomFrame = ref<SVGGElement>();
    const overlay = ref<SVGGElement>();

    const width = svg.value.clientWidth;
    const height = svg.value.clientHeight;

    zoomFrame.value.setAttribute(
      'transform',
      'translate(' + width / 2 + ',' + height / 2 + ')'
    );

    d3.select(zoomFrame.value).call(
      d3
        .zoom()
        .scaleExtent([1, 8])
        .on('zoom', (event: D3ZoomEvent<SVGGElement, unknown>) => {
          this.setZoom(event.transform);
        })
    );

    overlay.value.setAttribute(
      'transform',
      'translate(' + -width / 2 + ',' + -height / 2 + ')'
    );
    overlay.value.setAttribute('width', width.toString());
    overlay.value.setAttribute('height', height.toString());

    //////////////////////
    //grid background

    const grid = this.main.append('g').classed('grid', true);

    for (let i = 0; i <= scale.invert(Math.max(width, height)); i++) {
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

    this.addShadow(this.defs);

    const gradient = this.defs
      .append('linearGradient')
      .attr('id', 'skillGradient')
      .attr('x1', '0')
      .attr('y1', '0')
      .attr('x2', '0')
      .attr('y2', '100%');

    gradient.append('stop').classed('start', true).attr('offset', '0%');
    gradient.append('stop').classed('end', true).attr('offset', '100%');

    const skills: SkillSelection = this.main.selectAll<SVGGElement, Skill>(
      '.Skill'
    );

    skills
      .sort((a, b) => a.level - b.level)
      .each(function (d) {
        (
          d3.select(this).append('rect') as d3.Selection<
            SVGRectElement,
            Skill,
            SVGElement,
            unknown
          >
        )
          .classed('skillBoxBackground', true)
          .attr('x', -settings.layout.skillWidth / 2)
          .attr('width', settings.layout.skillWidth)
          .attr('y', d.barRanges.total.start)
          .attr('height', d.barRanges.total.length)
          .attr('filter', 'url(#dropShadow)');

        (
          d3.select(this).append('rect') as d3.Selection<
            SVGRectElement,
            Skill,
            SVGElement,
            unknown
          >
        )
          .classed('skillBox skillBoxMain', true)
          .attr('x', -settings.layout.skillWidth / 2)
          .attr('width', settings.layout.skillWidth)
          .attr('y', d.barRanges.main.start)
          .attr('height', d.barRanges.main.length);

        if (d.barRanges.start) {
          (
            d3.select(this).append('rect') as d3.Selection<
              SVGRectElement,
              Skill,
              SVGElement,
              unknown
            >
          )
            .classed('skillBox skillBoxStart', true)
            .attr('x', -settings.layout.skillWidth / 2)
            .attr('width', settings.layout.skillWidth)
            .attr('y', d.barRanges.start.start)
            .attr('height', d.barRanges.start.length);
        }

        if (d.barRanges.end) {
          (
            d3.select(this).append('rect') as d3.Selection<
              SVGRectElement,
              Skill,
              SVGElement,
              unknown
            >
          )
            .classed('skillBox skillBoxEnd', true)
            .attr('x', -settings.layout.skillWidth / 2)
            .attr('width', settings.layout.skillWidth)
            .attr('y', d.barRanges.end.start)
            .attr('height', d.barRanges.end.length);
        }

        d.updateRotation();
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
  },

  methods: {
    setZoom(transform: d3.ZoomTransform): void {
      this.main.attr('transform', transform.toString());

      this.main
        .selectAll('text')
        .style('font-size', settings.layout.textSize / transform.k + 'px');
    },

    addShadow(
      defs: d3.Selection<SVGDefsElement, unknown, HTMLElement, unknown>
    ): void {
      // filter chain comes from:
      // https://github.com/wbzyl/d3-notes/blob/master/hello-drop-shadow.html
      // cpbotha added explanatory comments
      // read more about SVG filter effects here: http://www.w3.org/TR/SVG/filters.html

      // create filter with id #drop-shadow
      // height=130% so that the shadow is not clipped
      var filter = defs
        .append('filter')
        .attr('id', 'dropShadow')
        .attr('x', '-30%')
        .attr('y', '-30%')
        .attr('width', '160%')
        .attr('height', '160%');

      // SourceAlpha refers to opacity of graphic that this filter will be applied to
      // convolve that with a Gaussian and store result
      // in blur
      filter
        .append('feGaussianBlur')
        .attr('in', 'SourceAlpha')
        .attr('stdDeviation', 2)
        .attr('result', 'blur');

      // translate output of Gaussian blur to the right and downwards
      // store result in offsetBlur
      filter
        .append('feOffset')
        .attr('in', 'blur')
        .attr('dx', 0)
        .attr('dy', 0)
        .attr('result', 'offsetBlur');

      filter
        .append('feFlood')
        .attr('flood-opacity', '0.5')
        .attr('result', 'offsetColor');

      filter
        .append('feComposite')
        .attr('in', 'offsetColor')
        .attr('in2', 'offsetBlur')
        .attr('operator', 'in');

      // // overlay original SourceGraphic over translated blurred opacity by using
      // // feMerge filter. Order of specifying inputs is important!
      // var feMerge = filter.append('feMerge');

      // feMerge.append('feMergeNode').attr('in', 'offsetBlur');
      // feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    },

    addGradient(start: number, end: number): void {
      const id = `#linearGradient-${start}-${end}`;

      let gradient = this.svg.select(id);

      if (gradient === undefined) {
        gradient = this.defs
          .append('linearGradient')
          .attr('id', id)
          .attr('cx', '0')
          .attr('cy', '0')
          .attr('y1', '0%')
          .attr('y2', '100%');
      }
    },
  },
});
</script>

<style></style>
