var container, stats;

var camera, scene;
var raycaster;
var raycastingActive = true;

var clock;

var tempDeactivated = null;
var tempLookAtObject;
var lookAtTime = 0.0;
var maxLookTime = 1.5;

var tempObjectBaseScale;
var saveScale;
var targetScaleBy = 2.5;

var homeButton;
var homeButtonDistance;
var homeButtonBaseSize;
var homeSize;
var isHome = true;

var xhair, xhair2;

var _targetObject;

var tween;
var tweenRunning = false;

var frameDelat;

var fader, target;

// Preloader
var preload = new THREE.LoadingManager();

preload.onProgress = function ( item, loaded, total ) {
    console.log( item, loaded, total );
    document.getElementById( "loading" ).innerHTML = loaded + " of " + total + " <br> objects ";
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
          document.getElementById( "botcenter" ).style.display = "none";
      },500);
    }, 50);

};


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

// xhair - White Part // Create 3D xhair to help trigger targets
var geometry = new THREE.SphereGeometry(.025, 12, 12);
var material = new THREE.MeshBasicMaterial({wireframe:true, color: 0xffffff, transparent: true, opacity:1});
xhair = new THREE.Mesh(geometry, material);
xhair.position.z = -5;
xhair.name = "xhair";

// xhair - Black Part // Create 3D xhair to help trigger targets
var geometry = new THREE.SphereGeometry(.015, 12, 12);
var material = new THREE.MeshBasicMaterial({wireframe:false, color: 0x000000, transparent: true, opacity:1});
xhair2 = new THREE.Mesh(geometry, material);
xhair2.position.z = -4.5;
xhair2.name = "xhair2";

// Add xhair to Camera (Parent)
camera.add(xhair, xhair2);

// Loader
var loader = new THREE.ObjectLoader(preload);

function loadFromFile(file) {

    loader.load(file, function(obj) {
        scene.add(obj);
        initScene(obj);
    });
}

//Create background color and fog once it's in the json
function initScene(json){

  // renderer.setClearColor(json.project.backgroundColor);
  
  //Get jump to start
  scene.traverse (function (object)
  {
    if (object.name == "BackHome")
    {
      // console.log("he");

       homeButton = object;
       homeButtonDistance = object.position.y;
       homeButtonBaseSize = new THREE.Vector3( object.scale.x, object.scale.y, object.scale.z ); 
       homeSize = homeButtonBaseSize;

    }
  });

};

function loadFromJson(json) {
    scene.add(loader.parse(json));

};

function raycasting(){

  if (!raycastingActive)
    return;

  //Set ray to forward vector from object
  var vector = new THREE.Vector3( 0, 0, -1 );
  vector.applyQuaternion( camera.quaternion );

  raycaster.set( camera.position, vector.normalize() );

  // calculate objects intersecting the picking ray
  var intersects = raycaster.intersectObjects( scene.children, true );

  if(intersects.length == 0){

    console.log("timeReset");
    lookAtTime = 0.0;
    tempLookAtObject = null;
    return;
  }

    //Create an array that just contains all Targets to not
    // get stuck by particles and overlaying wireframes
    var intersectsClean = [];
    for(var iClean = 0; iClean < intersects.length; iClean++){

        var _pointerName = intersects[iClean].object.name.split('_');

       if(_pointerName[0] == "Pointer" ){intersectsClean.push(intersects[iClean]);}
       if(_pointerName[0] == "MoveTo" ){intersectsClean.push(intersects[iClean]);}
       if(_pointerName[0] == "BackHome" ){intersectsClean.push(intersects[iClean]);}
    }

    if(intersectsClean.length == 0){

      if( tempLookAtObject!==null ){
        resetTarget(tempLookAtObject);
      }

      lookAtTime = 0.0;
      if (CARDBOARD_DEBUG) console.log("hardreset");

      tweenRunning = false;

    }

  for ( var i = 0; i < intersectsClean.length; i++ ) {

    if(tempLookAtObject == intersectsClean[i].object){

      if(!tweenRunning){

        tweenRunning = true;

        var targetSize = new THREE.Vector3( tempObjectBaseScale.x*targetScaleBy, tempObjectBaseScale.y*targetScaleBy, tempObjectBaseScale.z*targetScaleBy ); 

        var tweenIn = new TWEEN.Tween( tempLookAtObject.scale )
          .to( { x: targetSize.x, y:targetSize.y, z:targetSize.z  }, maxLookTime*1000 )

          tweenIn.start();
      }

      lookAtTime += frameDelta;

      // time is up
      if(lookAtTime > maxLookTime){

        lookAtTime = 0.0;
        

        var _targetType = intersectsClean[i].object.name.split('_')[0];

        if(_targetType == "MoveTo"){

          // part where you are moving
          _targetObject = intersectsClean[i].object;

          _targetObject.material.opacity = 1;
          new TWEEN.Tween (_targetObject.material).delay(0).to( {opacity:0 }, 2000).start();

          _targetObject.material.opacity = 0;
          new TWEEN.Tween (_targetObject.material).delay(2000).to( {opacity:1 }, 500).start();

          resetTarget(_targetObject);


        } else if(_targetType == "BackHome"){

          hitObject(null, "BackHome", new THREE.Vector3( 0, 0, 0 ));
          return;

        }else if(_targetType == "Pointer"){

          var _targetName = intersectsClean[i].object.name.split('_')[1];
          _targetObject = scene.getObjectByName( "Target_" + _targetName );

          resetTarget(tempLookAtObject);

        }

        tempLookAtObject = null;

      if(_targetObject != null)
        hitObject(_targetObject, _targetType);
      else
        console.log("Target not Found");
      }

    } else {

      if( tempLookAtObject!==null )
        resetTarget(tempLookAtObject);

      tempLookAtObject = intersectsClean[i].object;

      tempObjectBaseScale = new THREE.Vector3(tempLookAtObject.scale.x,tempLookAtObject.scale.y,tempLookAtObject.scale.z);
    }
  }
}

