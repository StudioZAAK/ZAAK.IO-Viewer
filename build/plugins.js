(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * Copyright 2016 ZAAK GmbH All Rights Reserved.
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

var skybox = require('./plugins/skyboxes.js');
var spriteAnim = require('./plugins/spriteanimator.js');

// window.ZAAKPlugins = ZAAKPlugins;


},{"./plugins/skyboxes.js":2,"./plugins/spriteanimator.js":3}],2:[function(require,module,exports){
"use strict";
var Skyboxes = function(_viewer, _names, _tColor, _initialSky){

  //The main WebGL Viewer
  this.viewer = _viewer;

  //All names of all skies of the current stage
  this.skyNames = _names;

  //The first shown sky, it's good that this is the first/second in loading order
  this.initialSky = typeof _initialSky !== 'undefined' ? _initialSky : 0;
  //The actual skybox 3DObject
  this.skyBox = null;
  this.skyMaterial = null;
  this.skyShader = THREE.ShaderLib[ 'cube' ];
  this.cubemap = null;

  //Skybox size in 3D Space
  this.boxSize = 19;

  //Fade out transition object
  this.transition = null;
  _tColor = typeof _tColor !== 'undefined' ? _tColor : 0x000000;

  this.transitionColor = new THREE.Color( _tColor );

  //Loaders
  this.cubeTexLoader = new THREE.CubeTextureLoader();
  this.imageLoader = new THREE.ImageLoader();

  //Iteration Values
  this.currentSkyName = '';
  this.cubemapURL = '';

};

Skyboxes.prototype = {

  //Init
  init: function () {

    var scope = this;

    this.currentSkyName = this.skyNames[scope.initialSky];
    console.log(this.initialSky);
    console.log(scope.skyNames[scope.initialSky]);
    if(this.viewer.isMobile) this.currentSkyName += "_mobile";

    this.cubemapURL = [
      'img/sky/'+ this.currentSkyName + '/pano_2.jpg',
      'img/sky/'+ this.currentSkyName + '/pano_0.jpg',
      'img/sky/'+ this.currentSkyName + '/pano_4.jpg',
      'img/sky/'+ this.currentSkyName + '/pano_5.jpg',
      'img/sky/'+ this.currentSkyName + '/pano_1.jpg',
      'img/sky/'+ this.currentSkyName + '/pano_3.jpg'

    ];

    this.cubemap = this.cubeTexLoader.load(this.cubemapURL, function(){
      parent.initialSkyboxLoad();
      parent.iframeDidLoad();
      scope.preloadImages();
    });
          
    this.skyShader.uniforms[ 'tCube' ].value = this.cubemap;

    this.skyMaterial = new THREE.ShaderMaterial( {

      fragmentShader: this.skyShader.fragmentShader,
      vertexShader: this.skyShader.vertexShader,
      uniforms: this.skyShader.uniforms,
      side: THREE.BackSide

    } );

    this.skyBox = new THREE.Mesh(
      new THREE.BoxGeometry(this.boxSize, this.boxSize, this.boxSize),
      this.skyMaterial 
    );

    this.skyBox.position.set(0,0,0);
    this.viewer.scene.add(this.skyBox);

    //LoadingManager
    var geometry = new THREE.SphereGeometry( 1, 32, 32 );
    var material = new THREE.MeshBasicMaterial( {color: this.transitionColor, transparent:true, opacity:0, side: THREE.DoubleSide} );
    this.transition = new THREE.Mesh( geometry, material );
    this.transition.position.set (0,0,0);
    this.viewer.scene.add( this.transition );
  }, 

  preloadImages: function () {

    var found = false;
    var _tempSkyNames = [];
    for(var i = 1; i < this.skyNames.length; i++){

      found = false;

      for(var y = 0; y < parent.loadedSkies.length; y++){
      
        if(parent.loadedSkies[y] === this.skyNames[i] )
          found = true;
      }

      if(!found){
        _tempSkyNames.push(this.skyNames[i]);
        parent.loadedSkies.push(this.skyNames[i]);
      }
    }

    //LoadTextures
    for(var ii = 0; ii < _tempSkyNames.length; ii++){
      for(var iii = 0; iii < 6; iii++){

        this.currentSkyName = _tempSkyNames[ii];
        if(this.isMobile) this.currentSkyName += "_mobile";

        this.imageLoader.load( 'img/sky/'+ this.currentSkyName +'/pano_'+ iii +'.jpg', function(){
          parent.skyboxLoad();
        });    
      }
    }
  },

  recreateSky: function (_folderName, _newPos) {

    TweenMax.to(this.transition.material, top.fadeOut ,{opacity: 1, onComplete:this.transitionEnd, onCompleteParams:[_folderName, _newPos, this]});

  },

  transitionEnd: function (_folderName, _newPos, _scope) {

    _newPos = typeof _newPos !== 'undefined' ? _newPos : new THREE.Vector3( _scope.viewer.camera.position.x, _scope.viewer.camera.position.y, _scope.viewer.camera.position.z );

    if(_scope.viewer.isMobile) _folderName += "_mobile";

    var urlsNew = [
      'img/sky/' + _folderName + '/pano_2.jpg',
      'img/sky/' + _folderName + '/pano_0.jpg',
      'img/sky/' + _folderName + '/pano_4.jpg',
      'img/sky/' + _folderName + '/pano_5.jpg',
      'img/sky/' + _folderName + '/pano_1.jpg',
      'img/sky/' + _folderName + '/pano_3.jpg'
    ];

    _scope.cubemap = _scope.cubeTexLoader.load(urlsNew, function(map){
      _scope.skyShader.uniforms[ "tCube" ].value = map;
    });


    _scope.viewer.camera.position.set(_newPos.x, _newPos.y, _newPos.z);
    _scope.viewer.controls.resetSensor();

    _scope.skyBox.position.set(_scope.viewer.camera.position.x, _scope.viewer.camera.position.y, _scope.viewer.camera.position.z);
    _scope.transition.position.set(_scope.viewer.camera.position.x, _scope.viewer.camera.position.y, _scope.viewer.camera.position.z);

    TweenMax.to(_scope.transition.material, top.fadeIn, {opacity:0});

  }
};
},{}],3:[function(require,module,exports){
"use strict";
var SpriteAnimator = function(texture, tilesHoriz, tilesVert, numTiles, tileDispDuration) 
{ 
  // note: texture passed by reference, will be updated by the update function.
  this.texture = texture;

  this.tilesHorizontal = tilesHoriz;
  this.tilesVertical = tilesVert;
  // how many images does this spritesheet contain?
  //  usually equals tilesHoriz * tilesVert, but not necessarily,
  //  if there at blank tiles at the bottom of the spritesheet. 
  this.numberOfTiles = numTiles;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; 
  texture.repeat.set( 1 / this.tilesHorizontal, 1 / this.tilesVertical );

  // how long should each image be displayed?
  this.tileDisplayDuration = tileDispDuration;

  // how long has the current image been displayed?
  this.currentDisplayTime = 0;

  // which image is currently being displayed?
  this.currentTile = 0;

};

SpriteAnimator.prototype = { 

  update: function (_delta) {
    if(!isNaN(_delta)){
        
      this.currentDisplayTime += _delta*1000;

      while (this.currentDisplayTime > this.tileDisplayDuration)
      {
        this.currentDisplayTime -= this.tileDisplayDuration;
        this.currentTile++;
        if (this.currentTile == this.numberOfTiles)
          this.currentTile = 0;
        var currentColumn = this.currentTile % this.tilesHorizontal;
        this.texture.offset.x = currentColumn / this.tilesHorizontal;
        var currentRow = Math.floor( this.currentTile / this.tilesHorizontal );
        this.texture.offset.y = currentRow / this.tilesVertical;
      }
    }
  }
};
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvcGx1Z2luLmpzIiwic3JjL3BsdWdpbnMvc2t5Ym94ZXMuanMiLCJzcmMvcGx1Z2lucy9zcHJpdGVhbmltYXRvci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgWkFBSyBHbWJIIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIHNreWJveCA9IHJlcXVpcmUoJy4vcGx1Z2lucy9za3lib3hlcy5qcycpO1xudmFyIHNwcml0ZUFuaW0gPSByZXF1aXJlKCcuL3BsdWdpbnMvc3ByaXRlYW5pbWF0b3IuanMnKTtcblxuLy8gd2luZG93LlpBQUtQbHVnaW5zID0gWkFBS1BsdWdpbnM7XG5cbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIFNreWJveGVzID0gZnVuY3Rpb24oX3ZpZXdlciwgX25hbWVzLCBfdENvbG9yLCBfaW5pdGlhbFNreSl7XG5cbiAgLy9UaGUgbWFpbiBXZWJHTCBWaWV3ZXJcbiAgdGhpcy52aWV3ZXIgPSBfdmlld2VyO1xuXG4gIC8vQWxsIG5hbWVzIG9mIGFsbCBza2llcyBvZiB0aGUgY3VycmVudCBzdGFnZVxuICB0aGlzLnNreU5hbWVzID0gX25hbWVzO1xuXG4gIC8vVGhlIGZpcnN0IHNob3duIHNreSwgaXQncyBnb29kIHRoYXQgdGhpcyBpcyB0aGUgZmlyc3Qvc2Vjb25kIGluIGxvYWRpbmcgb3JkZXJcbiAgdGhpcy5pbml0aWFsU2t5ID0gdHlwZW9mIF9pbml0aWFsU2t5ICE9PSAndW5kZWZpbmVkJyA/IF9pbml0aWFsU2t5IDogMDtcbiAgLy9UaGUgYWN0dWFsIHNreWJveCAzRE9iamVjdFxuICB0aGlzLnNreUJveCA9IG51bGw7XG4gIHRoaXMuc2t5TWF0ZXJpYWwgPSBudWxsO1xuICB0aGlzLnNreVNoYWRlciA9IFRIUkVFLlNoYWRlckxpYlsgJ2N1YmUnIF07XG4gIHRoaXMuY3ViZW1hcCA9IG51bGw7XG5cbiAgLy9Ta3lib3ggc2l6ZSBpbiAzRCBTcGFjZVxuICB0aGlzLmJveFNpemUgPSAxOTtcblxuICAvL0ZhZGUgb3V0IHRyYW5zaXRpb24gb2JqZWN0XG4gIHRoaXMudHJhbnNpdGlvbiA9IG51bGw7XG4gIF90Q29sb3IgPSB0eXBlb2YgX3RDb2xvciAhPT0gJ3VuZGVmaW5lZCcgPyBfdENvbG9yIDogMHgwMDAwMDA7XG5cbiAgdGhpcy50cmFuc2l0aW9uQ29sb3IgPSBuZXcgVEhSRUUuQ29sb3IoIF90Q29sb3IgKTtcblxuICAvL0xvYWRlcnNcbiAgdGhpcy5jdWJlVGV4TG9hZGVyID0gbmV3IFRIUkVFLkN1YmVUZXh0dXJlTG9hZGVyKCk7XG4gIHRoaXMuaW1hZ2VMb2FkZXIgPSBuZXcgVEhSRUUuSW1hZ2VMb2FkZXIoKTtcblxuICAvL0l0ZXJhdGlvbiBWYWx1ZXNcbiAgdGhpcy5jdXJyZW50U2t5TmFtZSA9ICcnO1xuICB0aGlzLmN1YmVtYXBVUkwgPSAnJztcblxufTtcblxuU2t5Ym94ZXMucHJvdG90eXBlID0ge1xuXG4gIC8vSW5pdFxuICBpbml0OiBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgc2NvcGUgPSB0aGlzO1xuXG4gICAgdGhpcy5jdXJyZW50U2t5TmFtZSA9IHRoaXMuc2t5TmFtZXNbc2NvcGUuaW5pdGlhbFNreV07XG4gICAgY29uc29sZS5sb2codGhpcy5pbml0aWFsU2t5KTtcbiAgICBjb25zb2xlLmxvZyhzY29wZS5za3lOYW1lc1tzY29wZS5pbml0aWFsU2t5XSk7XG4gICAgaWYodGhpcy52aWV3ZXIuaXNNb2JpbGUpIHRoaXMuY3VycmVudFNreU5hbWUgKz0gXCJfbW9iaWxlXCI7XG5cbiAgICB0aGlzLmN1YmVtYXBVUkwgPSBbXG4gICAgICAnaW1nL3NreS8nKyB0aGlzLmN1cnJlbnRTa3lOYW1lICsgJy9wYW5vXzIuanBnJyxcbiAgICAgICdpbWcvc2t5LycrIHRoaXMuY3VycmVudFNreU5hbWUgKyAnL3Bhbm9fMC5qcGcnLFxuICAgICAgJ2ltZy9za3kvJysgdGhpcy5jdXJyZW50U2t5TmFtZSArICcvcGFub180LmpwZycsXG4gICAgICAnaW1nL3NreS8nKyB0aGlzLmN1cnJlbnRTa3lOYW1lICsgJy9wYW5vXzUuanBnJyxcbiAgICAgICdpbWcvc2t5LycrIHRoaXMuY3VycmVudFNreU5hbWUgKyAnL3Bhbm9fMS5qcGcnLFxuICAgICAgJ2ltZy9za3kvJysgdGhpcy5jdXJyZW50U2t5TmFtZSArICcvcGFub18zLmpwZydcblxuICAgIF07XG5cbiAgICB0aGlzLmN1YmVtYXAgPSB0aGlzLmN1YmVUZXhMb2FkZXIubG9hZCh0aGlzLmN1YmVtYXBVUkwsIGZ1bmN0aW9uKCl7XG4gICAgICBwYXJlbnQuaW5pdGlhbFNreWJveExvYWQoKTtcbiAgICAgIHBhcmVudC5pZnJhbWVEaWRMb2FkKCk7XG4gICAgICBzY29wZS5wcmVsb2FkSW1hZ2VzKCk7XG4gICAgfSk7XG4gICAgICAgICAgXG4gICAgdGhpcy5za3lTaGFkZXIudW5pZm9ybXNbICd0Q3ViZScgXS52YWx1ZSA9IHRoaXMuY3ViZW1hcDtcblxuICAgIHRoaXMuc2t5TWF0ZXJpYWwgPSBuZXcgVEhSRUUuU2hhZGVyTWF0ZXJpYWwoIHtcblxuICAgICAgZnJhZ21lbnRTaGFkZXI6IHRoaXMuc2t5U2hhZGVyLmZyYWdtZW50U2hhZGVyLFxuICAgICAgdmVydGV4U2hhZGVyOiB0aGlzLnNreVNoYWRlci52ZXJ0ZXhTaGFkZXIsXG4gICAgICB1bmlmb3JtczogdGhpcy5za3lTaGFkZXIudW5pZm9ybXMsXG4gICAgICBzaWRlOiBUSFJFRS5CYWNrU2lkZVxuXG4gICAgfSApO1xuXG4gICAgdGhpcy5za3lCb3ggPSBuZXcgVEhSRUUuTWVzaChcbiAgICAgIG5ldyBUSFJFRS5Cb3hHZW9tZXRyeSh0aGlzLmJveFNpemUsIHRoaXMuYm94U2l6ZSwgdGhpcy5ib3hTaXplKSxcbiAgICAgIHRoaXMuc2t5TWF0ZXJpYWwgXG4gICAgKTtcblxuICAgIHRoaXMuc2t5Qm94LnBvc2l0aW9uLnNldCgwLDAsMCk7XG4gICAgdGhpcy52aWV3ZXIuc2NlbmUuYWRkKHRoaXMuc2t5Qm94KTtcblxuICAgIC8vTG9hZGluZ01hbmFnZXJcbiAgICB2YXIgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuU3BoZXJlR2VvbWV0cnkoIDEsIDMyLCAzMiApO1xuICAgIHZhciBtYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCgge2NvbG9yOiB0aGlzLnRyYW5zaXRpb25Db2xvciwgdHJhbnNwYXJlbnQ6dHJ1ZSwgb3BhY2l0eTowLCBzaWRlOiBUSFJFRS5Eb3VibGVTaWRlfSApO1xuICAgIHRoaXMudHJhbnNpdGlvbiA9IG5ldyBUSFJFRS5NZXNoKCBnZW9tZXRyeSwgbWF0ZXJpYWwgKTtcbiAgICB0aGlzLnRyYW5zaXRpb24ucG9zaXRpb24uc2V0ICgwLDAsMCk7XG4gICAgdGhpcy52aWV3ZXIuc2NlbmUuYWRkKCB0aGlzLnRyYW5zaXRpb24gKTtcbiAgfSwgXG5cbiAgcHJlbG9hZEltYWdlczogZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGZvdW5kID0gZmFsc2U7XG4gICAgdmFyIF90ZW1wU2t5TmFtZXMgPSBbXTtcbiAgICBmb3IodmFyIGkgPSAxOyBpIDwgdGhpcy5za3lOYW1lcy5sZW5ndGg7IGkrKyl7XG5cbiAgICAgIGZvdW5kID0gZmFsc2U7XG5cbiAgICAgIGZvcih2YXIgeSA9IDA7IHkgPCBwYXJlbnQubG9hZGVkU2tpZXMubGVuZ3RoOyB5Kyspe1xuICAgICAgXG4gICAgICAgIGlmKHBhcmVudC5sb2FkZWRTa2llc1t5XSA9PT0gdGhpcy5za3lOYW1lc1tpXSApXG4gICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZighZm91bmQpe1xuICAgICAgICBfdGVtcFNreU5hbWVzLnB1c2godGhpcy5za3lOYW1lc1tpXSk7XG4gICAgICAgIHBhcmVudC5sb2FkZWRTa2llcy5wdXNoKHRoaXMuc2t5TmFtZXNbaV0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vTG9hZFRleHR1cmVzXG4gICAgZm9yKHZhciBpaSA9IDA7IGlpIDwgX3RlbXBTa3lOYW1lcy5sZW5ndGg7IGlpKyspe1xuICAgICAgZm9yKHZhciBpaWkgPSAwOyBpaWkgPCA2OyBpaWkrKyl7XG5cbiAgICAgICAgdGhpcy5jdXJyZW50U2t5TmFtZSA9IF90ZW1wU2t5TmFtZXNbaWldO1xuICAgICAgICBpZih0aGlzLmlzTW9iaWxlKSB0aGlzLmN1cnJlbnRTa3lOYW1lICs9IFwiX21vYmlsZVwiO1xuXG4gICAgICAgIHRoaXMuaW1hZ2VMb2FkZXIubG9hZCggJ2ltZy9za3kvJysgdGhpcy5jdXJyZW50U2t5TmFtZSArJy9wYW5vXycrIGlpaSArJy5qcGcnLCBmdW5jdGlvbigpe1xuICAgICAgICAgIHBhcmVudC5za3lib3hMb2FkKCk7XG4gICAgICAgIH0pOyAgICBcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgcmVjcmVhdGVTa3k6IGZ1bmN0aW9uIChfZm9sZGVyTmFtZSwgX25ld1Bvcykge1xuXG4gICAgVHdlZW5NYXgudG8odGhpcy50cmFuc2l0aW9uLm1hdGVyaWFsLCB0b3AuZmFkZU91dCAse29wYWNpdHk6IDEsIG9uQ29tcGxldGU6dGhpcy50cmFuc2l0aW9uRW5kLCBvbkNvbXBsZXRlUGFyYW1zOltfZm9sZGVyTmFtZSwgX25ld1BvcywgdGhpc119KTtcblxuICB9LFxuXG4gIHRyYW5zaXRpb25FbmQ6IGZ1bmN0aW9uIChfZm9sZGVyTmFtZSwgX25ld1BvcywgX3Njb3BlKSB7XG5cbiAgICBfbmV3UG9zID0gdHlwZW9mIF9uZXdQb3MgIT09ICd1bmRlZmluZWQnID8gX25ld1BvcyA6IG5ldyBUSFJFRS5WZWN0b3IzKCBfc2NvcGUudmlld2VyLmNhbWVyYS5wb3NpdGlvbi54LCBfc2NvcGUudmlld2VyLmNhbWVyYS5wb3NpdGlvbi55LCBfc2NvcGUudmlld2VyLmNhbWVyYS5wb3NpdGlvbi56ICk7XG5cbiAgICBpZihfc2NvcGUudmlld2VyLmlzTW9iaWxlKSBfZm9sZGVyTmFtZSArPSBcIl9tb2JpbGVcIjtcblxuICAgIHZhciB1cmxzTmV3ID0gW1xuICAgICAgJ2ltZy9za3kvJyArIF9mb2xkZXJOYW1lICsgJy9wYW5vXzIuanBnJyxcbiAgICAgICdpbWcvc2t5LycgKyBfZm9sZGVyTmFtZSArICcvcGFub18wLmpwZycsXG4gICAgICAnaW1nL3NreS8nICsgX2ZvbGRlck5hbWUgKyAnL3Bhbm9fNC5qcGcnLFxuICAgICAgJ2ltZy9za3kvJyArIF9mb2xkZXJOYW1lICsgJy9wYW5vXzUuanBnJyxcbiAgICAgICdpbWcvc2t5LycgKyBfZm9sZGVyTmFtZSArICcvcGFub18xLmpwZycsXG4gICAgICAnaW1nL3NreS8nICsgX2ZvbGRlck5hbWUgKyAnL3Bhbm9fMy5qcGcnXG4gICAgXTtcblxuICAgIF9zY29wZS5jdWJlbWFwID0gX3Njb3BlLmN1YmVUZXhMb2FkZXIubG9hZCh1cmxzTmV3LCBmdW5jdGlvbihtYXApe1xuICAgICAgX3Njb3BlLnNreVNoYWRlci51bmlmb3Jtc1sgXCJ0Q3ViZVwiIF0udmFsdWUgPSBtYXA7XG4gICAgfSk7XG5cblxuICAgIF9zY29wZS52aWV3ZXIuY2FtZXJhLnBvc2l0aW9uLnNldChfbmV3UG9zLngsIF9uZXdQb3MueSwgX25ld1Bvcy56KTtcbiAgICBfc2NvcGUudmlld2VyLmNvbnRyb2xzLnJlc2V0U2Vuc29yKCk7XG5cbiAgICBfc2NvcGUuc2t5Qm94LnBvc2l0aW9uLnNldChfc2NvcGUudmlld2VyLmNhbWVyYS5wb3NpdGlvbi54LCBfc2NvcGUudmlld2VyLmNhbWVyYS5wb3NpdGlvbi55LCBfc2NvcGUudmlld2VyLmNhbWVyYS5wb3NpdGlvbi56KTtcbiAgICBfc2NvcGUudHJhbnNpdGlvbi5wb3NpdGlvbi5zZXQoX3Njb3BlLnZpZXdlci5jYW1lcmEucG9zaXRpb24ueCwgX3Njb3BlLnZpZXdlci5jYW1lcmEucG9zaXRpb24ueSwgX3Njb3BlLnZpZXdlci5jYW1lcmEucG9zaXRpb24ueik7XG5cbiAgICBUd2Vlbk1heC50byhfc2NvcGUudHJhbnNpdGlvbi5tYXRlcmlhbCwgdG9wLmZhZGVJbiwge29wYWNpdHk6MH0pO1xuXG4gIH1cbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgU3ByaXRlQW5pbWF0b3IgPSBmdW5jdGlvbih0ZXh0dXJlLCB0aWxlc0hvcml6LCB0aWxlc1ZlcnQsIG51bVRpbGVzLCB0aWxlRGlzcER1cmF0aW9uKSBcbnsgXG4gIC8vIG5vdGU6IHRleHR1cmUgcGFzc2VkIGJ5IHJlZmVyZW5jZSwgd2lsbCBiZSB1cGRhdGVkIGJ5IHRoZSB1cGRhdGUgZnVuY3Rpb24uXG4gIHRoaXMudGV4dHVyZSA9IHRleHR1cmU7XG5cbiAgdGhpcy50aWxlc0hvcml6b250YWwgPSB0aWxlc0hvcml6O1xuICB0aGlzLnRpbGVzVmVydGljYWwgPSB0aWxlc1ZlcnQ7XG4gIC8vIGhvdyBtYW55IGltYWdlcyBkb2VzIHRoaXMgc3ByaXRlc2hlZXQgY29udGFpbj9cbiAgLy8gIHVzdWFsbHkgZXF1YWxzIHRpbGVzSG9yaXogKiB0aWxlc1ZlcnQsIGJ1dCBub3QgbmVjZXNzYXJpbHksXG4gIC8vICBpZiB0aGVyZSBhdCBibGFuayB0aWxlcyBhdCB0aGUgYm90dG9tIG9mIHRoZSBzcHJpdGVzaGVldC4gXG4gIHRoaXMubnVtYmVyT2ZUaWxlcyA9IG51bVRpbGVzO1xuICB0ZXh0dXJlLndyYXBTID0gdGV4dHVyZS53cmFwVCA9IFRIUkVFLlJlcGVhdFdyYXBwaW5nOyBcbiAgdGV4dHVyZS5yZXBlYXQuc2V0KCAxIC8gdGhpcy50aWxlc0hvcml6b250YWwsIDEgLyB0aGlzLnRpbGVzVmVydGljYWwgKTtcblxuICAvLyBob3cgbG9uZyBzaG91bGQgZWFjaCBpbWFnZSBiZSBkaXNwbGF5ZWQ/XG4gIHRoaXMudGlsZURpc3BsYXlEdXJhdGlvbiA9IHRpbGVEaXNwRHVyYXRpb247XG5cbiAgLy8gaG93IGxvbmcgaGFzIHRoZSBjdXJyZW50IGltYWdlIGJlZW4gZGlzcGxheWVkP1xuICB0aGlzLmN1cnJlbnREaXNwbGF5VGltZSA9IDA7XG5cbiAgLy8gd2hpY2ggaW1hZ2UgaXMgY3VycmVudGx5IGJlaW5nIGRpc3BsYXllZD9cbiAgdGhpcy5jdXJyZW50VGlsZSA9IDA7XG5cbn07XG5cblNwcml0ZUFuaW1hdG9yLnByb3RvdHlwZSA9IHsgXG5cbiAgdXBkYXRlOiBmdW5jdGlvbiAoX2RlbHRhKSB7XG4gICAgaWYoIWlzTmFOKF9kZWx0YSkpe1xuICAgICAgICBcbiAgICAgIHRoaXMuY3VycmVudERpc3BsYXlUaW1lICs9IF9kZWx0YSoxMDAwO1xuXG4gICAgICB3aGlsZSAodGhpcy5jdXJyZW50RGlzcGxheVRpbWUgPiB0aGlzLnRpbGVEaXNwbGF5RHVyYXRpb24pXG4gICAgICB7XG4gICAgICAgIHRoaXMuY3VycmVudERpc3BsYXlUaW1lIC09IHRoaXMudGlsZURpc3BsYXlEdXJhdGlvbjtcbiAgICAgICAgdGhpcy5jdXJyZW50VGlsZSsrO1xuICAgICAgICBpZiAodGhpcy5jdXJyZW50VGlsZSA9PSB0aGlzLm51bWJlck9mVGlsZXMpXG4gICAgICAgICAgdGhpcy5jdXJyZW50VGlsZSA9IDA7XG4gICAgICAgIHZhciBjdXJyZW50Q29sdW1uID0gdGhpcy5jdXJyZW50VGlsZSAlIHRoaXMudGlsZXNIb3Jpem9udGFsO1xuICAgICAgICB0aGlzLnRleHR1cmUub2Zmc2V0LnggPSBjdXJyZW50Q29sdW1uIC8gdGhpcy50aWxlc0hvcml6b250YWw7XG4gICAgICAgIHZhciBjdXJyZW50Um93ID0gTWF0aC5mbG9vciggdGhpcy5jdXJyZW50VGlsZSAvIHRoaXMudGlsZXNIb3Jpem9udGFsICk7XG4gICAgICAgIHRoaXMudGV4dHVyZS5vZmZzZXQueSA9IGN1cnJlbnRSb3cgLyB0aGlzLnRpbGVzVmVydGljYWw7XG4gICAgICB9XG4gICAgfVxuICB9XG59OyJdfQ==
