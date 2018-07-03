<template>
  <div class="info block importer-block">
    <h1>Import</h1>
    <div><span class="header">Source</span> <a v-bind:href="settings.fileListUrl"><icon name="external-link-alt" target="_blank"></icon></a>{{settings.fileListUrl}}</div>

    <div style="margin-top: 10px;">
      <div class="header">Map</div>
      <div>{{settings.from}}</div>
      <div>to: {{settings.to}}</div>
    </div>

    <div style="margin-top: 10px;">
      <div class="header">Process</div>
      <div v-if="importStatus.count">Source Images: {{importStatus.count}}</div>
      <div v-if="importStatus.processed">Imported: {{importStatus.processed}}</div>
      <div v-if="importStatus.files">Images in DB: {{importStatus.files}}</div>
      <div v-if="importStatus.scanned">Files To Delete: {{importStatus.scanned}}</div>
      <div v-if="importStatus.deleted">Files Deleted: {{importStatus.deleted}}</div>
      <div>{{importStatus.message}}</div>
    </div>

    <div v-if="importStatus.startedAt" style="margin-top: 10px;">
      <div class="header">Time</div>
      <div>Load Started: {{moment(importStatus.startedAt).format('h:mm:ss A')}}</div>
      <div v-if="importStatus.msToProcess">ETA: {{moment(importStatus.startedAt + importStatus.msToProcess).format('h:mm:ss A')}}</div>
    </div>

  </div>
</template>

<script>
import * as photoDb from '../lib/db';

export default {
  name: 'Importer',
  components: {},
  props: ['settings'],
  data () {
    return {
      importStatus: { message: 'Starting...' },
      inProgress: true
    };
  },
  worker: new Worker('static/WorkerImporter.js'),
  created () {
    this.$photoDb = photoDb;
    this.worker = new Worker('static/WorkerImporter.js');
    let _this = this;
    this.worker.onmessage = function (event) {
      _this.importStatus = event.data;
      if (event.data.message === 'Done.') {
        _this.inProgress = false;
      }
    };
  },
  mounted () {
    let _this = this;
    this.$photoDb.open(function () {
      _this.worker.postMessage({ action: 'refresh', settings: _this.settings });
    });
  },
  watch: {
    dbCreated: function (val) {
      if (val) { this.worker.postMessage({ action: 'dbCreated', settings: this.settings }) }
    },
    inProgress: function () {
      this.$emit('dbImportComplete');
    }
  }
};
</script>

<style scoped>
.importer-block {
  top: 16px;
  right: 16px;
  width: 300px;
  height: 90vh;
}
</style>
