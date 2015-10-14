# ZAAK.IO Viewer

WebVR Boilerplate
A THREE.js-based starting point for VR experiences that work well in both Google Cardboard and other VR headsets. Also provides a fallback for experiencing the same content without requiring a VR device.

This project relies heavily on the webvr-polyfill to provide VR support even if the WebVR spec is not implemented.

Projects that use the boilerplate
WebVR Boilerplate Moving Music EmbedVR Sechelt

Getting started
The easiest way to start is to fork this repository or copy its contents into a new directory.

Alternatively, you can start from scratch. The key parts that the boilerplate provides are:

Include webvr-polyfill.js in your project.
Include webvr-manager.js and instantiate a WebVRManager object, passing in your VREffect instance as well as THREE.js' WebGLRenderer (from the THREE.js effect library) as first argument.
For example,

var effect = new THREE.VREffect(renderer);
var manager = new WebVRManager(renderer, effect);
The manager handles going in and out of VR mode. Instead of calling renderer.render() or effect.render(), you call manager.render(), which renders in monocular view by default, or side-by-side binocular view when in VR mode.

Features and known issues
Features:

Enter and exit VR mode (in WebVR and WebVR polyfill compatible environments).
Immersive fullscreen, orientation locking and sleep prevention.
Distortion correction, enabled in iOS only.
High quality head tracking with motion prediction thanks to the WebVR polyfill.
Bugs and known issues:

Proper distortion correction for Android. This requires knowing physical locations of lenses, which requires knowing device's DPI, which is hard in general. It's easier in iOS because there are relatively few iPhone models.
Drift in Chrome for Android. Please star the bug and indicate that you really care about high quality head tracking for VR: http://crbug.com/397824.
Wake lock for Android currently relies on a hack in which a hidden video is played on repeat in the background. This causes big WebGL performance issues, so has been disabled. This will be resolved when the official wakelock API lands: http://crbug.com/257511
Thanks / credits!
Dmitry Kovalev for implementing lens distortion correction.
Brandon Jones and Vladimir Vukicevic for their work on the WebVR spec
Diego Marcos for VREffect and VRControls.
Ricardo Cabello for THREE.js.
