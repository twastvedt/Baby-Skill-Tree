<template>
  <div id="container" :class="{ skillSelected: selection }">
    <svg class="graph" ref="graphSvg" :viewBox="`0 0 ${width} ${height}`">
      <defs>
        <filter id="dropShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feColorMatrix
            type="matrix"
            in="SourceAlpha"
            values="1 0 0 0 0 
                    0 1 0 0 0 
                    0 0 1 0 0 
                    0 0 0 100 0"
            result="boostedInput"
          />
          <feGaussianBlur
            in="boostedInput"
            stdDeviation="0.7"
            result="blur"
          ></feGaussianBlur>
          <feOffset in="blur" dx="1" dy="1" result="offsetBlur"></feOffset>
          <feFlood flood-opacity="0.8" result="offsetColor"></feFlood>
          <feComposite
            in="offsetColor"
            in2="offsetBlur"
            operator="in"
            result="blurResult"
          ></feComposite>
          <feMerge result="sourceAndBlur">
            <feMergeNode in="blurResult" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="darken">
          <feColorMatrix
            type="matrix"
            values="0.3 0.1 0.1 0 0 
                    0.1 0.3 0.1 0 0 
                    0.1 0.1 0.3 0 0 
                    0 0 0 1 0"
          ></feColorMatrix>
        </filter>
        <linearGradient id="linearGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0" class="gradientStart"></stop>
          <stop offset="1" class="gradientEnd"></stop>
        </linearGradient>
        <mask id="linearMask" maskContentUnits="objectBoundingBox">
          <rect x="0" y="0" width="1" height="1" fill="url(#linearGradient)" />
        </mask>
        <rect
          v-for="length of skillLengths"
          :key="length"
          :id="skillOutlineId(length)"
          class="skillOutline"
          rx="0.5"
          :height="settings.layout.skillWidth"
          :width="length"
        ></rect>

        <pattern
          id="fabricPattern"
          patternUnits="userSpaceOnUse"
          width="200"
          height="200"
        >
          <image href="fabric.jpg" width="200" height="200" />
        </pattern>

        <filter id="colorizeBackground">
          <feFlood result="color"></feFlood>

          <feComposite
            in="SourceGraphic"
            in2="color"
            operator="arithmetic"
            k1="0"
            k2="0.5"
            k3="1"
            k4="0"
          />
        </filter>

        <pattern
          id="ridges"
          patternUnits="userSpaceOnUse"
          width="2"
          height="10"
          patternTransform="scale(1 1)"
        >
          <line x1="1" x2="1" y1="0" y2="10" stroke-width="1" stroke="black" />
        </pattern>

        <filter id="reflectionBlur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="7"></feGaussianBlur>
        </filter>

        <pattern
          id="reflections"
          patternUnits="userSpaceOnUse"
          width="10"
          height="10"
          patternTransform="rotate(30) scale(7)"
        >
          <line x1="5" x2="5" y1="0" y2="10" stroke-width="5" stroke="white" />
        </pattern>
      </defs>
      <g class="main" ref="mainGroup" @click="select(undefined, $event)">
        <rect
          :x="-maxCircleRadius"
          :y="-maxCircleRadius"
          :width="2 * maxCircleRadius"
          :height="2 * maxCircleRadius"
          class="background"
          fill="url(#fabricPattern)"
          filter="url(#colorizeBackground)"
        ></rect>
        <g class="grid">
          <circle
            v-for="i of gridLevels"
            :key="i"
            :class="{
              level: true,
              'level-year': !(i % 12),
              'level-quarter': !(i % 3),
            }"
            :r="scale(i)"
            :id="`level-${i}`"
          />
          <g transform="rotate(-5)">
            <text
              v-for="i of maxYear"
              :key="i"
              class="label"
              :x="scale(i * 12) + 2"
            >
              {{ i }}
            </text>
          </g>
        </g>
        <g class="drawing" ref="drawingGroup" filter="url(#dropShadow)">
          <line
            v-for="link of data.tree.links"
            :key="`${link.source.id}-${link.target.id}`"
            :class="['link', link.type]"
            v-bind="linkLine(link)"
          />

          <g
            v-for="skill of data.tree.skills"
            :key="skill.id"
            class="skill"
            @click="select(skill, $event)"
            :id="skill.id"
            :transform="`rotate(${skill.angle})`"
            :clip-path="`url(#${skill.id}-clipOuter)`"
          >
            <title>{{ tooltipTitle(skill) }}</title>
            <clipPath :id="`${skill.id}-clipOuter`">
              <use
                :href="`#${skillOutlineId(skill.roundedLength)}`"
                :x="skill.barRanges.total.start"
                :y="-settings.layout.skillWidth / 2"
              />
            </clipPath>

            <g>
              <use
                :href="`#${skillOutlineId(skill.roundedLength)}`"
                class="skillBoxBackground"
                :x="skill.barRanges.total.start"
                :y="-settings.layout.skillWidth / 2"
              />

              <rect
                v-if="skill.barRanges.main"
                class="skillBox skillBoxMain"
                :x="skill.barRanges.main.start"
                :width="skill.barRanges.main.length"
                :y="-settings.layout.skillWidth / 2"
                :height="settings.layout.skillWidth"
              />

              <line
                v-if="!skill.barRanges.start && !skill.barRanges.end"
                class="skillLine"
                :x1="skill.barRanges.total.start"
                :x2="skill.barRanges.total.start"
                :y1="-settings.layout.skillWidth / 2"
                :y2="settings.layout.skillWidth / 2"
              />

              <rect
                v-if="skill.barRanges.start"
                class="skillBox skillBoxStart"
                :x="skill.barRanges.start.start"
                :width="skill.barRanges.start.length"
                :y="-settings.layout.skillWidth / 2"
                :height="settings.layout.skillWidth"
                fill="url(#linearGradient)"
              />

              <rect
                v-if="skill.barRanges.end"
                class="skillBox skillBoxEnd"
                :x="skill.barRanges.end.start"
                :width="skill.barRanges.end.length"
                :y="-settings.layout.skillWidth / 2"
                :height="settings.layout.skillWidth"
                fill="url(#linearGradient)"
              />
            </g>

            <g
              :transform="innerTransform(skill)"
              :class="{ skillInner: true, reversed: skill.reversed }"
            >
              <mask :id="`${skill.id}-maskInner`" maskUnits="objectBoundingBox">
                <use
                  :href="`#${skillOutlineId(skill.roundedLength)}`"
                  class="skillBoxInner"
                  :y="-settings.layout.skillWidth / 2"
                  :stroke-width="settings.layout.skillMargin * 2"
                />
              </mask>

              <SvgIcon
                v-if="skill.icon && skill.iconDetails"
                class="skillIcon"
                :icon="skill.icon"
                v-bind="iconAttributes(skill)"
              />

              <g :mask="`url(#${skill.id}-maskInner)`">
                <text
                  :x="
                    settings.layout.skillMargin + (skill.icon ? innerHeight : 0)
                  "
                  class="name"
                >
                  <tspan>{{ skill.name }}</tspan>
                </text>
              </g>
            </g>

            <use
              :href="`#${skillOutlineId(skill.roundedLength)}`"
              class="skillBoxTexture"
              fill="url(#ridges)"
              :x="skill.barRanges.total.start"
              :y="-settings.layout.skillWidth / 2"
            />

            <line
              class="ribbonEdge"
              :x1="skill.barRanges.total.start"
              :x2="skill.barRanges.total.end"
              :y1="-settings.layout.skillWidth / 2 + 1.5"
              :y2="-settings.layout.skillWidth / 2 + 1.5"
            />

            <line
              class="ribbonEdge"
              :x1="skill.barRanges.total.start"
              :x2="skill.barRanges.total.end"
              :y1="settings.layout.skillWidth / 2 - 1.5"
              :y2="settings.layout.skillWidth / 2 - 1.5"
            />

            <use
              :href="`#${skillOutlineId(skill.roundedLength)}`"
              class="skillBoxLighting"
              fill="url(#reflections)"
              filter="url(#reflectionBlur)"
              :x="skill.barRanges.total.start"
              :y="-settings.layout.skillWidth / 2"
            />
          </g>
        </g>
      </g>
    </svg>
    <div class="sidebar">
      <div v-if="!selection" class="list">
        <h3
          v-for="skill of data.tree.skills"
          :key="skill.id"
          @click="select(skill, $event)"
        >
          {{ skill.name }}
        </h3>
      </div>
      <div class="details" v-else>
        <h3>
          {{ selection.name }}
        </h3>
        <p class="notes">{{ selection.notes }}</p>
        <p class="reference">
          <a :href="selection.reference">{{ selection.reference }}</a>
        </p>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue';
