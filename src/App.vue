<template>
  <div id="app">
    <multi-cascader-demo :options="options" v-model="value" :loadChildrenMethod="loadChildren" />
  </div>
</template>

<script>
import { options } from './options';

export default {
  name: 'App',

  data() {
    return {
      options,
      value: []
    };
  },

  methods: {
    loadChildren(item) {
      if (item.value) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([{
              label: '测试数据',
              value: parseInt(Math.random() * 100),
              children: null,
              isLeaf: Math.round(Math.random())
            }]);
          }, 1000);
        });
      }
    }
  }
};
</script>

<style scoped>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 40px;
}
</style>
