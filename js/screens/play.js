game.PlayScreen = me.ScreenObject.extend({
    /**
     *  action to perform on state change
     */
    onResetEvent: function () {

        // load a level
        me.levelDirector.loadLevel("level1");

        // create the visibility graph
        game.data.visGraph = buildGraph();

        // add game menu
        this.pauseMenu = new game.pauseMenu.Container();
        me.game.world.addChild(this.pauseMenu);

        // add players
        game.data.player1 = me.game.world.addChild(new game.Player("Player 1", "Human"));

        me.game.world.addChild(new game.PanningControls());
        me.game.world.addChild(new game.UnitSelectionBox());

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
        me.input.bindKey(me.input.KEY.ESC, "esc");

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
        me.game.world.getChildByName("bluebase")[0].player = game.data.player1;
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
        blueFlag = new game.flag(blueflagstand.pos.x + xOffset, blueflagstand.pos.y + yOffset, { width: hitWidth, height: hitHeight, image: "flag_blue", framewidth: 44, frameheight: 72, team: game.data.player1, teamName: game.data.player1.name });
        redFlag = new game.flag(redflagstand.pos.x + xOffset, redflagstand.pos.y + yOffset, { width: hitWidth, height: hitHeight, image: "flag_red", framewidth: 44, frameheight: 72, team: game.data.enemy })


        // Get a reference to the "flags" layer so we can get the z-value, then add the flags to that layer
        flagZ = me.game.world.getChildByName("flags")[0].pos.z;
        me.game.world.addChild(blueFlag, flagZ);
        me.game.world.addChild(redFlag, flagZ);
        //console.log(blueFlag.pos.z);

        game.data.player1.flagHomePosition = new me.Vector2d(blueflagstand.pos.x + xOffset, blueflagstand.pos.y + yOffset);

        // Add the enemy AI controller with initial settings. Should be added after the flags because this object
        // references the flags in its constructor
        game.data.enemy = me.game.world.addChild(new game.AI("Enemy", "AI", {
            difficulty: game.data.difficulty,
            base: me.game.world.getChildByName("redbase")[0],
            spawnPoint: me.game.world.getChildByName("redspawnpoint")[0],
            flag: redFlag,
            playerFlag: blueFlag
        }));
        redFlag.team = game.data.enemy;
        redFlag.teamName = game.data.enemy.name;

        //Mark: testing spawning blue civilian at start of new game by calling buyUnit()
        // game.data.player1.buyUnit("civilian");

        // load save if resumed
        if (me.save.player1data && me.save.enemyData) {
            game.data.player1.loadSaveState(me.save.player1data);
            game.data.enemy.loadSaveState(me.save.enemyData);
            var flags = me.game.world.getChildByType(game.flag);
            for (var i = 0; i < flags.length; i++) {
                var flag = flags[i];
                for (var j = 0; j < me.save.flags.length; j++) {
                    var sFlag = me.save.flags[j];
                    flag.loadSaveState(sFlag);
                }
            }
        } else {
            console.log("no save data");
            // set player initial resource rates
            game.data.player1.changeResourceRate(0.5);
            game.data.enemy.changeResourceRate(0.5);
        }

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