import { Data } from './ts/model/Data';
import { Link } from './ts/model/Link';
import Pt from './ts/model/Pt';
import { Skill } from './ts/model/Skill';
import { settings } from './ts/settings';
import * as d3 from 'd3';
import { D3ZoomEvent, select } from 'd3';
import SvgIcon from './components/SvgIcon.vue';

export default defineComponent({
  components: { SvgIcon },
  setup(props) {
    const graphSvg = ref<SVGSVGElement>();

    const mainGroup = ref<SVGGElement>();
    const drawingGroup = ref<SVGGElement>();

    function setZoom(transform: d3.ZoomTransform): void {
      console.log(`Transform: ${transform.toString()}`);

      if (isNaN(transform.x) || isNaN(transform.y) || isNaN(transform.k)) {
        return;
      }

      mainGroup.value?.setAttribute('transform', transform.toString());

      mainGroup.value?.classList.toggle('detailed', transform.k > 4);
    }

    const width = computed(() => graphSvg.value?.clientWidth ?? 0);

    const height = computed(() => graphSvg.value?.clientHeight ?? 0);

    const drawingRadius = computed(() =>
      props.data.tree.scale(props.data.tree.skillRange[1])
    );

    const maxCircleRadius = computed(() => {
      let radius = drawingRadius.value * Math.SQRT2;

      if (width.value && height.value) {
        radius *= Math.max(
          width.value / height.value,
          height.value / width.value
        );
      }

      return radius;
    });

    return {
      graphSvg,
      mainGroup,
      drawingGroup,
      scale: props.data.tree.scale,
      settings,
      zoom: d3
        .zoom<SVGSVGElement, unknown>()
        // .scaleExtent([0.8, 6])
        // .translateExtent([
        //   [-drawingRadius.value, -drawingRadius.value],
        //   [drawingRadius.value * 2, drawingRadius.value * 2],
        // ])
        .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
          setZoom(event.transform);
        }),
      width,
      height,
      drawingRadius,
      maxCircleRadius,
    };
  },
  props: {
    data: {
      type: Object as PropType<Data>,
      required: true,
    },
  },
  data() {
    return {
      selection: undefined as Skill | undefined,
    };
  },
  computed: {
    gridLevels() {
      return Array(Math.floor(this.scale.invert(this.maxCircleRadius)))
        .fill(0)
        .map((_, i) => i)
        .filter(
          (_, i) =>
            !(i % 12 && i > settings.rings.lastQuarterly)
            && !(i % 12 && i % 3 && i > settings.rings.lastMonthly)
        );
    },
    maxYear() {
      return Math.floor(this.data.tree.skillRange[1] / 12);
    },
    skillLengths() {
      return new Set(
        Object.values(this.data.tree.skills).map((s) => s.roundedLength)
      );
    },
    innerHeight() {
      return settings.layout.skillWidth - 2 * settings.layout.skillMargin;
    },
  },
  async mounted() {
    if (this.graphSvg) {
      select(this.graphSvg).call(this.zoom);

      this.zoomFit(false);
    }
  },
  methods: {
    tooltipTitle(skill: Skill) {
      let title = `${skill.name}: `;

      if (skill.actualEnd !== skill.start) {
        const start = this.formatTime(skill.start);
        const end = this.formatTime(skill.actualEnd);

        if (start.unit !== end.unit) {
          title += `${start.format} - ${end.format}`;
        } else {
          title += `${start.number} - ${end.number} ${start.unit}${this.plural(
            end.number
          )}`;
        }
      } else {
        title += this.formatTime(skill.start).format;
      }

      return title;
    },
    formatTime(time: number) {
      const result = {
        number: time,
        unit: 'month' as string | undefined,
      };

      if (time % 12 === 0) {
        result.number = time / 12;
        result.unit = 'year';
      }

      if (time == 0) {
        result.unit = undefined;

        return { ...result, format: 'birth' };
      }

      return {
        ...result,
        format: `${result.number} ${result.unit}${this.plural(result.number)}`,
      };
    },
    plural(num: number) {
      if (num === 1) {
        return '';
      } else {
        return 's';
      }
    },
    select(skill: Skill | undefined, event: Event): void {
      if (skill?.id === this.selection?.id) {
        this.selection = undefined;
      } else {
        this.selection = skill;
      }

      this.graphSvg
        ?.querySelectorAll('.skill')
        .forEach((s) =>
          s.classList.toggle('selected', s.id === this.selection?.id)
        );

      event.stopPropagation();
    },
    linkLine(link: Link) {
      const start = Pt.fromPolar(
        link.source.barRanges.total.end,
        (link.source.angle * Math.PI) / 180
      );
      const end = Pt.fromPolar(
        link.target.barRanges.total.start,
        (link.target.angle * Math.PI) / 180
      );

      return {
        x1: start[0],
        x2: end[0],
        y1: start[1],
        y2: end[1],
      };
    },
    skillOutlineId(length: number): string {
      return `skillOutline-${length.toString().replace('.', '-')}`;
    },
    innerTransform(skill: Skill): string {
      if (skill.reversed) {
        return `rotate(180) translate(${
          -skill.barRanges.total.end + settings.layout.skillMargin
        })`;
      } else {
        return `translate(${
          skill.barRanges.total.start + settings.layout.skillMargin
        })`;
      }
    },
    iconAttributes(skill: Skill) {
      const innerHeight =
        settings.layout.skillWidth - 2 * settings.layout.skillMargin;
      const innerLength =
        skill.barRanges.total.length - 2 * settings.layout.skillMargin;

      return {
        y: -innerHeight / 2,
        x: skill.reversed ? innerLength - innerHeight : 0,
        height: innerHeight,
        width: innerHeight,
      };
    },
    zoomFit(animate = true, paddingPercent = 0.85): void {
      const bounds = this.drawingGroup?.getBBox();
      const fullWidth = this.graphSvg?.clientWidth,
        fullHeight = this.graphSvg?.clientHeight;

      if (!bounds || !fullWidth || !fullHeight) {
        throw new Error('Nodes not found.');
      }

      const width = bounds.width,
        height = bounds.height;

      const midX = bounds.x + width / 2,
        midY = bounds.y + height / 2;

      if (width == 0 || height == 0) return; // nothing to fit

      const scale =
        paddingPercent / Math.max(width / fullWidth, height / fullHeight);
      const translate: [number, number] = [-midX, -midY];

      console.debug('zoomFit', translate, scale);

      if (this.graphSvg) {
        if (animate) {
          select(this.graphSvg)
            .transition()
            .duration(750)
            .call(
              this.zoom.transform,
              d3.zoomIdentity
                .translate(fullWidth / 2, fullHeight / 2)
                .scale(scale)
                .translate(...translate)
            );
        } else {
          select(this.graphSvg).call(
            this.zoom.transform,
            d3.zoomIdentity
              .translate(fullWidth / 2, fullHeight / 2)
              .scale(scale)
              .translate(...translate)
          );
        }
      }
    },
  },
});
</script>
<style lang="scss">
@use "sass:color";

