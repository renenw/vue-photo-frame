/*
* http://blog.teamtreehouse.com/create-your-own-to-do-app-with-html5-and-indexeddb
*
* y = function(photos) { console.log(photos); }
*
* photoDB.open();
* photoDB.put({url: 'abc', stars: 4}, y);   # upsert
* photoDB.index(y);
* photoDB.get('abc', y);
* photoDB.clear();
*
*/

export { open, next, count, version, get, index, put, changeStars, flagAsDeleted, filteredCount, clear, printSequenceForUrl };

const DB_VERSION = 74;

let datastore = null;

function version () {
  return DB_VERSION;
}

// usually you'd pass in a callback
function open (callback = null) {
  let request = indexedDB.open('photos', DB_VERSION);

  request.onupgradeneeded = function (e) {
    let db = e.target.result;
    e.target.transaction.onerror = db.onerror;

    if (db.objectStoreNames.contains('photo')) { db.deleteObjectStore('photo') }
    let photoStore = db.createObjectStore('photo', { keyPath: 'url' });
    photoStore.createIndex('photo_existed_at', 'existed_at', { unique: false });

    if (db.objectStoreNames.contains('sequence')) { db.deleteObjectStore('sequence') }
    let sequenceStore = db.createObjectStore('sequence', { keyPath: ['url', 'sequence'] });
    sequenceStore.createIndex('squence_url', 'url', { unique: false });
    sequenceStore.createIndex('squence_sequence', 'sequence', { unique: false });
  };

  // Handle successful datastore access.
  request.onsuccess = function (e) {
    datastore = e.target.result;
    if (callback) {
      callback();
    }
  };

  request.onblocked = function (e) {
    console.log('Database blocked.');
    console.log(e);
  };

  request.onerror = function (e) {
    console.log('Failed to open db. Try to delete database in dev console, appliction.');
    console.log(e);
  };
}

function get (url, callback) {
  let transaction = datastore.transaction(['photo'], 'readonly');
  let objectStore = transaction.objectStore('photo');
  let request = objectStore.get(url);
  transaction.onerror = function (event) { console.log('Transaction not opened due to error: ' + transaction.error) };
  request.onsuccess = function (e) { callback(request.result) };
}

function next (currentSequenceNumber, filterString, callback) {
  findNext(currentSequenceNumber, filterString, function (nextPhoto) {
    if (nextPhoto) {
      callback(nextPhoto);
    } else {
      findNext(0, filterString, callback);
    }
  });
}

function findNext (currentSequenceNumber, filterString, callback) {
  let transaction = datastore.transaction(['sequence'], 'readonly');
  let objectStore = transaction.objectStore('sequence');
  let cursorRequest = objectStore.index('squence_sequence').openCursor(IDBKeyRange.lowerBound(currentSequenceNumber, true));
  let photo = null;
  let filter = ((filterString || '') !== '');
  cursorRequest.onsuccess = function (e) {
    let result = e.target.result;
    if (!!result === false) {
    } else {
      if (result.value.enabled && (!filter || (result.value['url'].includes(filterString)))) {
        photo = result.value;
      } else {
        result.continue();
      }
    }
  };
  transaction.oncomplete = function (e) { callback(photo) };
}

function printSequenceForUrl (url) {
  let transaction = datastore.transaction(['sequence'], 'readonly');
  let objectStore = transaction.objectStore('sequence');
  let cursorRequest = objectStore.index('squence_url').openCursor(IDBKeyRange.only(url));
  cursorRequest.onsuccess = function (e) {
    let result = e.target.result;
    if (!!result === false) {
    } else {
      console.log({
        sequence: result.value.sequence,
        enabled: result.value.enabled
      });
      result.continue();
    }
  };
}

function changeStars (url, currentSequenceNumber, change) {
  let enable = (change === 1);
  let transaction = datastore.transaction(['sequence'], 'readwrite');
  let objectStore = transaction.objectStore('sequence');
  let cursorRequest = objectStore.index('squence_url').openCursor(IDBKeyRange.only(url));
  let photos = [];
  cursorRequest.onsuccess = function (e) {
    let result = e.target.result;
    if (!!result === false) {
      let photo = photos[ Math.floor(Math.random() * photos.length) ];
      if (photo) {
        photo.enabled = enable;
        objectStore.put(photo);
      }
    } else {
      if (result.value.enabled === !enable) {
        photos.push(result.value);
        result.continue();
      } else {
        result.continue();
      }
    }
  };
  // transaction.oncomplete = function (e) { callback(photo) };
}

function flagAsDeleted (url) {
  let transaction = datastore.transaction(['sequence'], 'readwrite');
  let objectStore = transaction.objectStore('sequence');
  let cursorRequest = objectStore.index('squence_url').openCursor(IDBKeyRange.only(url));
  cursorRequest.onsuccess = function (e) {
    let result = e.target.result;
    if (!!result === false) {
    } else {
      let photo = result.value;
      photo.enabled = false;
      result.update(photo);
      result.continue();
    }
  };
}

function count (callback) {
  let transaction = datastore.transaction(['photo'], 'readonly');
  let objectStore = transaction.objectStore('photo');
  let countRequest = objectStore.count();
  countRequest.onsuccess = function () { callback(countRequest.result) };
}

function filteredCount (filterString, callback) {
  let transaction = datastore.transaction(['photo'], 'readonly');
  let objectStore = transaction.objectStore('photo');
  let cursorRequest = objectStore.openCursor();
  let count = 0;
  let filter = ((filterString || '') !== '');
  cursorRequest.onsuccess = function (e) {
    let result = e.target.result;
    if (!!result === false) {
    } else {
      if (!filter || (result.value['url'].includes(filterString))) { count = count + 1 };
      result.continue();
    }
  };
  transaction.oncomplete = function (e) { callback(count) };
}

// note: this works as an upsert - you might want to code this differently in other circumstances
function put (photo, callback) {
  let transaction = datastore.transaction(['photo'], 'readwrite');
  let objectStore = transaction.objectStore('photo');
  let readRequest = objectStore.get(photo['url']);
  readRequest.onsuccess = function (e) {
    let existingPhoto = readRequest.result;
    let objectToWrite = Object.assign(existingPhoto, photo);
    objectStore.put(objectToWrite);
  };
  transaction.oncomplete = function (e) { if (callback) { callback(count) } };
}

// not used by app (for debug etc)

function index (callback) {
  let transaction = datastore.transaction(['photo'], 'readonly');
  let objectStore = transaction.objectStore('photo');
  let cursorRequest = objectStore.openCursor();
  let photos = [];

  cursorRequest.onsuccess = function (e) {
    let result = e.target.result;
    if (!!result === false) { return }
    photos.push(result.value);
    result.continue();
  };

  transaction.oncomplete = function (e) { callback(photos) };
}

function clear () {
  let transaction = datastore.transaction(['photo'], 'readwrite');
  transaction.oncomplete = function (event) { console.log('Transaction compelte') };
  transaction.onerror = function (event) { console.log('Failed: ' + transaction.error) };
  let objectStore = transaction.objectStore('photo');
  let objectStoreRequest = objectStore.clear();
  objectStoreRequest.onsuccess = function (event) { console.log('Cleared.') };
};
