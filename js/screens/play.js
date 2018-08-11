game.PlayScreen = me.ScreenObject.extend({
    /**
     *  action to perform on state change
     */
    onResetEvent: function () {

        // set player initial resource rates
        game.data.player1.changeResourceRate(1);
        game.data.enemy.changeResourceRate(1);

        // Define how many pixels to pan for all panning functions
        const AMOUNT_TO_PAN = 10;

        // load a level
        me.levelDirector.loadLevel("level2");

        // create the visibility graph
        game.data.visGraph = buildGraph();

        // Add invisible renderable for panning the level
        me.game.world.addChild(new (me.Renderable.extend({
            init: function () {
                this._super(me.Renderable, 'init', [0, 0, 0, 0]);
                this.alwaysUpdate = true;
                this.persistent = true;

                // viewport height/width for brevity
                this.vpWidth = me.game.viewport.getWidth();
                this.vpHeight = me.game.viewport.getHeight();
            },

            // Pan the camera when WASD/left down up right pressed
            update: function () {
                var panned = false;
                var dir = new me.Vector2d(0, 0);
                if (me.input.isKeyPressed("up") && !me.input.isKeyPressed("down")) {
                    dir.y = -AMOUNT_TO_PAN;
                    panned = true;
                }
                if (me.input.isKeyPressed("down") && !me.input.isKeyPressed("up")) {
                    dir.y = AMOUNT_TO_PAN;
                    panned = true;
                }
                if (me.input.isKeyPressed("left") && !me.input.isKeyPressed("right")) {
                    dir.x = -AMOUNT_TO_PAN;
                    panned = true;
                }
                if (me.input.isKeyPressed("right") && !me.input.isKeyPressed("left")) {
                    dir.x = AMOUNT_TO_PAN;
                    panned = true;
                }
                if (panned) {
                    me.game.viewport.move(dir.x, dir.y);
                }
                if (me.input.isKeyPressed("x")) {
                    game.data.player1.cancelMovement();
                }

                if (me.input.isKeyPressed("kill")) {
                    selectedUnits = game.data.player1.getSelectedUnits();
                    game.data.player1.clearSelectedUnits();
                    for (let thisUnit of selectedUnits) {
                        thisUnit.die();
                    }

                }

                return panned;
            }
        })));

        /**
         * Unit-selection box drawn by clicking mouse and dragging, then
         * releasing mouse. Adapted)-ish) from:
         * https://github.com/melonjs/melonJS/blob/master/examples/isometric_rpg/js/screens/play.js
         */
        me.game.world.addChild(new (me.Renderable.extend({

            init: function () {

                this._super(me.Renderable, 'init', [0, 0, 0, 0]);

                this.floating = true;
                this.anchorPoint.set(0, 0);
                this.polyPoints = [];  // array of polygon points to draw
                this.selectBox = this.clone().toPolygon().toIso();
                this.startSelection = false;
                this.finalDraw = false;
                this.player = game.data.player1;
                this.persistent = true;

                // Subscribe to pointerclick and pointermove events
                this.pointerClickEvent = me.event.subscribe("pointerclick",
                    this.pointerClick.bind(this));
                this.pointerMoveEvent = me.event.subscribe("pointermove",
                    this.pointerMove.bind(this));
            },

            /** Callback for selecting units on the level:
             * pointerdown resets the player's selected units
             * and starts tracking the rectangle's coordinates to draw.
             * pointerup clears out the last three rectangle coordinates
             * and adds the final three; then we check to see if any
             * player units are in the rectangle and select them if so.
             */
            pointerClick: function (event) {

                // do nothing if shift is held to select multiple units
                if (me.input.isKeyPressed("shift")) {
                    return;
                }

                if (event.type === "pointerdown") {
                    if (event.button === 0) {  // left click
                        this.polyPoints = [];
                        this.player.clearSelectedUnits();
                        this.polyPoints.push(new me.Vector2d(event.gameScreenX, event.gameScreenY));
                        this.startSelection = true;
                    } else if (event.button === 2) { // right click
                        this.player.moveUnits(event.gameWorldX, event.gameWorldY);
                    }
                }

                if (event.type === "pointerup" && this.polyPoints.length > 0) {
                    this.polyPoints.splice(1, this.polyPoints.length);
                    this.polyPoints.push(new me.Vector2d(this.polyPoints[0].x, event.gameScreenY));
                    this.polyPoints.push(new me.Vector2d(event.gameScreenX, event.gameScreenY));
                    this.polyPoints.push(new me.Vector2d(event.gameScreenX, this.polyPoints[0].y));

                    // Selects player units
                    units = this.player.getUnits();
                    for (var i = 0; i < units.length; i++) {
                        unit = units[i];
                        pos = me.game.viewport.worldToLocal(unit.pos._x, unit.pos._y);
                        if (this.selectBox.containsPoint(pos.x, pos.y)) {
                            this.player.addSelectedUnit(unit);
                        }
                    }

                    // Reset the rectangle coordinates to remove the selectbox
                    this.polyPoints = [];
                    this.startSelection = false;
                    this.finalDraw = true;
                }

                return false;
            },

            /** Callback to draw the rectangle as the mouse moves;
             * quite similar to the pointerup handling above.
             */
            pointerMove: function (event) {
                if (this.polyPoints.length >= 1) {
                    this.polyPoints.splice(1, this.polyPoints.length);
                    this.polyPoints.push(new me.Vector2d(this.polyPoints[0].x, event.gameScreenY));
                    this.polyPoints.push(new me.Vector2d(event.gameScreenX, event.gameScreenY));
                    this.polyPoints.push(new me.Vector2d(event.gameScreenX, this.polyPoints[0].y));
                }
            },

            /** Update function: always returns true to draw the select box
             * while dragging */
            update: function () {
                if (this.finalDraw) {
                    this.finalDraw = false;
                    return true;
                }
                return this.startSelection;
            },

            /** Function to render a white rectangle */
            draw: function (renderer) {
                if (this.polyPoints.length === 4) {
                    renderer.save();
                    renderer.setColor("#FFFFFF");
                    this.selectBox.points = this.polyPoints;
                    this.selectBox.recalc();
                    renderer.drawShape(this.selectBox);
                    renderer.restore();
                }
            }

        })));

        // Bind keys for scrolling the map
        me.input.bindKey(me.input.KEY.LEFT, "left");
        me.input.bindKey(me.input.KEY.A, "left");
        me.input.bindKey(me.input.KEY.RIGHT, "right");
        me.input.bindKey(me.input.KEY.D, "right");
        me.input.bindKey(me.input.KEY.UP, "up");
        me.input.bindKey(me.input.KEY.W, "up");
        me.input.bindKey(me.input.KEY.DOWN, "down");
        me.input.bindKey(me.input.KEY.S, "down");
        me.input.bindKey(me.input.KEY.X, "x");

        // Bind shift key for multi-selecting units with click
        me.input.bindKey(me.input.KEY.SHIFT, "shift");
        // Bind ctrl key for attack orders
        me.input.bindKey(me.input.KEY.CTRL, "ctrl");

        // Bind keys for debug/testing
        me.input.bindKey(me.input.KEY.K, "kill");

        // Register for pointer events
        me.input.registerPointerEvent("pointerdown", me.game.viewport,
            function (event) {
                me.event.publish("pointerclick", [event]);
            }, false);
        me.input.registerPointerEvent("pointerup", me.game.viewport,
            function (event) {
                me.event.publish("pointerclick", [event]);
            }, false);
        me.input.registerPointerEvent("pointermove", me.game.viewport,
            function (event) {
                me.event.publish("pointermove", [event]);
            }, false);

        // add our HUD to the game world
        this.HUD = new game.HUD.Container();
        me.game.world.addChild(this.HUD);

        // associate bases & spawn points with players
        game.data.player1.base = me.game.world.getChildByName("bluebase")[0];
        game.data.player1.spawnPoint = me.game.world.getChildByName("bluespawnpoint")[0];
        game.data.player1.spawnPoint.renderable.anchorPoint.set(0.5, 0.5);
        me.game.world.getChildByName("redspawnpoint")[0].renderable.anchorPoint.set(0.5, 0.5);


        // Manually setting the collision type for the world boundary
        // TODO: set the type for the factories as well
        me.game.world.getChildByName("mapedge")[0].body.collisionType = me.collision.types.WORLD_SHAPE;


        // To place something with a given tile coordinate
        //this.vec = new me.Vector2d(0, 0);
        //this.refLayer = me.game.world.getChildByName("Plains")[0];
        //this.refLayer.getRenderer().tileToPixelCoords(4, 19, this.vec);

        // Sylvan: Add flags using the new flag stand entities setup in Tiled
        blueflagstand = me.game.world.getChildByName("blueflagstand")[0];
        redflagstand = me.game.world.getChildByName("redflagstand")[0];

        // Have to set these because the default is (0, 0)
        // Helps position the sprite correctly at the Tiled pointer position
        blueflagstand.renderable.anchorPoint.set(0.5, 0.5);
        redflagstand.renderable.anchorPoint.set(0.5, 0.5);


        hitWidth = 8;       // Giving the flags a hit box so we can detect collisions with players (for picking up and returning flags).
        hitHeight = 30;
        xOffset = -hitWidth * 0.2;      // Make the image line up with the flag stand entity
        yOffset = -hitHeight;
        blueFlag = new game.flag(blueflagstand.pos.x + xOffset, blueflagstand.pos.y + yOffset, { width: hitWidth, height: hitHeight, image: "flag_blue", framewidth: 44, frameheight: 72, team: game.data.player1 });
        redFlag = new game.flag(redflagstand.pos.x + xOffset, redflagstand.pos.y + yOffset, { width: hitWidth, height: hitHeight, image: "flag_red", framewidth: 44, frameheight: 72, team: game.data.enemy })


        // Get a reference to the "flags" layer so we can get the z-value, then add the flags to that layer
        flagZ = me.game.world.getChildByName("flags")[0].pos.z;
        me.game.world.addChild(blueFlag, flagZ);
        me.game.world.addChild(redFlag, flagZ);
        //console.log(blueFlag.pos.z);

        game.data.player1.flagHomePosition = new me.Vector2d(blueflagstand.pos.x + xOffset, blueflagstand.pos.y + yOffset);

        // Add the enemy AI controller with initial settings. Should be added after the flags because this object
        // references the flags in its constructor
        me.game.world.addChild(new game.AI({
            difficulty: game.data.difficulty,
            base: me.game.world.getChildByName("redbase")[0],
            spawnPoint: me.game.world.getChildByName("redspawnpoint")[0],
            resources: 1,
            resourcePoints: 6,   // Should be calculated from the map, hard-code for now
            flag: redFlag,
            playerFlag: blueFlag
        }));

        //Mark: testing spawning blue civilian at start of new game by calling buyUnit()
        game.data.player1.buyUnit("civilian");

    },

    /**
     *  action to perform when leaving this screen (state change)
     */
    onDestroyEvent: function () {

        // Release our pointer events
        me.input.releasePointerEvent("pointermove", me.game.viewport);
        me.input.releasePointerEvent("pointerdown", me.game.viewport);
        me.input.releasePointerEvent("pointerup", me.game.viewport);
    },

});
