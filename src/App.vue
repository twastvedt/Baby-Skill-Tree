<template>
  <svg class="container" ref="graphSvg">
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
      <linearGradient id="linearGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0" class="gradientStart"></stop>
        <stop offset="1" class="gradientEnd"></stop>
      </linearGradient>
      <mask id="linearMask" maskContentUnits="objectBoundingBox">
        <rect x="0" y="0" width="1" height="1" fill="url(#linearGradient)" />
      </mask>
    </defs>
  </svg>
  <div class="sidebar"></div>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue';
import { Graph } from './ts/Graph';
import { Data } from './ts/model/Data';
import { settings } from './ts/settings';

export default defineComponent({
  async setup() {
    const chartData = new Data();

    await chartData.parseData(settings.dataPath);

    const graphSvg = ref<SVGSVGElement>();

    return {
      chartData,
      graphSvg,
    };
  },
  data() {},
  mounted() {
    if (this.graphSvg) {
      let graph = new Graph(this.chartData, this.graphSvg);
    }
  },
});
</script>
<style lang="scss" scoped>
@use "sass:color";

$gray: #bbb;
$grid: rgba(255, 255, 255, 0.3);
$background: rgb(70, 92, 167);
$skillBackground: rgb(230, 202, 48);
$text: color.scale($skillBackground, $lightness: -60%);

svg.container {
  font-size: 14px;
  border: 1px solid #aaa;
  background-color: $background;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  vector-effect: non-scaling-stroke;
}

.label {
  font-size: 75%;
  text-anchor: left;
  fill: $grid;
}

.name {
  font-weight: bold;
  fill: color.scale($skillBackground, $blackness: 50%);

  tspan {
    alignment-baseline: middle;
  }
}

.skillInner {
  mix-blend-mode: multiply;
}

.skillBoxInner {
  stroke: black;
  fill: white;
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

.skillIcon {
  fill: $text;
}

#dropShadow {
  feFlood {
    flood-color: color.scale($background, $lightness: -30%, $saturation: -30%);
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
