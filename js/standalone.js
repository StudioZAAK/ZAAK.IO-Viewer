var camera, scene, raycaster;
var raycastingActive = true;

var mouse = new THREE.Vector2();

var clock;

var tempLookAtObject;
var lookAtTime = 0.0;
var maxLookTime = 1.2;

var currTarget;

var tempObjectBaseScale;

var homeButton;
var homeButtonDistance;
var homeButtonBaseSize;
var homeSize;
var isHome = true;

var xhair, xHairInner;
var targetReset = false;

var tween;
var tweenRunning = false;

var frameDelta;

var thetaLength = 1; // max is 6.3”

var lake, Clouds, CloudsMaterial; 

var stats;

var rotationObject;

var Pseudo;



// Preloader
var preload = new THREE.LoadingManager();

preload.onProgress = function ( item, loaded, total ) {
    console.log( item, loaded, total );
    document.getElementById( "loading" ).innerHTML = loaded + " / " + total;
};

preload.onLoad = function ( item, loaded, total ) {
    console.log( "loading complete" );
    console.log("fader started!");

    setTimeout( function(){
        document.getElementById( "loading" ).innerHTML = "Go!";
        setTimeout( function(){
          document.getElementById( "loading_background" ).style.display = "none";
          document.getElementById( "loading" ).style.display = "none";
          document.getElementById( "preloader" ).style.display = "none";
      },500);
    }, 50);

    //animate();
};

// resetTarget();


//Setup three.js WebGL renderer
var renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(window.devicePixelRatio);

// Append the canvas element created by the renderer to document body element.
document.body.appendChild(renderer.domElement);

//Add Clock
clock = new THREE.Clock();

//Set up Raycaster
raycaster = new THREE.Raycaster();

// Create a three.js scene.
var scene = new THREE.Scene();
//scene.fog = new THREE.FogExp2( 0xf2f2f2, 0.003 );

// Create a three.js camera.
camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.3, 10000);
scene.add(camera);

// Apply VR headset positional data to camera.
var controls = new THREE.VRControls(camera);

// Apply VR stereo rendering to renderer.
var effect = new THREE.VREffect(renderer);
effect.setSize(window.innerWidth, window.innerHeight);

// Create a VR manager helper to enter and exit VR mode.
var manager = new WebVRManager(renderer, effect, {hideButton: false});

// stats

// stats = new Stats();
// stats.domElement.style.position = 'absolute';
// stats.domElement.style.bottom = '20px';
// stats.domElement.style.left = '20px';
// stats.domElement.style.zIndex = 9999;
// // //stats.domElement.style.display = 'none';
// document.body.appendChild( stats.domElement );

// Crosshair
var circleGeometry = new THREE.CircleGeometry( 2, 16 );
var material = new THREE.MeshBasicMaterial({color: 0x333333, depthWrite: false, depthTest: false, transparent:true});
xhair = new THREE.Mesh( circleGeometry, material );
xhair.scale.set( 0.03, 0.03, 0.03 );
xhair.position.z = -10.1;

var circleGeometry = new THREE.CircleGeometry( 1.5, 16 );

var material = new THREE.MeshBasicMaterial({color: 0xf2f2f2, depthWrite: true, depthTest: false, transparent:true});
xHairInner = new THREE.Mesh( circleGeometry, material );
xHairInner.scale.set( 0.025, 0.025, 0.025 );
xHairInner.position.z = -10;

camera.add( xhair, xHairInner );

var geometry = new THREE.PlaneGeometry( 10, 10, 1, 1 );
var material = new THREE.MeshBasicMaterial( {
  map: THREE.ImageUtils.loadTexture( "img/homebutton.png" ),
  color: 0xffffff, 
  side: THREE.DoubleSide, 
  depthWrite: true, 
  depthTest: false, 
  alphaTest:0.8,
  transparent:true
} );
Pseudo = new THREE.Mesh( geometry, material );
Pseudo.scale.set( 1, 1, 1 );
//Pseudo.position.z = -5;
Pseudo.position.y = -12;
Pseudo.rotation.x = -0.5 * Math.PI;
Pseudo.name = 'BackHome';
scene.add( Pseudo );

