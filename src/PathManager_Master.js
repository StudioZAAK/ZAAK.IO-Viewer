"use strict";
var PathManager = function(_viewer){

	this.viewer = _viewer;
};

PathManager.prototype = {

	init: function () {

		this.viewer.scene.traverse( function ( child ){
			
			if(child.name.split('_')[0] === "Path"){
			
				allPaths.push(child);
			}
		});
		
		allPaths.sort(function(a, b) { 		
			 return (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1;
		});	

		for(var i = 0; i < allPaths.length; i++){
		
			var _path = [];
		
			allPaths[i].traverse( function ( child2 ){
			
				if(child2 !== allPaths[i]){

					_path.push(new THREE.Vector3(child2.position.x, child2.position.y, child2.position.z));
				}


			});
			
			addPath(_path);
			
			if(allPaths[i].name.split('_')[2] == 'x')
				pathEnds.push(i);
			
		}

	
	for(var ii = 0; ii < allPaths.length; ii++){
		
		allPaths[ii].traverse(function ( child ){
			scene.remove( child );
		});		
	}


	
	},

	addPath: function(){


	}
};

//initialisation from dummy objects
var allPaths = [];

//Actual real value
var paths = [];
var 

//Loop Path
var currentTime = 0;
var loopTime = 10 * 1000;

//Directional Path
//The tween that smoothly translates t on a directional path
var pathTween;
var currPathPos;

var keyPressed = false;
var touchPressed = false;

function init( event ) {
	

	
}

function addPath(_spline){

  var path;

  var _geometry = new THREE.Geometry();

  for ( var i = 0; i < 200; i ++ ) {

    _geometry.vertices.push( new THREE.Vector3() );

  }

  path = new THREE.CatmullRomCurve3( _spline );
  path.type = 'catmullrom';
  path.tension = 0.0;
  path.mesh = new THREE.Line( _geometry.clone(), new THREE.LineBasicMaterial( {
    color: 0x000000,
    opacity: 0.0,
    transparent:true,
    linewidth: 1
  } ) );
  path.mesh.castShadow = true;
  
  paths.push( path );
  scene.add( path.mesh );

}

this.update = function( event ) {

	var change = event.delta;
	
	if(isNaN(change))
		return;
	
	if( keyPressed || touchPressed){
		
		//Loop
		currentTime = currentTime + change;
	
		var t = ( currentTime % loopTime ) / loopTime;
		var pos = paths[0].getPointAt( t );
		
		camera.position.copy( pos );

	}else{
	
	}
	
}

this.next = function( event ){

}

this.back = function( event ){

}

//Start a tween to move the camera on a path
function cameraTweenStart(_id, _direction){

	if(pathTween !== undefined){
    	pathTween.stop();
	}

  	pathID = _id;

  	currPathPos = new THREE.Vector2(0.0,0.0);

  	if(_direction == 0)
		currPathPos = new THREE.Vector2(1.0,1.0);

 	var toone = new THREE.Vector2( _direction, _direction );

 	pathMove = true;
	pathTween = new TWEEN.Tween(currPathPos).to(toone, 8000).onComplete(pathMoveEnd);

	pathTween.easing(TWEEN.Easing.Cubic.InOut);

  	pathTween.start();

}

//Used for "Forward"/"Back" buttons go to the next path
function cameraTweenPathing(_direction){

	if(_direction == 1){

		if(currPathPos.x == 1)
			cameraTweenStart(pathID + 1, 1);
		else if(currPathPos.x == 0)
			cameraTweenStart(pathID, 1);

	}else{

	    if(currPathPos.x == 1)
	    	cameraTweenStart(pathID, 0);
	    else if(currPathPos.x == 0)
	    	cameraTweenStart(pathID-1, 0);

	}

    pathEnded();
}

//For the "Forward" button. To determine when to hide it.
function pathEnded(){

  for(var i = 0; i < pathEnds.length; i++){

    if(pathID == pathEnds[i] && currPathPos.x > 0.1){
      
      return false;

    }
  }

  return true;
}



function pathMoveEnd(){
  pathMove = false;

  var pos = paths[pathID].getPointAt( Math.round(currPathPos.x) );
  camera.position.copy( pos );


  reactivate();
}

function keydown( event ) {

	if(event.code == "Space")
		keyPressed = true;
}

function keyup( event ) {

	if(event.code == "Space")
		keyPressed = false;
}

function touchstart( event ) {

	touchPressed = true;
}

function toucheend( event ) {

	touchPressed = false;
}
