<template>
  <div>
    <img ref="theImage" v-bind:src="src" v-on:load="imageLoaded" :style="effectiveRotation" class="full-screen-image" style="visibility: hidden;" />
  </div>
</template>

<script>
import * as photoDb from '../lib/db';
import * as photoDetail from '../lib/photo';

export default {
  name: 'Photo',
  data () {
    return {
      src: null,
      sequenceNumber: null,
      photoData: null,
      manualRotation: 0,
      exifRotation: 0,
      effectiveRotation: null,
      dbCreated: false
    };
  },
  created: function () {
    this.$photoDb = photoDb;
    this.$photoDetail = photoDetail;
  },
  mounted () {
    let _this = this;
    this.$photoDb.open(function () { _this.dbCreated = true });
  },
  watch: {
    src: function () {
      this.exifData = null;
      this.manualRotation = 0;
      this.exifRotation = 0;
      this.effectiveRotation = { transform: 'rotate(0deg)' };
    },
    photoData: function () {
      if (this.photoData.exifData) {
        this.exifRotation = this.getExifRotation(this.photoData.exifData);
      } else {
        let _this = this;
        this.$photoDetail.get(this.$refs.theImage).then(function (results) {
          _this.photoData.exifData = results[0];
          _this.exifRotation = _this.getExifRotation(results[0]);
          _this.saveImageData();
        });
      }
    },
    exifRotation: function () {
      this.updateRotation();
    },
    manualRotation: function () {
      this.updateRotation();
    }
  },
  methods: {
    setSrc: function (srcImage) {
      if (srcImage) {
        this.src = srcImage.url;
        this.sequenceNumber = srcImage.sequence;
        let _this = this;
        this.$photoDb.get(this.src, function (photo) {
          _this.photoData = photo;
          _this.manualRotation = (photo.manualRotation || 0);
        });
      }
    },
    rotate: function () {
      this.photoData.manualRotation = (this.photoData.manualRotation || 0) - 90;
      if (this.photoData.manualRotation === -360) { this.photoData.manualRotation = 0 };
      this.manualRotation = this.photoData.manualRotation;
      this.saveImageData();
    },
    star: function (change) {
      let stars = this.photoData.stars;
      stars = stars + change;
      if (stars > 5) { stars = 5 };
      if (stars < -1) { stars = -1 };
      if (stars !== this.photoData.stars) { this.changeStars(change) }
    },
    delete: function () {
      this.photoData.stars = -1;
      this.saveImageData();
      this.$photoDb.flagAsDeleted(this.photoData.url);
    },
    changeStars: function (change) {
      this.photoData.stars = this.photoData.stars + change;
      this.saveImageData();
      this.$photoDb.changeStars(this.photoData.url, this.sequenceNumber, change);
    },
    saveImageData: function () {
      this.publishPhotoData();
      this.$photoDb.put(this.photoData);
    },
    incrementViewCount: function () {
      this.photoData.count = this.photoData.count + 1;
      this.$photoDb.put(this.photoData); // dont publish
    },
    show: function () {
      if (this.src) {
        this.$refs.theImage.style.visibility = 'visible';
        this.initialManualRotation = this.manualRotation;
        this.publishPhotoData();
        this.$emit('photoDisplayed');
        this.incrementViewCount();
      }
    },
    hide: function () { this.$refs.theImage.style.visibility = 'hidden' },
    publishPhotoData: function () {
      if (this.$refs.theImage.style.visibility === 'visible') {
        this.$emit('currentPhotoData', this.photoData);
      }
    },
    imageLoaded: function (event) {
      event.target.style.marginTop = (((window.innerHeight - event.target.height) / 2) * 0.9) + 'px';
      event.target.style.left = ((window.innerWidth - event.target.width) / 2) + 'px';
    },
    getExifRotation: function (exifInfo) {
      let rotation = 0;
      if (exifInfo) {
        switch (exifInfo.Orientation) {
          case 3:
            rotation = rotation + 180;
            break;
          case 6:
            rotation = rotation + 90;
            break;
          case 8:
            rotation = rotation + -90;
            break;
        }
      }
      return rotation;
    },
    updateRotation: function () {
      let r = this.manualRotation + this.exifRotation;
      this.effectiveRotation = { transform: 'rotate(' + r + 'deg)' };
    }
  }
};
</script>

<style scoped>
.full-screen-image {
  max-width: 100vw;
  max-height: 100vh;
  padding: 0;
  position: fixed;
}
</style>
