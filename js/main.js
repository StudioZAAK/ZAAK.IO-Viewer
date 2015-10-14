var container, stats;

var camera, scene;
var raycaster;
var raycastingActive = true;

var clock;

var tempDeactivated = null;
var tempLookAtObject;
var lookAtTime = 0.0;
var maxLookTime = 1.5;

var xhair, xhair2;

var _targetObject;

var tween;

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


    // crosshair sprite style
    // var material = new THREE.SpriteMaterial({
    //   map: new THREE.ImageUtils.loadTexture("assets/crosshair.png"),
    //   color: 0xffffff,
    //   fog: true,
    //   depthTest: false
    // });
    // var sprite = new THREE.Sprite(material);
    // sprite.scale.set(0.05, 0.05, 0.05);
    // sprite.position.z = -1;
    // this.camera.add(sprite);

    // Loader
    var loader = new THREE.ObjectLoader(preload);

    function loadFromFile(file) {
        loader.load(file, function(obj) {
            scene.add(obj);
        });
    }

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

        // console.log(intersects.length);

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

           // console.log(_pointerName);

           if(_pointerName[0] == "Pointer" ){intersectsClean.push(intersects[iClean]);}
           if(_pointerName[0] == "MoveTo" ){intersectsClean.push(intersects[iClean]);}
       }

       if(intersectsClean.length == 0){

        if( tempLookAtObject!==null )
          tempLookAtObject.scale.set(1,1,1);
      lookAtTime = 0.0;
      if (CARDBOARD_DEBUG) console.log("hardreset");


  }

  for ( var i = 0; i < intersectsClean.length; i++ ) {

          // if(tempLookAtObject != null )
          //   console.log( tempLookAtObject.name + " _ " + intersectsClean[i].object.name );

          if(tempLookAtObject == intersectsClean[i].object){

            //tempLookAtObject.scale.set(2,2,2);

            var tweenIn = new TWEEN.Tween( tempLookAtObject.scale )
            .to( { x: 3, y:3, z:3 }, 500 )
              //.repeat (2)
              //.yoyo (true)
              tweenIn.start();

              var tweenOut = new TWEEN.Tween( tempLookAtObject.scale )
              .delay(505)
              .to( { x: 1, y:1, z:1 }, 2000 )
              //.repeat (2)
              //.yoyo (true)
              tweenOut.start();

              lookAtTime += frameDelta;

            // console.log("Delata");
            // console.log(clock.getDelta());

            console.log(maxLookTime - lookAtTime);

            // time is up
            if(lookAtTime > maxLookTime){

              console.log("overtimeReset");
              lookAtTime = 0.0;
              tempLookAtObject = null;

              var _targetType = intersectsClean[i].object.name.split('_')[0];
              // var _targetObject;

              if(_targetType == "MoveTo"){

                // part where you are moving
                _targetObject = intersectsClean[i].object;
                console.log("Moving towards ...");

                _targetObject.material.opacity = 1;
                new TWEEN.Tween (_targetObject.material).delay(0).to( {opacity:0 }, 2000).start();

                _targetObject.material.opacity = 0;
                new TWEEN.Tween (_targetObject.material).delay(2000).to( {opacity:1 }, 500).start();

                _targetObject.scale.set(1,1,1);

                // if( tempLookAtObject!==null )
                //   var tweenOut = new TWEEN.Tween( tempLookAtObject.scale.set )

                //   .to( { x: 1, y:1, z:1 }, 1500 )
                //   .repeat (1)
                //   //.yoyo (true)
                //   // .easing( TWEEN.Easing.Exponential.InOut )
                //   tweenOut.start();

            } else {

                var _targetName = intersectsClean[i].object.name.split('_')[1];
                _targetObject = scene.getObjectByName( "Target_" + _targetName );

            }

            if(_targetObject != null)
              hitObject(_targetObject, _targetType);
          else
            console.log("Target not Found");
    }

} else {
    if( tempLookAtObject!==null )
      tempLookAtObject.scale.set(1,1,1);
  tempLookAtObject = intersectsClean[i].object;
}


}
}

function reactivate() {
  raycastingActive = true;

  new TWEEN.Tween (xhair2.material).to( {opacity:1 }, 500).start();
  new TWEEN.Tween (xhair.material).to( {opacity:1 }, 500).start();
}

function hitObject(_hitObject, _jumpType){

    if(tween !== undefined)
        tween.stop();

    var newPos = _hitObject.position;

    var _vector = new THREE.Vector3();
    _vector.setFromMatrixPosition( _hitObject.matrixWorld );

    newPos = _vector;

    if(_jumpType == "MoveTo"){

        tween = new TWEEN.Tween(camera.position).delay(0).to(newPos, 1500).onComplete(reactivate);
        tween.easing(TWEEN.Easing.Cubic.InOut);

        xhair.material.opacity = 0;
        xhair2.material.opacity = 0;

            // new TWEEN.Tween (xhair.position).to(newPos, 2200);
            // new TWEEN.Tween (xhair2.position).to(newPos, 2200);



        } else {

         tween = new TWEEN.Tween(camera.position).to(newPos, 10).onComplete(reactivate);

            // xhair.material.opacity = 0;
            // new TWEEN.Tween (xhair.material).delay(25).to( {opacity:1 }, 500).start();

            // xhair2.material.opacity = 0;
            // new TWEEN.Tween (xhair2.material).delay(25).to( {opacity:1 }, 500).start();

            // new TWEEN.Tween (xhair.position).to(newPos, 10);
            // new TWEEN.Tween (xhair2.position).to(newPos, 10);

        }

        tween.start();

        raycastingActive = false;
    }

    // Request animation frame loop function
    function animate(timestamp) {

      //Get frame delta time
      frameDelta = clock.getDelta();

      // Tween & Raycaster Update
      TWEEN.update();
      raycasting();

      // Update VR headset position and apply to camera.
      controls.update();

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