$gray: #bbb;
$grid: rgba(255, 255, 255, 0.3);
$background: rgb(70, 92, 167);
$skillBackground: rgb(209, 183, 38);
$text: color.scale($skillBackground, $lightness: -60%);
$shadow: color.scale($background, $lightness: -30%, $saturation: -30%);

$uiBackground: rgb(247, 245, 234);
$uiLine: color.scale($uiBackground, $lightness: -60%);

body {
  margin: 0;
}

#container {
  height: 100vh;
  display: flex;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

svg #colorizeBackground feFlood {
  flood-color: $background;
}

svg.graph {
  flex-grow: 1;
  font-size: 14px;
}

.sidebar {
  width: 300px;
  background: $uiBackground;
  color: $uiLine;
  padding: 8px;
  border-left: 1px solid $uiLine;
  box-shadow: 0 0 6px 6px rgba($color: $shadow, $alpha: 0.5);

  .list h3 {
    cursor: pointer;
    padding: 8px 8px;
    margin: 0;

    &:hover {
      background-color: rgba($color: #000000, $alpha: 0.1);
    }
  }

  .details {
    a {
      color: $uiLine;
      font-size: 10px;
    }
  }
}

.link {
  stroke: $gray;
}

circle.level {
  stroke: $grid;
  stroke-width: 0.125px;
  fill: none;

  &.level-quarter {
    stroke-width: 0.25px;
  }

  &.level-year {
    stroke-width: 0.75px;
  }
}

.label {
  font-size: 75%;
  text-anchor: left;
  fill: $grid;
}

.skillInner {
  mix-blend-mode: multiply;
  fill: $text;

  .name {
    font-weight: bold;
    font-size: 8px;

    tspan {
      alignment-baseline: middle;
    }
  }
}

.detailed .name {
  font-size: 3px;
}

.skillBoxInner {
  stroke: black;
  fill: white;
}

.skillSelected {
  .skill:not(.selected) {
    filter: url(#darken);
  }
}

.gradientStart {
  stop-color: $skillBackground;
  stop-opacity: 0.2;
}

.gradientEnd {
  stop-color: $skillBackground;
}

.skillBoxStart,
.skillBoxEnd {
  stroke: none;
}

.skillBoxEnd {
  transform: rotate(180deg);
  transform-origin: center;
  transform-box: fill-box;
}

.skillBoxMain {
  fill: $skillBackground;
}

.skillLine {
  stroke: $skillBackground;
  stroke-width: 6;
}

#dropShadow {
  feFlood {
    flood-color: $shadow;
    flood-opacity: 0.8;
  }
}

.skillBoxBackground {
  fill: $background;
}

.skillBoxTexture {
  opacity: 0.15;
  mix-blend-mode: multiply;
}

.skillBoxLighting {
  opacity: 0.6;
  mix-blend-mode: soft-light;
}

.ribbonEdge {
  stroke-width: 0.5px;
  stroke-opacity: 0.2;
  mix-blend-mode: multiply;
  stroke: black;
  stroke-dasharray: 2.5;
}

button {
  width: 100px;
  height: 30px;
  border-radius: 5px;
  background: #ddd;
  border: 1px solid #aaa;
  text-align: center;
  font-size: 16px;

  &:hover {
    background: #aaa;
  }
}

.buttons {
  margin: 0 0 10px;
}
</style>
