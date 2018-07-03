<template>
  <div>
    <Detail v-if="show.detail && currentPhotoData" :photoData="currentPhotoData" />
    <Help v-if="show.help" />
    <Importer v-if="show.importer" :settings="photosSettings" v-on:dbImportComplete="dbRefreshed" />
    <Photo ref="photo_0" v-on:currentPhotoData="updateCurrentPhotoData" v-on:photoDisplayed="setupTimeout" />
    <Photo ref="photo_1" v-on:currentPhotoData="updateCurrentPhotoData" v-on:photoDisplayed="setupTimeout" />
    <Photo ref="photo_2" v-on:currentPhotoData="updateCurrentPhotoData" v-on:photoDisplayed="setupTimeout" />
    <Photo ref="photo_3" v-on:currentPhotoData="updateCurrentPhotoData" v-on:photoDisplayed="setupTimeout" />
    <Photo ref="photo_4" v-on:currentPhotoData="updateCurrentPhotoData" v-on:photoDisplayed="setupTimeout" />
    <Photo ref="photo_5" v-on:currentPhotoData="updateCurrentPhotoData" v-on:photoDisplayed="setupTimeout" />
  </div>
</template>

<script>
import * as photoDb from '../lib/db';
import Detail from './Detail';
import Help from './Help';
import Importer from './Importer';
import Photo from './Photo';

const SHOW_OFF = {
  configuration: false,
  detail: false,
  help: false,
  importer: false,
  photos: false
};

const DEFAULT_SETTINGS = {
  filter: '',
  fileListUrl: 'http://localhost:8080/static/files.txt',
  speed: 3000,
  from: 'C:\\Users\\Siya\\Pictures\\',
  to: 'http://localhost:8080/static/',
  defaultSettings: true
};

const PHOTO_FRAMES = 6;
const PHOTO_FRAMES_BUFFER = 3;

const NORMAL = 'normal';
const PAUSED = 'paused';
const STOPPED = 'stopped';

