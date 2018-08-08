Hey guys,

The test spritesheet "standing.png" in data/img is set as the civilian's image property in this branch. This spritesheet has the blue jetpack unit standing frames. 


In entities.js 

Lines 1-22

This slow-motion test animation shows only the north facing frames of the spritesheet "standing.png" in data/img. See how the frames bleed?

Below that, I commented out how I tried setting up animations with image file names for frames rather than melonjs's array index method, but it didn't work and I received a generic error that string parameters aren't allowed for standard spritesheet textures


Lines 78-81 

I set up the frameheight and framewidth. Note that the frameheight is set to be larger than the largest spritesheet frame in an effort to prevent the frame bleeding bug which didn't work.

Lines 128-124

I add the animations based on the spritesheet indexing format described here https://melonjs.github.io/melonJS/docs/me.Sprite.html#addAnimation

The indexing is uniform where frames
[0-3] is STANDING SOUTHEAST animation
[4-7] is STANDING SOUTHWEST 
[8-11] is NORTHWEST
[12-15] is NORTHEAST

Currently, the animation gets set as STANDING SOUTHEAST when unit initializes.

Lines 182 - 204

The standing animation is updated based on travel direction. Note the bleeding effect on the two north facing directions.




When game loads, console logs warning:
Spritesheet Texture for image: http://localhost:8000/data/img/standing.png is not divisible by 52x75, truncating effective size to 52x1200
I'm not sure if this could have something to do with the frame bleeding



Now is where it gets really frustrating. Try switching the test spritesheet to "bomberS.png," which is another spritesheet I've included in data/img. That is, switch the image property in civilian.JSON from "standing" to "bomberS"

Keeping all the other aninmation logic the same, load the game again. The entire spritesheet loads as a single frame animation. Examining the console logs, you can see the animations are correctly defined by name, but their frame-arrays are length (0) and so the animations haven't been set correctly.

Loading the hitbox in the debug panel shows the hitbox is the right size, but the green triangle covers the whole spritesheet and doesn't seem to match the (width, height) console logs.

I'm totally stuck here as to why one test spritesheet would set animations and the other wouldn't.


So to sum up, the main two issues here are:
-Frames bleed on one test sheet
-Other test sheet doesn't even set animations; instead, it sets the whole spritesheet as a single frame

Any help troublehshooting this is appreciated!

--Mark
