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
            stdDeviation="1"
            result="blur"
          ></feGaussianBlur>
          <feOffset in="blur" dx="4" dy="4" result="offsetBlur"></feOffset>
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
          :id="skillOutlineId(length)"
          class="skillOutline"
          rx="4"
          :height="settings.layout.skillWidth"
          :width="length"
        ></rect>
      </defs>
      <g class="main">
        <g class="grid">
          <circle
            v-for="i of gridLevels"
            :class="{
              level: true,
              'level-year': !(i % 12),
              'level-quarter': !(i % 3),
            }"
            :r="scale(i)"
            :id="`level-${i}`"
          />
          <g transform="rotate(-5)">
            <text v-for="i of maxYear" class="label" :x="scale(i * 12) + 2">
              {{ i }}
            </text>
          </g>
        </g>
        <g class="drawing" filter="url(#dropShadow)">
          <line
            v-for="link of data.tree.links"
            :class="['link', link.type]"
            v-bind="linkLine(link)"
          />

          <g
            v-for="skill of data.tree.skills"
            class="skill"
            :id="skill.id"
            :transform="`rotate(${skill.angle})`"
          >
            <clipPath :id="`${skill.id}-clipOuter`">
              <use
                :href="`#${skillOutlineId(skill.roundedLength)}`"
                class="skillBoxBackground"
                :x="skill.barRanges.total.start"
                :y="-settings.layout.skillWidth / 2"
              />
            </clipPath>

            <mask :id="`${skill.id}-maskInner`" maskUnits="objectBoundingBox">
              <use
                :href="`#${skillOutlineId(skill.roundedLength)}`"
                class="skillBoxInner"
                :x="skill.barRanges.total.start"
                :y="-settings.layout.skillWidth / 2"
                :stroke-width="settings.layout.skillMargin * 2"
              />
            </mask>

            <g :clip-path="`url(#${skill.id}-clipOuter)`">
              <rect
                class="skillBox skillBoxMain"
                :x="skill.barRanges.main.start"
                :y="-settings.layout.skillWidth / 2"
                :width="skill.barRanges.main.length"
                :height="settings.layout.skillWidth"
              />

              <rect
                v-if="skill.barRanges.start"
                class="skillBox skillBoxStart"
                :x="skill.barRanges.start.start"
                :y="-settings.layout.skillWidth / 2"
                :width="skill.barRanges.start.length"
                :height="settings.layout.skillWidth"
                fill="url(#linearGradient)"
              />

              <rect
                v-if="skill.barRanges.end"
                class="skillBox skillBoxEnd"
                :x="skill.barRanges.end.start"
                :y="-settings.layout.skillWidth / 2"
                :width="skill.barRanges.end.length"
                :height="settings.layout.skillWidth"
                fill="url(#linearGradient)"
              />
            </g>

            <g
              :class="{ skillInner: true, reversed: skill.reversed }"
              :mask="`url(#${skill.id}-maskInner)`"
            >
              <g :transform="innerTransform(skill)">
                <SvgIcon
                  v-if="skill.iconDetails"
                  class="skillIcon"
                  :name="skill.icon"
                  v-bind="iconAttributes(skill)"
                />

                <text :x="settings.layout.skillMargin" class="name">
                  <tspan>{{ skill.name }}</tspan>
                </text>
              </g>
            </g>

            <use
              :href="`#${skillOutlineId(skill.roundedLength)}`"
              class="skillBoxBackground"
              :x="skill.barRanges.total.start"
              :y="-settings.layout.skillWidth / 2"
            />
          </g>
        </g>
      </g>
    </svg>
    <div class="sidebar">
      <p
        v-for="skill of data.tree.skills"
        @click="select(skill.id)"
        :class="{ selected: skill.id === selection }"
      >
        {{ skill.name }}
      </p>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';
import { Graph } from './ts/Graph';
import { Data } from './ts/model/Data';
import { Link } from './ts/model/Link';
import Pt from './ts/model/Pt';
import { Skill } from './ts/model/Skill';
import { settings } from './ts/settings';
import * as d3 from 'd3';
import SvgIcon from './SvgIcon.vue';

export default defineComponent({
  components: {
    SvgIcon,
  },
  setup(props) {
    const graphSvg = ref<SVGSVGElement>();

    return {
      graphSvg,
      scale: props.data.tree.scale,
      settings,
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
      selection: undefined as string | undefined,
    };
  },
  computed: {
    width() {
      return this.graphSvg?.clientWidth;
    },
    height() {
      return this.graphSvg?.clientHeight;
    },
    gridLevels() {
      return Array(
        Math.floor(
          this.scale.invert(
            this.scale(this.data.tree.skillRange[1]) * Math.SQRT2
          )
        )
      )
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
  },
  async mounted() {
    if (this.graphSvg) {
      let graph = new Graph(this.data, this.graphSvg);
    }
  },
  methods: {
    select(skillId?: string): void {
      if (skillId === this.selection) {
        this.selection = undefined;
      } else {
        this.selection = skillId;
      }

      this.graphSvg
        ?.querySelectorAll('.skill')
        .forEach((s) =>
          s.classList.toggle('selected', s.id === this.selection)
        );
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
      const innerHeight =
        settings.layout.skillWidth - 2 * settings.layout.skillMargin;

      if (skill.reversed) {
        return `rotate(180) translate(${
          -skill.barRanges.total.end + settings.layout.skillMargin
        })`;
      } else {
        return `translate(${
          skill.barRanges.total.start
          + settings.layout.skillMargin
          + (skill.icon ? innerHeight : 0)
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
        x: skill.reversed ? innerLength - innerHeight : -innerHeight,
        height: innerHeight,
        width: innerHeight,
      };
    },
  },
});
</script>
<style lang="scss">
@use "sass:color";

$gray: #bbb;
$grid: rgba(255, 255, 255, 0.3);
$background: rgb(70, 92, 167);
$skillBackground: rgb(230, 202, 48);
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
  background-color: $background;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

svg.graph {
  flex-grow: 1;
  font-size: 14px;
  vector-effect: non-scaling-stroke;
}

.sidebar {
  width: 300px;
  background: $uiBackground;
  color: $uiLine;
  padding: 8px;
  border-left: 1px solid $uiLine;
  box-shadow: 0 0 6px 6px $shadow;

  .selected {
    font-weight: bold;
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

    tspan {
      alignment-baseline: middle;
    }
  }
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
  stop-color: color.mix($skillBackground, $background, 20%);
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

#dropShadow {
  feFlood {
    flood-color: $shadow;
    flood-opacity: 0.8;
  }
}

.skillBoxBackground {
  stroke: color.scale($skillBackground, $blackness: 0%);
  stroke-width: 0px;
  fill: none;
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