export default {
  name: 'Photos',
  props: ['settings'],
  components: {
    Detail,
    Help,
    Importer,
    Photo
  },
  data () {
    return {
      currentImageNumber: 0,
      src: [],
      photoCount: null,
      filteredCount: null,
      show: {},
      dbCreated: false,
      currentPhotoData: null,
      flow: NORMAL
    };
  },
  computed: {
    photosSettings: function () {
      return (this.settings || DEFAULT_SETTINGS);
    }
  },
  watch: {
    settings: {
      handler () {
        if (this.dbCreated) {
          let _this = this;
          _this.$photoDb.filteredCount(this.photosSettings.filter, function (c) { _this.filteredCount = c });
        }
      },
      deep: true
    }
  },
  created () {
    this.$history = [];
    this.$photoDb = photoDb;
    this.$timeOutId = null;
  },
  mounted () {
    // which componenets need to be show?
    let show = Object.assign({}, SHOW_OFF);
    show.configuration = this.photosSettings.defaultSettings;
    this.show = show;

    // initialise database
    let _this = this;
    this.$photoDb.open(function () {
      _this.dbCreated = true;
      _this.refreshRecordCounts();
      _this.primePhotoSequence();
    });
  },
  methods: {
    primePhotoSequence: function () {
      if (this.$history.length < PHOTO_FRAMES_BUFFER + 1) {
        let _this = this;
        this.$photoDb.next(this.lastSequenceNumberUsed().sequence, this.photosSettings.filter, function (nextImage) {
          _this.setSrc(_this.$history.length, nextImage);
          _this.$history.push(nextImage);
          _this.primePhotoSequence();
        });
      } else {
        this.showFrame(this.currentImageNumber); // 0
      }
    },
    updateCurrentPhotoData: function (photoData) {
      this.currentPhotoData = photoData;
      this.$emit('actionParams', {stars: photoData.stars});
    },
    nextPhoto: function () { this.skip(true) },
    previousPhoto: function () { this.skip(false) },
    skip: function (forward) {
      this.clearTimeout();
      this.hideFrame(this.currentImageNumber);
      this.currentImageNumber = this.currentImageNumber + (forward ? 1 : -1);
      if (this.currentImageNumber < 0) { this.currentImageNumber = 0 }
      if (this.currentImageNumber > this.photoCount) { this.photoCount = 0 }
      this.showFrame(this.currentImageNumber);
      if (forward) { this.bufferNewFrameAtEnd() }
      if (!forward) { this.bufferNewFrameAtStart() }
    },
    bufferNewFrameAtEnd: function () {
      let _this = this;
      let nextImageNumber = this.currentImageNumber + PHOTO_FRAMES_BUFFER; // NB: We have already moved the pointer forwards
      this.$photoDb.next(this.lastSequenceNumberUsed().sequence, this.photosSettings.filter, function (nextImage) {
        _this.$history.push(nextImage);
        _this.setSrc(nextImageNumber, nextImage);
      });
    },
    bufferNewFrameAtStart: function () {
      let historicalBufferSize = (PHOTO_FRAMES - PHOTO_FRAMES_BUFFER);
      let newImageNumber = this.currentImageNumber - historicalBufferSize; // NB: We have already moved the pointer forwards
      if (newImageNumber < 0) { newImageNumber = 0 }
      this.setSrc(newImageNumber, this.$history[newImageNumber]);
    },
    setSrc: function (frameNumber, srcImage) {
      if (srcImage) { this.frame(frameNumber).setSrc(srcImage) }
    },
    hideFrame: function (frameNumber) { this.frame(frameNumber).hide() },
    showFrame: function (frameNumber) { this.frame(frameNumber).show() },
    rotate: function () { this.frame().rotate() },
    star: function (n) { this.frame().star(n) },
    delete: function () { this.frame().delete() },
    frame: function (frame) {
      if (!frame) { frame = this.currentImageNumber }
      return this.$refs['photo_' + (frame % PHOTO_FRAMES)];
    },
    settingsChanged: function (newSettings) {
      this.show.configuration = false;
      this.$emit('settingsChanged', newSettings);
    },
    dbRefreshed: function () {
      this.refreshRecordCounts();
    },
    refreshRecordCounts: function () {
      if (this.dbCreated) {
        let _this = this;
        this.$photoDb.count(function (c) { _this.photoCount = c });
        this.$photoDb.filteredCount(_this.photosSettings.filter, function (c) { _this.filteredCount = c });
      } else {
        this.photoCount = 0;
        this.filteredCount = 0;
      }
    },
    setupTimeout: function () {
      this.clearTimeout();
      this.$timeOutId = setTimeout(this.reactToTimeout, this.photosSettings.speed * (this.flow === PAUSED ? 4 : 1));
    },
    clearTimeout: function () { if (this.$timeOutId) { clearTimeout(this.$timeOutId) } },
    reactToTimeout: function () {
      if (this.flow === STOPPED) {
        this.setupTimeout();
      } else {
        this.flow = NORMAL;
        this.nextPhoto();
      }
    },
    lastSequenceNumberUsed: function () {
      let r = (this.$history.length === 0 ? null : this.$history[this.$history.length - 1]);
      return (r || { sequence: Math.random() });
    },
    keypress: function (key) {
      // show details as needed
      if (['c', 'd', 'h', 'i', 'l', '?'].includes(key)) {
        let show = Object.assign({}, SHOW_OFF);
        if (key === 'c') { show.configuration = !this.show.configuration }
        if (key === 'd') { show.detail = !this.show.detail }
        if (key === 'h') { show.help = !this.show.help }
        if (key === 'l') { show.importer = !this.show.importer }
        if (key === '?') { show.help = !this.show.help }
        this.show = show;
      }

      // control flow
      if (['ArrowRight', 'ArrowLeft', 'r', '+', '-', 'd', 'q'].includes(key)) { this.setupTimeout() } // ie, restart timeout
      if (key === 's') { this.flow = (this.flow === STOPPED ? NORMAL : STOPPED) }
      if (key === 'p') { this.flow = PAUSED; this.setupTimeout() }
      if (key === 'ArrowRight') { this.flow = NORMAL; this.nextPhoto() }
      if (key === 'ArrowLeft') { this.flow = NORMAL; this.previousPhoto() }

      // change image
      if (key === 'r') { this.rotate() }
      if (key === '+') { this.star(1) }
      if (key === '-') { this.star(-1) }
      if (key === 'x') {
        this.flow = NORMAL;
        this.delete();
        this.nextPhoto();
      }

      // other
      if (key === 'q') { this.printDebugInfo() }
    },
    printDebugInfo: function () {
      console.log('xxx');
      console.log(this.lastSequenceNumberUsed());
      console.log(this.lastSequenceNumberUsed().sequence);
      let src = null;
      if (this.$history[this.currentImageNumber]) { src = this.$history[this.currentImageNumber].url }
      console.log({
        photoCount: this.photoCount,
        filteredCount: this.filteredCount,
        settings: this.photosSettings
      });
      console.log({
        currentImageNumber: this.currentImageNumber,
        currentImageSrc: src,
        lastSequenceNumberUsed: this.lastSequenceNumberUsed().sequence
      });
      if (this.currentPhotoData) {
        console.log({
          count: this.currentPhotoData.count,
          stars: this.currentPhotoData.stars,
          manualRotation: this.currentPhotoData.manualRotation
        });
      }
      console.log(this.currentPhotoData);
      console.log('History');
      console.log(this.$history);
      if (src) {
        console.log('Sequence for image ' + src);
        this.$photoDb.printSequenceForUrl(src);
      }
    }
  }
};

</script>
