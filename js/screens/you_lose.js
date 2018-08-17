game.YouLoseScreen = me.ScreenObject.extend({

    onResetEvent: function () {
        var bgImage = new me.Sprite(0, 0, {
            image: me.loader.getImage('lose_bg')
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
            "Try Again",
            this.reloadLevel.bind(this)
        ));

        me.game.world.addChild(new game.UI.ButtonUI2(
            x, y * 0.6,
            "button",
            "Main Menu",
            this.loadMainMenu.bind(this)
        ));
    },

    loadMainMenu: function () {
        me.state.change(me.state.MENU);
    },

    reloadLevel: function () {
        var level = me.levelDirector.getCurrentLevelId();
        // if level 1, go to PLAY screen
        if (level === "level1") {
            me.state.change(me.state.PLAY);
        } else if (level === "level2") {
            // if level 2, go to LEVEL2 screen
            me.state.change(me.state.LEVEL2);
        }
    }
});