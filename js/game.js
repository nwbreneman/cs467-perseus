
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
        player1: new player("Player 1"),
    },

    // Run on page load.
    "onload": function () {
        // Initialize the video.
        if (!me.video.init(1980, 1200, { wrapper: "screen", scale: "auto", scaleMethod: "fill-max" })) {
            alert("Your browser does not support HTML5 canvas.");
            return;
        }

        // Initialize the audio.
        me.audio.init("mp3,ogg");

        // set and load all resources.
        // (this will also automatically switch to the loading screen)
        me.loader.preload(game.resources, this.loaded.bind(this));
    },

    // Run on game resources loaded.
    "loaded": function () {
        me.state.set(me.state.MENU, new game.TitleScreen());
        me.state.set(me.state.PLAY, new game.PlayScreen());

        // Nathan: I am using these two manually-added test units
        // for the select box testing right now. Will be modified
        // next week to use object pooling.
        me.pool.register("testUnit1", game.Unit);
        me.pool.register("testUnit2", game.Unit);

        // Start the game.
        me.state.change(me.state.PLAY);
    }
};
