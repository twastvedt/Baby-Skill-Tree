import { createApp } from 'vue';
import App from './App.vue';
import { Data } from './ts/model/Data';
import { settings } from './ts/settings';

const data = new Data();

await data.parseData(settings.dataPath);

const app = createApp(App, { data });
app.mount('#app');