// load scene made with editor
var loader = new THREE.ObjectLoader(preload);
loader.load('scenes/holycrab.json', function(obj) {
  scene.add(obj);
});


function updateXHair(_size, _color, _thetaLength){

  xhair.geometry.dispose();
  camera.remove(xhair);

  var _circleGeometry = new THREE.CircleGeometry( 1.5, 16, 1.55, _thetaLength  );
  var _bufferCircle = new THREE.BufferGeometry().fromGeometry( _circleGeometry );

  var material = new THREE.MeshBasicMaterial({color: _color, depthWrite: true, depthTest: false, transparent:true});
  xhair = new THREE.Mesh( _bufferCircle, material );
  xhair.scale.set( _size,_size,_size );
  xhair.position.z = -10.1;

  camera.add(xhair);

}

function raycasting(){

  if (!raycastingActive)
    return;

  //Set ray to forward vector from object
  var vector = new THREE.Vector3( 0, 0, -1 );
  vector.applyQuaternion( camera.quaternion );

  raycaster.set( camera.position, vector.normalize() );

  // calculate objects intersecting the picking ray
  var intersects = raycaster.intersectObjects( scene.children, true );

  if(intersects.length === 0){

    console.log("timeReset");
    lookAtTime = 0.0;
    tempLookAtObject = null;
    thetaLength = 6.3;

    return;
  }  

  var intersectsClean = sortIntersects(intersects);

  if(intersectsClean.length === 0){

    if( tempLookAtObject!== null && !targetReset){
      resetTarget(tempLookAtObject);
    }

    lookAtTime = 0.0;
    tweenRunning = false;

  }

  for ( var i = 0; i < intersectsClean.length; i++ ) {

    if(tempLookAtObject == intersectsClean[i].object){

      if(!tweenRunning){

        tweenRunning = true;
   
      }

      lookAtTime += frameDelta;

      thetaLength = (Math.PI * 2) * ( 1-(lookAtTime / maxLookTime) );

      targetReset = false;
      updateXHair(0.1, 0x41e3af, thetaLength);

      //Trigger Event on Object
      if(lookAtTime > maxLookTime){

        objectSelected(tempLookAtObject);
 
      }

    } else {

      if( tempLookAtObject!== null )
        resetTarget(tempLookAtObject);

      tempLookAtObject = intersectsClean[i].object;

      tempObjectBaseScale = new THREE.Vector3(tempLookAtObject.scale.x,tempLookAtObject.scale.y,tempLookAtObject.scale.z);
    }
  }
}

function sortIntersects(_intersects){

  //Create an array that just contains all Targets to not
  // get stuck by particles and overlaying wireframes
  var cleanIntersects = [];
  for(var iClean = 0; iClean < _intersects.length; iClean++){

      var _pointerName = _intersects[iClean].object.name.split("_");

    if(_pointerName[0] == "Pointer" ){cleanIntersects.push(_intersects[iClean]);}
    if(_pointerName[0] == "MoveTo" ){cleanIntersects.push(_intersects[iClean]);}
    if(_pointerName[0] == "BackHome" ){cleanIntersects.push(_intersects[iClean]);}
    if(_pointerName[0] == "Scene" ){cleanIntersects.push(_intersects[iClean]);}
    if(_pointerName[0] == "Raymond" ){cleanIntersects.push(_intersects[iClean]);}
  
  }

  return cleanIntersects;
}

function objectSelected(selected){

  var _targetType = selected.name.split("_")[0];
  var _targetObject;

  switch(_targetType){

    case ("MoveTo"):

      _targetObject = selected;

      resetTarget(_targetObject);

      break;

    case ("BackHome"):

      hitObject(null, "BackHome", new THREE.Vector3( 0, 0, 0 ));

      return;

    case ("Pointer"):

      var _targetName = selected.name.split("_")[1];
      _targetObject = scene.getObjectByName( "Target_" + _targetName );

      resetTarget(tempLookAtObject);

      break;

    // case ("Scene"):

    //   scene = null;
    //   scene = new THREE.Scene();

    //   scene.add(camera);

    //   loadFromFile("scenes/test_base.json");

    //   hitObject(null, "BackHome", new THREE.Vector3( 0, 0, 0 ));

    //   return;

  }

  lookAtTime = 0.0;
  tempLookAtObject = null;

  if(_targetObject !== null)
    hitObject(_targetObject, _targetType);
  else
    console.log("Target not Found");

}

