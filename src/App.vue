<template>
  <div id="app">
    <Photos/>
  </div>
</template>

<script>
import Photos from './components/Photos';

export default {
  name: 'App',
  components: {
    Photos
  }
};
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
