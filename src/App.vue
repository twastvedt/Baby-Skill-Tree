<template>
  <div id="container" :class="{ skillSelected: selection }">
    <svg class="drawing" ref="graphSvg">
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
      </defs>
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
import { Skill } from './ts/model/Skill';
import { settings } from './ts/settings';

export default defineComponent({
  setup() {
    const graphSvg = ref<SVGSVGElement>();

    return {
      graphSvg,
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
  computed: {},
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

svg.drawing {
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
