/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Image loader, resizer & converter.
 *
 * Given an image (url or base64), it outputs sized and sliced images.
 *
 * Applications:
 * - Scale down large textures of non-standard size to a power-of-two (for mipmap purposes).
 * - Split large textures that exceed GPU texture limit (eg. 8K photospheres) into smaller ones.
 * - Generate small previews for images.
 *
 * API example:
 * - imgutil.load(url or base64 image);
 * - var width = imgutil.getGreatestPowerOfTwoLessThan(imgutil.getWidth());
 * - var height = imgutil.getGreatestPowerOfTwoLessThan(imgutil.getHeight());
 * - imgutil.resize({width: width, height: height}, function(resized) {
 *     console.log('Got resized image');
 *   });
 * - imgutil.split({rows: 2, cols: 2}, function(split) {
 *     // split is 2D row major. split[0][0] is top left, split[0][1] is top right.
 *   });
 */
function ImageUtil(opt_params) {
  var params = opt_params || {};
  this.minCols = 1;
  this.minRows = 2;

  this.queue = [];
}
ImageUtil.prototype = new Emitter();


ImageUtil.prototype.load = function(src) {
  this.image = document.createElement('img');
  this.image.crossOrigin = 'Anonymous';
  this.image.src = src;
  this.loadHandler = this.onLoad_.bind(this);
  this.image.addEventListener('load', this.loadHandler);
};

ImageUtil.prototype.onLoad_ = function(event) {
  if (!this.isValid()) {
    this.emit('error', 'Invalid photosphere aspect ratio. Try a real photosphere.');
    return;
  }
  var w = this.getWidth();
  var h = this.getHeight();
  console.log('Loaded image %d x %d', w, h);

  this.executeQueue();

  this.image.removeEventListener('load', this.loadHandler);
};

ImageUtil.prototype.getMaxTextureSize = function() {
  // Cache the output to avoid re-calculating this.
  if (this.maxTextureSize) {
    return this.maxTextureSize;
  }
  var canvas = document.createElement('canvas');
  var gl = canvas.getContext('webgl');
  this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  // TODO(smus): Is Safari mis-representing maximum texture size?
  // For now, this is a workaround due to this issue: http://goo.gl/ByRLXU
  if (Util.isIOS()) {
    this.maxTextureSize /= 2;
  }
  return this.maxTextureSize;
};

ImageUtil.prototype.isStereo = function() {
  return this.image.width == this.image.height;
};

ImageUtil.prototype.isMono = function() {
  return this.image.width == this.image.height * 2;
};

ImageUtil.prototype.isLoaded = function() {
  return this.image && this.image.height > 0 && this.image.width > 0;
};

ImageUtil.prototype.isValid = function() {
  return this.isLoaded() && (this.isStereo() || this.isMono());
};

ImageUtil.prototype.resize = function(params, callback) {
  var targetW = params.width;
  var targetH = params.height;
  var w = this.getWidth();
  var h = this.getHeight();
  if (!targetW || !targetH) {
    this.emit('error', 'Invalid target width and height specified for resize.');
    return;
  }
  // Already the right size, no need to resize.
  if (targetW == w && targetH == h) {
    callback(this.image.src);
    return;
  }
  console.log('Resizing image from %d x %d to %d x %d.', w, h, targetW, targetH);

  // Blit a resized version to the working canvas.
  var canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(this.image, 0, 0, this.getWidth(), this.getHeight(), 0, 0, targetW, targetH);
  callback(canvas.toDataURL('image/jpeg'));
};

/**
 * Resizes the image to the largest possible power-of-two size smaller than the original.
 */
ImageUtil.prototype.resizeToMaxPow2 = function(callback) {
  var width = this.getMaxPow2LessThan(this.getWidth());
  var height = this.getMaxPow2LessThan(this.getHeight());
  this.resize({width: width, height: height}, callback);
};

ImageUtil.prototype.getMaxPow2LessThan = function(value) {
  var exp = Math.floor(Math.log2(value));
  return Math.pow(2, exp);
};

ImageUtil.prototype.getWidth = function() {
  return this.image.width;
};

ImageUtil.prototype.getHeight = function() {
  return this.image.height;
};


/**
 * Given dimensions of a 2D matrix (eg [2,2]), splits the underlying image
 * into the respective images.
 */
ImageUtil.prototype.split = function(params, callback) {
  this.queueAdd(function() {
    this.splitHelper(params, callback);
  });
};

ImageUtil.prototype.splitHelper = function(params, callback) {
  var w = this.getWidth();
  var h = this.getHeight();
  var rows = params.rows || 1;
  var cols = params.cols || 1;

  if (rows == 1 && cols == 1) {
    console.warn('ImageUtil: split({rows: 1, cols: 1}) will do nothing.');
    callback([[this.image]]);
    return;
  }

  var output = [];
  for (var r = 0; r < rows; r++) {
    var row = [];
    for (var c = 0; c < cols; c++) {
      var canvas = document.createElement('canvas');
      canvas.width = w/cols;
      canvas.height = h/rows;

      var offsetX = c * w/cols;
      var offsetY = r * h/rows;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(this.image, offsetX, offsetY, w/cols, h/rows, 0, 0, w/cols, h/rows);

      row[c] = canvas;
    }
    output[r] = row;
  }
  // Callback just to be consistent with resizing APIs.
  callback(output);
};

ImageUtil.prototype.splitOptimal = function(callback) {
  this.queueAdd(function() {
    var params = this.getTiling();
    this.splitHelper(params, callback);
  });
};

/**
 * Returns the smallest possible tiling dimensions {rows: M cols: N} s.t.
 * each tile is less than the maximum texture size.
 */
ImageUtil.prototype.getTiling = function() {
  //var maxTextureSize = this.getMaxTextureSize();
  // TODO(smus): Maybe this isn't the best idea, potentially switch back later.
  var maxTextureSize = 1024;
  var width = this.getWidth();
  var height = this.getHeight();

  if (!Util.isPow2(maxTextureSize) ||
      !Util.isPow2(width) || !Util.isPow2(height)) {
    console.warn('maxTextureSize, width, and height should be powers of two.');
  }

  // Calculate the ratios and round them up.
  return {
    rows: Math.max(this.minRows, Math.ceil(height/maxTextureSize)),
    cols: Math.max(this.minCols, Math.ceil(width/maxTextureSize))
  };
};

/**
 * TODO: Refactor this stuff into a FunctionQueue class.
 */
ImageUtil.prototype.executeQueue = function() {
  while (this.queue.length) {
    var index = this.queue.length - 1;
    var func = this.queue[index];
    func();

    // Remove it from the queue.
    this.queue.splice(index, 1);
  }
};

/**
 * If image is loaded, evaluate immediately. Otherwise add to the queue
 * which will be evaluated when the image is loaded.
 */
ImageUtil.prototype.queueAdd = function(func) {
  func = func.bind(this);
  if (this.isLoaded()) {
    func();
  } else {
    this.queue.push(func);
  }
};