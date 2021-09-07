<template>
  <component :is="dynamicIcon" />
</template>

<script lang="ts">
import { DefineComponent, defineAsyncComponent, defineComponent } from 'vue';

export default defineComponent({
  name: 'DynamicIcon',
  props: {
    icon: {
      type: String,
      required: true,
    },
  },
  computed: {
    dynamicIcon() {
      return defineAsyncComponent(
        (): Promise<DefineComponent> =>
          import(
            /* webpackChunkName: "icons" */
            /* webpackMode: "lazy-once" */
            `@/icons/${this.icon}.svg`
          )
      );
    },
  },
});
</script>
