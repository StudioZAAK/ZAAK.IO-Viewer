"use strict";
var ManualAdd = function(_viewer) 
{ 
  //The main WebGL Viewer
  this.viewer = _viewer;

};

ManualAdd.prototype = { 

  init: function (){

    var scope = this;

    // Animated Line Texture
    var runnerTexture = new THREE.ImageUtils.loadTexture( 'img/MotherSprite-Flat.png' );
    var boomer = new SpriteAnimator( runnerTexture, 25, 1, 25, 25 ); // texture, #horiz, #vert, #total, duration.

    scope.viewer.allPlugins.push(boomer);

    // Overlay 2a-1
    var loader = new THREE.JSONLoader();
    loader.load( 'scenes/overlays/3a_lines.json', function ( geometry ) {
      
      var material = new THREE.MeshBasicMaterial( { 
        color:0xffffff,
        alphaTest:0.5,
        side:THREE.DoubleSide,
        map:runnerTexture
      } );
      
      var Overlay2a1 = new THREE.Mesh ( geometry, material );
      scope.viewer.scene.add( Overlay2a1 );

      var parent = scope.viewer.scene.getObjectByName( "1a", true );
      parent.add( Overlay2a1 );

    } ); 

  }
};