//Once focus on a target is lost, scale it back
function resetTarget(object){

  targetReset = true;
  updateXHair(0.04, 0x333333, 6.3);
}

function reactivate() {
  raycastingActive = true;

  new TWEEN.Tween (xHairInner.material).to( {opacity:1 }, 50).start();
  new TWEEN.Tween (xhair.material).to( {opacity:1 }, 50).start();
}

function hitObject(_hitObject, _jumpType, _pos){

  raycastingActive = false;
  isHome = false;

  if(tween !== undefined)
    tween.stop();

  if(_hitObject !== null){
    var newPos = _hitObject.position;

    var _vector = new THREE.Vector3();
    _vector.setFromMatrixPosition( _hitObject.matrixWorld );

    newPos = _vector;

    //Target Vanishing, taking all
    if(currTarget){
      currTarget.material.opacity = 1;

      console.log(currTarget.name);

      currTarget = _hitObject;

      console.log(currTarget.name);

      currTarget.material.opacity = 0;
    }
  }

  if(_jumpType == "MoveTo"){

    tween = new TWEEN.Tween(camera.position).to(newPos, 1300).onComplete(reactivate);
    tween.easing(TWEEN.Easing.Cubic.InOut);

    xhair.material.opacity = 0;
    xHairInner.material.opacity = 0;

  }else if(_jumpType == "Pointer"){

    tween = new TWEEN.Tween(camera.position).to(newPos, 20).onComplete(reactivate);


  }else if(_jumpType == "BackHome"){


    tween = new TWEEN.Tween(camera.position).to(_pos, 10).onComplete(reactivate);

    isHome = true;
  }

  tween.start();

}

// Request animation frame loop function
function animate(timestamp) {

  //Get frame delta time
  frameDelta = clock.getDelta();

  //stats.update();

  // Tween & Raycaster Update
  TWEEN.update();
  raycasting();

  // Update VR headset position and apply to camera.
  controls.update();

  //Update Standalone HomeButton Version
  if(Pseudo !== undefined){
    Pseudo.material.opacity = 0.0;
    //Pseudo.scale = PseudoBaseSize ;

    if(!isHome){

      Pseudo.material.opacity = 1;
      Pseudo.position.set(camera.position.x, camera.position.y - 12, camera.position.z );
    
    }else{

      Pseudo.material.opacity = 0.0;
      //Pseudo.scale.set(homeSize.x, homeSize.y, homeSize.z);

    }
  }

  requestAnimationFrame(animate);

  // Render the scene through the manager.
  manager.render(scene, camera, timestamp);
}


// Kick off animation loop
animate();
// initScene();

function onDocumentMouseDown( event ) {

  event.preventDefault();

  if(raycastingActive){

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera );

    var _mouseIntersects = raycaster.intersectObjects( scene.children, true );

    var _cleanIntersects = sortIntersects(_mouseIntersects);

    if ( _cleanIntersects.length > 0 ) 
      objectSelected(_cleanIntersects[0].object);
    
  }
}

// Reset the position sensor when "z" pressed.
function onKey(event) {
  if (event.keyCode == 90) { // z
    controls.resetSensor();
  }
}

window.addEventListener("keydown", onKey, true);
window.addEventListener( "mousedown", onDocumentMouseDown, false );
// window.addEventListener( "touchstart", onDocumentTouchStart, false );

// Handle window resizes
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    effect.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onWindowResize, false);


// function takeScreenshot() {
//     var dataUrl = renderer.domElement.toDataURL("image/png");
//     if (CARDBOARD_DEBUG) console.debug("SCREENSHOT: " + dataUrl);
//     return renderer.domElement.toDataURL("image/png");
// }