  // Astroman - Body
  var loader = new THREE.JSONLoader();
  loader.load( 'models/kay9.json', function( geometry, materials ) {

    var mesh = new THREE.SkinnedMesh(
    geometry,
      new THREE.MeshPhongMaterial( { 
        skinning: true, 
        shading:THREE.FlatShading, 
        wireframe:false, 
        wireframeLinewidth: 5, 
        transparent:true,
        opacity:1,
        //depthTest: false,
        //depthWrite: false,
        side:THREE.DoubleSide,
        map: THREE.ImageUtils.loadTexture( 'models/astronaut_bake2.jpg' )
      } )
    );

    astroMixer = new THREE.AnimationMixer( mesh );
    action.swim = astroMixer.clipAction( geometry.animations[ 0 ] );

    action.swim.setEffectiveWeight( 1 );

    action.swim.play();

    mesh.scale.set(150,150,150);
    // mesh.rotation.x = Math.PI / 2;
    // mesh.rotation.y = 3.15;
    //mesh.rotation.x = -1.1;
    mesh.position.set(0,-200,-20);

    scene.add( mesh );
    //dataComplete += 1;

    console.log("astroman loaded");

    var sound2 = new THREE.PositionalAudio( listener );
    sound2.load( 'audio/nasa.mp3' );
    //sound2.setRefDistance( 20 );
    sound2.setRefDistance( 500 );
    sound2.setVolume( 1 );
    sound2.setRolloffFactor( 10 );
    sound2.setLoop(true);
    sound2.autoplay = true;
    mesh.add( sound2 );


  } );
