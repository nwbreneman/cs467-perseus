game.PlayScreen = me.ScreenObject.extend({
    /**
     *  action to perform on state change
     */
    onResetEvent: function () {

        // Bind keys for scrolling the map
        me.input.bindKey(me.input.KEY.LEFT, "left");
        me.input.bindKey(me.input.KEY.A, "left");
        me.input.bindKey(me.input.KEY.RIGHT, "right");
        me.input.bindKey(me.input.KEY.D, "right");
        me.input.bindKey(me.input.KEY.UP, "up");
        me.input.bindKey(me.input.KEY.W, "up");
        me.input.bindKey(me.input.KEY.DOWN, "down");
        me.input.bindKey(me.input.KEY.S, "down");

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

        // load a level
        me.levelDirector.loadLevel("level1");

        // Add invisible entity for panning the levle
        me.game.world.addChild(new (me.Renderable.extend({

            init: function () {
                this._super(me.Renderable, 'init', [0, 0, 0, 0]);
                this.alwaysUpdate = true;
            },

            // Pan the camera when WASD/left down up right pressed
            update: function () {
                const AMOUNT_TO_PAN = 5;
                var panned = false;
                if (me.input.isKeyPressed("left")) {
                    me.game.viewport.move(-AMOUNT_TO_PAN, 0);
                    panned = true;
                } else if (me.input.isKeyPressed("right")) {
                    me.game.viewport.move(AMOUNT_TO_PAN, 0);
                    panned = true;
                } else if (me.input.isKeyPressed("up")) {
                    me.game.viewport.move(0, AMOUNT_TO_PAN);
                    panned = true;
                } else if (me.input.isKeyPressed("down")) {
                    me.game.viewport.move(0, -AMOUNT_TO_PAN);
                    panned = true;
                }

                return panned;
            }
        })));

        // add unit selecting rectangle
        // adapted from:
        // https://github.com/melonjs/melonJS/blob/master/examples/isometric_rpg/js/screens/play.js
        me.game.world.addChild(new (me.Renderable.extend({

            init: function () {

                this._super(me.Renderable, 'init', [0, 0, 0, 0]);

                this.floating = true;
                this.anchorPoint.set(0, 0);
                this.polyPoints = [];  // array of polygon points to draw
                this.selectBox = this.clone().toPolygon().toIso();

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
                player = game.data.player1;

                if (event.type === "pointerdown") {
                    this.polyPoints = [];
                    player.clearSelectedUnits();
                    this.polyPoints.push(new me.Vector2d(event.gameScreenX, event.gameScreenY));
                }

                if (event.type === "pointerup") {
                    this.polyPoints.splice(1, this.polyPoints.length);
                    this.polyPoints.push(new me.Vector2d(this.polyPoints[0].x, event.gameScreenY));
                    this.polyPoints.push(new me.Vector2d(event.gameScreenX, event.gameScreenY));
                    this.polyPoints.push(new me.Vector2d(event.gameScreenX, this.polyPoints[0].y));

                    // Selects player units
                    units = player.getUnits();
                    for (var i = 0; i < units.length; i++) {
                        unit = units[i];
                        if (unit.pos) {  // this if statement will be removed next week
                            if (this.selectBox.containsPoint(unit.pos._x, unit.pos._y)) {
                                player.addSelectedUnit(unit);
                            }
                        }
                    }

                    // Reset the rectangle coordinates to remove the selectbox
                    this.polyPoints = [];
                }
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
                return true;
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

        // Nathan: this is me manually testing some player functions
        // and will be removed next week.
        var player1 = game.data.player1;
        player1.buyUnit("testUnit");
        player1.buyUnit("testUnit");
        player1.buyUnit("testUnit");
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
