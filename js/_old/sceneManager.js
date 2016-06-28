"use strict";
var managerId = 1;
var fadeOut = 0.4;
var fadeIn = 1.1;
var loadedSkies = [];
var startTime = Date.now();

function init(){

    animate();
}

function iframeDidLoad() {

    var loadTime = Date.now() - startTime;
    console.log("Iframe loaded in " + loadTime/1000 + " seconds");

    document.getElementById('framer').style.zIndex = 2;
    //Fade in
    TweenMax.to("#myIframe", fadeIn, {opacity: 1, delay:0.5});
}

function skyboxLoad() {

    var loadTime = Date.now() - startTime;
    console.log("Skybox loaded in " + loadTime/1000 + " seconds");
}

function initialSkyboxLoad() {

    var loadTime = Date.now() - startTime;
    console.log("First Skybox loaded in " + loadTime/1000 + " seconds");
}

function newSite(subsite) {

    //Fade out
    startTime = Date.now();
    TweenMax.to("#myIframe",fadeOut,{opacity: 0, onComplete:loadNewSite, onCompleteParams: [subsite]});

}

function loadNewSite(_subsite){

    console.log(_subsite);
    document.getElementById('myIframe').src = _subsite;

}

function animate(){

    console.log(managerId);

    requestAnimationFrame(animate);
}