//Once focus on a target is lost, scale it back
function resetTarget(object){
  var tweenOut = new TWEEN.Tween( object.scale )
  .to( { x: tempObjectBaseScale.x, y:tempObjectBaseScale.y, z:tempObjectBaseScale.z }, 350 )
  tweenOut.start();
}

function reactivate() {
  raycastingActive = true;

  new TWEEN.Tween (xhair2.material).to( {opacity:1 }, 500).start();
  new TWEEN.Tween (xhair.material).to( {opacity:1 }, 500).start();
}

function hitObject(_hitObject, _jumpType, _pos){

  if(tween !== undefined)
    tween.stop();

  var newPos;

  console.log(_jumpType);

  if(_hitObject != null){
    newPos = _hitObject.position;

    var _vector = new THREE.Vector3();
    _vector.setFromMatrixPosition( _hitObject.matrixWorld );

    newPos = _vector;

  }else{
    newPos = _pos 
  }

  if(_jumpType == "MoveTo"){

    tween = new TWEEN.Tween(camera.position).delay(0).to(newPos, 1500).onComplete(reactivate);
    tween.easing(TWEEN.Easing.Cubic.InOut);

    xhair.material.opacity = 0;
    xhair2.material.opacity = 0;

    isHome = false;

  }else if(_jumpType == "Pointer"){ 

    // JumpTo(newPos);
    tween = new TWEEN.Tween(camera.position).to(newPos, 10).onComplete(reactivate);

    isHome = false;

  }else if(_jumpType == "BackHome"){

    // JumpTo(_pos);
    tween = new TWEEN.Tween(camera.position).to(newPos, 10).onComplete(reactivate);


    // tempObjectBaseScale = new THREE.Vector3(tempLookAtObject.scale.x,tempLookAtObject.scale.y,tempLookAtObject.scale.z);
    // var _size = homeButtonBaseSize;
      

    isHome = true;
  }
  

  tween.start();

  raycastingActive = false;
}  

// function MoveTo(_pos){

//   tween = new TWEEN.Tween(camera.position).delay(0).to(_pos, 1500).onComplete(reactivate);
//   tween.easing(TWEEN.Easing.Cubic.InOut);

//   xhair.material.opacity = 0;
//   xhair2.material.opacity = 0;
// } 

// function JumpTo(_pos){

//   tween = new TWEEN.Tween(camera.position).to(_pos, 10).onComplete(reactivate);

// }

// Request animation frame loop function
function animate(timestamp) {

  //Get frame delta time
  frameDelta = clock.getDelta();

  // Tween & Raycaster Update
  TWEEN.update();
  raycasting();

  // Update VR headset position and apply to camera.
  controls.update();



  //UpdateHomebutton
  if(homeButton !== undefined){
    // console.log(homeButton.scale);
    // console.log(homeButtonInitalPos);
    homeButton.material.opacity = 0.0;
    homeButton.scale = homeButtonBaseSize ;  

    if(!isHome){

      homeButton.material.opacity = 1;
      // homeButton.visibility = true;

      homeButton.position.set(camera.position.x, camera.position.y + homeButtonDistance, camera.position.z );
    }else{
      homeButton.material.opacity = 0.0;
      homeButton.scale.set(homeSize.x, homeSize.y, homeSize.z);  
    }

  }

  // Render the scene through the manager.
  manager.render(scene, camera, timestamp);

  requestAnimationFrame(animate);
}

// Kick off animation loop
animate();

    // Reset the position sensor when 'z' pressed.
function onKey(event) {
  if (event.keyCode == 90) { // z
    controls.resetSensor();
  }
};

window.addEventListener('keydown', onKey, true);

    // Handle window resizes
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      effect.setSize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener('resize', onWindowResize, false);


  function takeScreenshot() {
    var dataUrl = renderer.domElement.toDataURL("image/png");
    if (CARDBOARD_DEBUG) console.debug("SCREENSHOT: " + dataUrl);
    return renderer.domElement.toDataURL("image/png");
}