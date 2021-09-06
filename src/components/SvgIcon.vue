<template>
  <component :is="currentIcon" />
</template>
<script>
import { defineAsyncComponent } from 'vue';
export default {
  props: {
    name: {
      type: String,
      default: undefined,
    },
  },
  computed: {
    currentIcon() {
      return defineAsyncComponent(() => import(`../icons/${this.name}.svg`));
    },
  },
};
</script>
