<template>
  <div class="main">
    <h3>
      {{ skill.name }}
    </h3>
    <p class="subtitle">{{ skill.rangeString() }}</p>
    <p>{{ skill.type }}</p>
    <p v-if="skill.series">Series: {{ skill.series }}</p>
    <p>{{ skill.notes }}</p>
    <footer>
      <p v-if="skill.reference">
        <a :href="skill.reference">{{ skill.reference }}</a>
      </p>
      <p v-if="skill.iconDetails">
        Icon: <span v-html="skill.iconDetails.source" />,
        <span v-html="skill.iconDetails.license" />
        <span v-if="skill.iconDetails.notes">
          ({{ skill.iconDetails.notes }})</span
        >.
      </p>
    </footer>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue';
import { Skill } from '../ts/model/Skill';
import { settings } from '../ts/settings';

export default defineComponent({
  props: {
    skill: {
      type: Object as PropType<Skill>,
      required: true,
    },
  },
});
</script>
<style lang="scss" scoped>
@use "sass:color";
@import '../scss/colors';
.main {
  position: relative;
  height: 100%;
}

h3 {
  margin-top: 0;
}

p {
  margin: 1em 0 0 0;
}
.subtitle {
  margin-top: -1em;
}

footer {
  position: absolute;
  bottom: 0;
  font-size: 11px;
}

::v-deep {
  a:link,
  a:visited,
  a:hover,
  a:active {
    color: $uiLine;
  }
}
</style>
