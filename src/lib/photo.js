import EXIF from 'exif-js';

export { get };

function get (imageTarget) {
  return Promise.all([
    getExif(imageTarget)
    // Vibrant.from(imageTarget.src).getPalette()
  ]);
}

function getExif (imageTarget) {
  return new Promise(function (resolve, reject) {
    exifExtract(imageTarget, function (result) {
      resolve(result);
    });
  });
}

function exifExtract (imageTarget, callback) {
  imageTarget.exifdata = null;
  EXIF.getData(imageTarget, function () {
    callback(EXIF.getAllTags(imageTarget));
  });
}
