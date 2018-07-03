const LOAD_LIMIT = 40;

let settings  = null;
let datastore = null;

let linesToProcess = null;
let lineNumber = 0;
let lineCount = 0;
let timestamp = null;

let filesToDelete = [];
let deleteFileNumber = -1;
let filesToBeDeleted = 0;

onmessage = function (e) {
  console.log('Message To Worker: ' + e.data.action);
  settings = e.data.settings;
  if (e.data.action==='refresh') { openDbAndLoad() }
}

let status = {
  message: '',
  startedAt: null,
  processed: 0
}

function openDbAndLoad () {
  setStatus('Opening database...');
  let request = indexedDB.open('photos', settings.dbVersion);
  request.onsuccess = function (e) {
    datastore = e.target.result;
    setStatus('Retrieving images listing...');
    fetchList(settings.fileListUrl)
      .then(lines => {
        lineNummber = 0;
        linesToProcess = lines;
        lineCount = lines.length;
        timestamp = Date.now();
        status.startedAt = timestamp;
        status['count'] = lineCount;
        setStatus('Processing...');
        loadNextLine();
      });
  };
  request.onerror = function (e) {
    setStatus('Failed to open db: ' + e);
  };
}

function loadNextLine () {
  line = linesToProcess[lineNumber];
  if (line) {
    let fileName = line.trim().replace(settings.from, '').replace(/\\/g, '/');
    fileName = settings.to + encodeURI(fileName);
    put(fileName, timestamp);
  } else {
    continueToNextLine();
  }
}

function continueToNextLine() {
  lineNumber = lineNumber + 1;
  setProcessedCount(lineNumber);
  if ((lineNumber<lineCount) && (lineNumber<(LOAD_LIMIT || Number.MAX_SAFE_INTEGER))) {
    setTimeout(loadNextLine);
  } else {
    prepareToRemoveDeletedFiles(timestamp);
  }
}

function put (url, timestamp) {

 
  let transaction = datastore.transaction(['photo', 'sequence'], 'readwrite');
  let photoStore = transaction.objectStore('photo');
  let sequenceStore = transaction.objectStore('sequence');

  let readRequest = photoStore.get(url);
  readRequest.onsuccess = function (e) {
    let newPhoto = false;
    let photo = readRequest.result;
    if (typeof photo === 'undefined') {
      newPhoto = true;
      photo = { url: url, stars: 3, count: 0 }
    };
    photo.existed_at = timestamp;
    photoStore.put(photo);
    if (newPhoto) {
      for (let i = 0; i < 5; i++) { 
        sequenceStore.put( { sequence: Math.random(), url: url, enabled: (i<3) } );
      }
    }
  };

  transaction.oncomplete = function () {
    continueToNextLine();
  }

  transaction.onabort = function (e) {
    console.log('Abort');
    console.log('put: ' + url);
    console.log(e);
  }

  transaction.onerror = function (e) {
    console.log('Error');
    console.log('put: ' + url);
    console.log(e);
  }

}

function prepareToRemoveDeletedFiles (timestamp) {
  setStatus('Counting images in database...');
  count(function (n) {
    setFileCount(n);
    buildListOfDeletedFiles(timestamp);
  });
}

function buildListOfDeletedFiles (timestamp) {
  setStatus('Building list of redundant images...');
  let transaction = datastore.transaction(['photo'], 'readonly');
  let photoStore = transaction.objectStore('photo');
  let photoCursor = photoStore.index('photo_existed_at').openCursor(IDBKeyRange.upperBound(timestamp, true));
  let n = 0;
  photoCursor.onsuccess = function (event) {
    let result = event.target.result;
    if (result) {
      if (result.value && result.value.existed_at < timestamp) {
        filesToDelete.push(result.value.url);
      }
      n = n + 1;
      setScanCount(n);
      setTimeout(result.continue());
    }
  }
  transaction.oncomplete = function () {
    filesToBeDeleted = filesToDelete.length;
    setFilesToDelete(filesToBeDeleted);
    setStatus('Deleting');
    deleteNextFile();
  }
}

function deleteNextFile () {
  deleteFileNumber = deleteFileNumber + 1;
  setDeletedCount(deleteFileNumber);

  if (deleteFileNumber<filesToBeDeleted) {
    setTimeout(deleteFile);
  } else {
    setStatus('Done.'); // We match on this in the Vue app, so be careful if changing it.
  }
}

function deleteFile () {
  let url = filesToDelete[deleteFileNumber];
  let transaction = datastore.transaction(['photo', 'sequence'], 'readwrite');
  let photoStore = transaction.objectStore('photo');
  let sequenceStore = transaction.objectStore('sequence');

  let urlFilter = IDBKeyRange.only(url);

  let sequenceCursor = sequenceStore.index('squence_url').openCursor(urlFilter);
  sequenceCursor.onsuccess = function (event) {
    let sequence = event.target.result;
    if (sequence) {
      sequence.delete();
      sequence.continue();
    }
  }

  let photoCursor = photoStore.openCursor(urlFilter);
  photoCursor.onsuccess = function (event) {
    let photo = event.target.result;
    if (photo) {
      photo.delete();
      photo.continue();
    }
  }

  transaction.oncomplete = function () {
    deleteNextFile();
  }
}

function count (callback) {
  let transaction = datastore.transaction(['photo'], 'readonly');
  let objectStore = transaction.objectStore('photo');
  let countRequest = objectStore.count();
  countRequest.onsuccess = function () { callback(countRequest.result) };
}

function fetchList(fileListUrl) {
  return fetch(fileListUrl)
    .then(res => res.text())
    .then(out => out.split('\n'))
    .catch(err => { throw err });
}

function setProcessedCount (n) {
  status['processed'] = n;
  status['msToProcess'] = ((Date.now() - timestamp) / n)*lineCount;
  postMessage(status);  
}

function setDeletedCount (n) {
  status['deleted'] = n;
  postMessage(status);  
}

function setScanCount (n) {
  status['scanned'] = n;
  postMessage(status);
}

function setFileCount (n) {
  status['files'] = n;
  postMessage(status);
}

function setFilesToDelete (n) {
  status['filesToDelete'] = n;
  postMessage(status);
}

function setStatus (message) {
  status['message'] = message;
  postMessage(status);
}

