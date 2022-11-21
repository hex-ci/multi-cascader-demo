import Vue from 'vue';
import App from './App.vue';

import { Popover, Select, Checkbox } from 'element-ui';

Vue.use(Popover);
Vue.use(Select);
Vue.use(Checkbox);

import 'element-ui/lib/theme-chalk/index.css';

import MultiCascaderDemo from './component.vue';

Vue.component('MultiCascaderDemo', MultiCascaderDemo);

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
}).$mount('#app');
