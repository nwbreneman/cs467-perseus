game.TitleScreen = me.ScreenObject.extend({
    /**
     *  action to perform on state change
     */
    onResetEvent: function() {
        var backgroundImage = new me.Sprite(0, 0, {
                image: me.loader.getImage('title_screen'),
            });

        backgroundImage.anchorPoint.set(0,0);
        backgroundImage.scale(me.game.viewport.width / backgroundImage.width, me.game.viewport.height / backgroundImage.height);

        // add to the world container
        me.game.world.addChild(backgroundImage, 1);

        //me.audio.playTrack("title_music");


        var x = me.game.viewport.width * 0.13;
        var y = me.game.viewport.height;
        me.game.world.addChild(new game.UI.ButtonUI(x, y * 0.6, "button", "New Game"));
        me.game.world.addChild(new game.UI.ButtonUI(x, y * 0.68, "button", "Resume Save"));
        me.game.world.addChild(new game.UI.ButtonUI(x, y * 0.76, "button", game.data.difficulty));

        me.game.world.addChild(new (me.Renderable.extend ({
            // constructor
            init : function () {
                this._super(me.Renderable, 'init', [0, 0, me.game.viewport.width, me.game.viewport.height]);
                this.anchorPoint.set(0,0);
                //this.font = new me.Font("Arial", 24, "#FFFFFF");
                this.font = new me.BitmapFont(me.loader.getBinary("title_options"), me.loader.getImage("title_options"));
                this.font.set("right", 0.75)

            },

            // Need this for the button to pop back up when released
            update : function (dt) {
                return true;
            },

            draw : function (renderer) {
                x = me.game.viewport.width * 0.95;
                this.font.draw(renderer, "Nathaniel Breneman", x, y * 0.7);
                this.font.draw(renderer, "Mark Buckner", x, y * 0.75);
                this.font.draw(renderer, "Sylvan Canales", x, y * 0.80);
            },
           
        })), 2);


        this.buttonHandler = me.event.subscribe(me.event.KEYUP, function (action, keyCode) {

            if (action === "New Game") {
                me.state.change(me.state.PLAY);
            } else if (action === "Resume Save") {
                // Do something to load previous save game here
                
            }
        });
    },

        

    /**
     *  action to perform when leaving this screen (state change)
     */
    onDestroyEvent: function() {
        //me.game.world.removeChild(this.HUD);
        me.input.unbindKey(me.input.KEY.ENTER);
        me.event.unsubscribe(this.buttonHandler);
        //me.audio.stopTrack("title_music");
    }
});
