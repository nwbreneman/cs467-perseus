
/* Game namespace */
var game = {

    // an object where to store game information
    // Nathan: accessed anywhere via `game.data`
    data: {
        // Nathan: this is where I'm thinking we add the human and AI players;
        // 'player' is a custom object I created in js/player.js
        // so the AI has the same easy functions for buying units,
        // selecting units, etc. Not technically an entity since
        // we're not rendering it.
        player1: new player("Player 1", "Human"),
        enemy: new player("Enemy", "AI"),
        difficulty: "Easy",
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

        game.texture = new me.video.renderer.Texture(
            me.loader.getJSON("gui"),
            me.loader.getImage("gui")
        );

        me.state.set(me.state.MENU, new game.TitleScreen());
        me.state.set(me.state.PLAY, new game.PlayScreen());

        // set a global fading transition for the screen
        me.state.transition("fade", "#000000", 180);

        // add the unit selection oval
        me.pool.register("selectedShape", game.selectedShape, true);

        // add our map bases
        me.pool.register("bluespawnpoint", game.Base);
        me.pool.register("redspawnpoint", game.Base);

        // add units to pool
        units = me.loader.getJSON("manifest").units;
        for (var i = 0; i < units.length; i++) {
            me.pool.register(units[i], game.Unit, true);
        }

        // Start the game.
        me.state.change(me.state.MENU);
    }
};
