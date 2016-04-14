"use strict";
var Skyboxes = function(_viewer, _names){

  this.viewer = _viewer;

  this.skyNames = _names;

  this.currentSkyName = '';
  this.cubemapURL = '';

  this.skyBox = null;
  this.skyMaterial = null;
  this.skyShader = THREE.ShaderLib[ 'cube' ];
  this.cubemap = null;

  this.boxSize = 19;

  this.cubeTexLoader = new THREE.CubeTextureLoader();
  this.imageLoader = new THREE.ImageLoader();

  this.transition = null;

};

Skyboxes.prototype = {

  //Init
  init: function () {

    this.currentSkyName = this.skyNames[0];
    if(isMobile) this.currentSkyName += "_mobile";

    this.cubemapURL = [
      'img/sky/'+ this.currentSkyName + '/pano_2.jpg',
      'img/sky/'+ this.currentSkyName + '/pano_0.jpg',
      'img/sky/'+ this.currentSkyName + '/pano_4.jpg',
      'img/sky/'+ this.currentSkyName + '/pano_5.jpg',
      'img/sky/'+ this.currentSkyName + '/pano_1.jpg',
      'img/sky/'+ this.currentSkyName + '/pano_3.jpg'

    ];

    this.skyShader = THREE.ShaderLib[ 'cube' ];
    this.cubemap = this.cubeTexLoader.load(this.cubemapURL, function(){
      top.initialSkyboxLoad();
      top.iframeDidLoad();
      this.preloadImages();
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
    scene.add(this.skyBox);

    //LoadingManager
    var geometry = new THREE.SphereGeometry( 1, 32, 32 );
    var material = new THREE.MeshBasicMaterial( {color: 0x000000, transparent:true, opacity:0, side: THREE.DoubleSide} );
    this.transition = new THREE.Mesh( geometry, material );
    this.transition.position.set (0,0,0);
    scene.add( this.transition );
  }, 

  preloadImages: function () {

    var found = false;
    var _tempSkyNames = [];
    for(var i = 1; i < this.skyNames.length; i++){

      found = false;

      for(var y = 0; y < top.loadedSkies.length; y++){
      
        if(top.loadedSkies[y] === this.skyNames[i] )
          found = true;
      }

      if(!found){
        _tempSkyNames.push(this.skyNames[i]);
        top.loadedSkies.push(this.skyNames[i]);
      }
    }

    //LoadTextures
    for(var ii = 0; ii < _tempSkyNames.length; ii++){
      for(var iii = 0; iii < 6; iii++){

        this.currentSkyName = _tempSkyNames[ii];
        if(isMobile) this.currentSkyName += "_mobile";

        this.imageLoader.load( 'img/sky/'+ this.currentSkyName +'/pano_'+ iii +'.jpg', function(){
          top.skyboxLoad();
        });    
      }
    }
  },

  recreateSky: function (_folderName, _newPos) {

    TweenMax.to(this.transition.material, top.fadeOut ,{opacity: 1, onComplete:this.transitionEnd, onCompleteParams:[_folderName, _newPos]});

  },

  transitionEnd: function (_folderName, _newPos) {

    if(isMobile) _folderName += "_mobile";

    var urlsNew = [
      'img/sky/' + _folderName + '/pano_2.jpg',
      'img/sky/' + _folderName + '/pano_0.jpg',
      'img/sky/' + _folderName + '/pano_4.jpg',
      'img/sky/' + _folderName + '/pano_5.jpg',
      'img/sky/' + _folderName + '/pano_1.jpg',
      'img/sky/' + _folderName + '/pano_3.jpg'
    ];

    this.cubemap = this.cubeTexLoader.load(urlsNew);
    this.skyShader.uniforms[ "tCube" ].value = this.cubemap;

    this.viewer.camera.position.set(_newPos.x, _newPos.y, _newPos.z);
    this.viewer.controls.resetSensor();

    this.skyBox.position.set(this.viewer.camera.position.x, this.viewer.camera.position.y, this.viewer.camera.position.z);
    this.transition.position.set(this.viewer.camera.position.x, this.viewer.camera.position.y, this.viewer.camera.position.z);

    TweenMax.to(this.transition.material, top.fadeIn, {opacity:0});

  }
};