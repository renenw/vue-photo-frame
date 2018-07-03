<template>
  <div>
    <div v-if="stars>0">
      <span v-if="stars>=1"><icon name="star" color="yellow" /></span>
      <span v-if="stars>=2"><icon name="star" color="yellow" /></span><span v-if="stars<2"><icon name="regular/star" /></span>
      <span v-if="stars>=3"><icon name="star" color="yellow" /></span><span v-if="stars<3"><icon name="regular/star" /></span>
      <span v-if="stars>=4"><icon name="star" color="yellow" /></span><span v-if="stars<4"><icon name="regular/star" /></span>
      <span v-if="stars===5"><icon name="star" color="yellow" /></span><span v-if="stars<5"><icon name="regular/star" /></span>
    </div>
    <div v-if="stars===0">Do not show</div>
    <div v-if="stars===-1">Deleted</div>
  </div>
</template>

<script>
import 'vue-awesome/icons/star';
import 'vue-awesome/icons/regular/star';

export default {
  name: 'Stars',
  props: ['stars']
};
</script>
