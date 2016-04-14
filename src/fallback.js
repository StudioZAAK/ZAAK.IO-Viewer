"use strict";
//Check if device can handle WebGL
if ( !webglAvailable() ) {
  window.open("fallback.html","_self");
}

///////////////////////
//Fallback & Mobile - Functions
///////////////////////

function webglAvailable() {
  try {
    var canvas = document.createElement( 'canvas' );
    return !!( window.WebGLRenderingContext && (
      canvas.getContext( 'webgl' ) ||
      canvas.getContext( 'experimental-webgl' ) )
    );
  } catch ( e ) {
    return false;
  }
}