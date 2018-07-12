
/* Game namespace */
var game = {

    // an object where to store game information
    data : {
        // score
        score : 0,

        // Difficulty level
        difficulty : "Easy",
    },


    // Run on page load.
    onload : function () {
        // Initialize the video.
        if (!me.video.init(1920, 1200, {wrapper : "screen", scale : "auto"})) {
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
    loaded : function () {

        game.texture = new me.video.renderer.Texture(
            me.loader.getJSON("gui"),
            me.loader.getImage("gui")
            );

        me.state.set(me.state.MENU, new game.TitleScreen());
        me.state.set(me.state.PLAY, new game.PlayScreen());

        // add our player entity in the entity pool
        //me.pool.register("UI", game.UI);

        // set a global fading transition for the screen
        me.state.transition("fade", "#000000", 250);

        // Start the game.
      //  me.state.change(me.state.PLAY);
      me.state.change(me.state.MENU);

    }
};
