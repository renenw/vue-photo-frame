<template>
  <div class="banner">
    <div class="detail">
      <h1>Jonga!</h1>
      <p><span class="header">Version</span><br/><span>1 [July 2018]</span></p>
      <p><span class="header">Help</span><br/><span>Press <button class="key">?</button> or <button class="key">H</button> for help.</span></p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Intro'
};
</script>

<style scoped>
.banner {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 300px;
  color: white;
  z-index: 100;
}
</style>
