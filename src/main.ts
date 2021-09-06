import { createApp } from 'vue';
import App from './App.vue';
import { Data } from './ts/model/Data';
import { settings } from './ts/settings';

(async () => {
  const data = new Data();

  await data.parseData(settings.dataPath);

  createApp(App, { data }).mount('#app');
})();
