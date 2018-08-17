game.GameVictoryScreen = me.ScreenObject.extend({

    onResetEvent: function () {
        var bgImage = new me.Sprite(0, 0, {
            image: me.loader.getImage('victory_bg')
        });

        bgImage.anchorPoint.set(0, 0);
        bgImage.scale(
            me.game.viewport.width / bgImage.width,
            me.game.viewport.height / bgImage.height
        );

        me.game.world.addChild(bgImage, 1);

        var x = me.game.viewport.width / 2;
        var y = me.game.viewport.height;

        me.game.world.addChild(new game.UI.ButtonUI2(
            x, y * 0.5,
            "button",
            "Main Menu",
            this.loadMainMenu.bind(this)
        ));
    },

    loadMainMenu: function () {
        me.state.change(me.state.MENU);
    }
});