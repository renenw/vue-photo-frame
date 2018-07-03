<template>
  <div class="info block main-block">
    <div class="detail" >

      <Stars :stars="stars" />

      <div class="section">
        <div class="header">Filename</div>
        <div v-if="imageName">{{imageName}} <a v-bind:href="src"><icon name="external-link-alt" target="_blank"></icon></a></div>
      </div>

      <div class="section" v-if="when && when.isValid()">
        <div class="header">Date</div>
        <div>
          {{when.format("dddd, D MMMM YYYY")}}<br/>
          {{when.format("h:mm A")}}
        </div>
      </div>

      <div class="section" v-if="dimensions">
        <div class="header">Dimensions</div>
        <div>{{dimensions.x}} x {{dimensions.y}}</div>
      </div>

      <div class="section" v-if="cameraModel">
        <div class="header">Camera</div>
        <div>{{cameraModel}}</div>
      </div>

      <div class="section" v-if="exifData">
        <div class="header">Detail</div>
        <div v-if="count<=1">Never shown before</div>
        <div v-if="count===2">Shown once before</div>
        <div v-if="count===3">Shown twice before</div>
        <div v-if="count>3">Shown {{count-1}} times before</div>
        <div v-if="manualRotation">Manually Rotated {{manualRotation}} &deg;</div>
        <div v-if="cameraRotation">Camarea Rotated {{cameraRotation}} &deg;</div>
        <div v-if="exposure">1/{{exposure.fraction}} sec.</div>
        <div v-if="aperture">f/{{aperture}}</div>
        <div v-if="focalLength">Focal Length: {{focalLength}} mm</div>
        <div v-if="digitalZoom">Digital Zoom: {{digitalZoom}}</div>
        <div v-if="subjectDistance">Distance to Subject: {{subjectDistance}} m</div>
        <div v-if="meteringMode">Metering: {{meteringMode}}</div>
        <div v-if="flash.fired">{{flash.detail}}</div>
      </div>

    </div>
  </div>
</template>

<script>
import Stars from './Stars';

export default {
  name: 'Detail',
  components: { Stars },
  props: ['photoData'],
  data () {
    return {
      src: null,
      stars: null,
      count: null,
      exifData: null,
      manualRotation: null
    };
  },
  mounted: function () {
    this.parseDetails();
  },
  watch: {
    photoData: {
      handler () {
        this.parseDetails();
      },
      deep: true
    }
  },
  methods: {
    parseDetails: function () {
      if (this.photoData) {
        this.src = this.photoData.url;
        this.stars = this.photoData.stars;
        this.count = this.photoData.count;
        this.exifData = this.photoData.exifData;
        this.manualRotation = Math.abs(this.photoData.manualRotation);
      }
    }
  },
  computed: {
    imageName: function () {
      let parts = (this.src || '').split('/');
      return decodeURIComponent(parts[parts.length - 1]);
    },
    when: function () {
      if (this.exifData) {
        return this.moment((this.exifData.DateTime || '').replace(':', '-').replace(':', '-'));
      } else {
        return undefined;
      }
    },
    cameraRotation: function () {
      let rotation = 0;
      switch (this.exifData.Orientation) {
        case 3:
          rotation = 180;
          break;
        case 6:
          rotation = 270;
          break;
        case 8:
          rotation = 90;
          break;
      }
      return rotation;
    },
    dimensions: function () {
      if (this.exifData && this.exifData.PixelXDimension && this.exifData.PixelYDimension) {
        return {
          x: this.exifData['PixelXDimension'],
          y: this.exifData['PixelYDimension']
        };
      }
    },
    focalLength: function () {
      if (this.exifData && this.exifData.FocalLength) {
        return Math.round(this.exifData.FocalLength.valueOf());
      }
    },
    exposure: function () {
      if (this.exifData && this.exifData.ExposureTime) {
        let t = this.exifData.ExposureTime.valueOf();
        return {
          fraction: Math.round(1 / t),
          seconds: t
        };
      }
    },
    flash: function () {
      let result = { fired: false };
      if (this.exifData && this.exifData.Flash) {
        let detail = this.exifData.Flash;
        let fired = detail.match(/fired/i);
        result = {
          fired: fired,
          detail: detail
        };
      }
      return result;
    },
    aperture: function () {
      if (this.exifData && this.exifData.ApertureValue) {
        return Math.round(Math.pow(2, this.exifData.ApertureValue.valueOf() / 2) * 100) / 100;
      }
    },
    meteringMode: function () {
      if (this.exifData && this.exifData.MeteringMode) {
        return this.exifData.MeteringMode.replace(/([A-Z])/g, ' $1');
      }
    },
    subjectDistance: function () {
      if (this.exifData && this.exifData.SubjectDistance) {
        return Math.round(this.exifData.SubjectDistance * 10) / 10;
      }
    },
    digitalZoom: function () {
      if (this.exifData) {
        return this.exifData.DigitalZoomRation;
      }
    },
    cameraModel: function () {
      if (this.exifData) {
        return ((this.exifData.Model || '').length > (this.exifData.Make || '').length ? this.exifData.Model : this.exifData.Make);
      }
    }
  }
};
</script>

<style scoped>
  div .section {
    margin-top: 10px;
  }
</style>
