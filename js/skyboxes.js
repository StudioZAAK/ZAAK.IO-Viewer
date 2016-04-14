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