
/* Game namespace */
var game = {

    // an object where to store game information
    // Nathan: accessed anywhere via `game.data`
    data: {
        difficulty: "Easy",
        sylvanLogs: false,  // false to suppress sylvan's console logs
    },


    // Run on page load.
    onload: function () {
        // Initialize the video.
        if (!me.video.init(1920, 1200, { wrapper: "screen", scale: "auto", scaleMethod: "fill-max" })) {
            alert("Your browser does not support HTML5 canvas.");
            return;
        }

        // Initialize the audio.
        me.audio.init("mp3,ogg");

        // set and load all resources.
        // (this will also automatically switch to the loading screen)
        me.loader.preload(game.resources, this.loaded.bind(this));

        me.state.change(me.state.LOADING);
    },

    // Run on game resources loaded.
    loaded: function () {

        // remove gravity
        me.sys.gravity = 0;

        game.collisionTypes = {
            ENEMY_UNIT: me.collision.types.USER << 0,
            PLAYER_UNIT: me.collision.types.USER << 1,
        };

        game.texture = new me.video.renderer.Texture(
            me.loader.getJSON("gui"),
            me.loader.getImage("gui")
        );

        me.state.set(me.state.MENU, new game.TitleScreen());
        me.state.set(me.state.PLAY, new game.PlayScreen());
        me.state.LEVEL_WON = me.state.USER + 0;
        me.state.set(me.state.LEVEL_WON, new game.LevelVictoryScreen());
        me.state.set(me.state.GAMEOVER, new game.YouLoseScreen());
        me.state.set(me.state.GAME_END, new game.GameVictoryScreen());

        // set a global fading transition for the screen
        me.state.transition("fade", "#000000", 180);

        // add the unit selection oval
        me.pool.register("selectedShape", game.selectedShape, true);

        // add the map edge
        me.pool.register("mapedge", me.Entity);

        // add our map bases & spawn points
        me.pool.register("bluebase", game.Base);
        me.pool.register("redbase", game.Base);
        me.pool.register("bluespawnpoint", me.Entity);
        me.pool.register("redspawnpoint", me.Entity);
        me.pool.register("blueflagstand", me.Entity);
        me.pool.register("redflagstand", me.Entity);

        //Mark:
        //factory for lefthand side of map
        me.pool.register("factory_1", game.factory);
        //factory for righthand side of map
        me.pool.register("factory_2", game.factory);
        //testing out capture point collision settings
        me.pool.register("capture_point", game.capturePoint);


        // add units to pool
        units = me.loader.getJSON("manifest").units;
        for (var i = 0; i < units.length; i++) {
            me.pool.register(units[i], game.Unit, true);
        }

        // add red units to pool
        units = me.loader.getJSON("manifest_enemy").units;
        for (var i = 0; i < units.length; i++) {
            me.pool.register(units[i], game.EnemyUnit, true);
        }

        // add projectiles to pool
        projectiles = me.loader.getJSON("projectiles").list;
        for (var i = 0; i < projectiles.length; i++) {
            me.pool.register(projectiles[i], game.projectile, true);
        }

        // Start the game.
        me.state.change(me.state.MENU);
    },

    // Custom log function so I don't bother you guys with all my logs
    sylvanlog: function (...args) {
        if (this.data.sylvanLogs) {

            // This is kind of lame but it preserves the original console.log formatting,
            // unlike if you just console.log(args)
            if (args.length == 1) {
                console.log("Sylvan:", args[0]);
            } else if (args.length == 2) {
                console.log("Sylvan:", args[0], args[1]);
            } else if (args.length == 3) {
                console.log("Sylvan:", args[0], args[1], args[2]);
            } else if (args.length == 4) {
                console.log("Sylvan:", args[0], args[1], args[2], args[3]);
            } else if (args.length == 5) {
                console.log("Sylvan:", args[0], args[1], args[2], args[3], args[4]);
            } //etc... I don't think I have any logs with this many arguments

        }
    },
};
