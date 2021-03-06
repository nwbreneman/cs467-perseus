/*
* Menu to save or save/exit the game during play
*/

game.pauseMenu = game.pauseMenu || {};

game.pauseMenu.Container = me.Container.extend({

    init: function () {
        this._super(me.Container, 'init');
        this.floating = true;
        this.updateWhenPaused = true;
        this.name = "pauseMenu";
        this.addChild(new game.pauseMenu.PauseMenuButton(
            me.game.viewport.width / 2,
            me.game.viewport.height * 0.5,
            "SAVE")
        );
        this.addChild(new game.pauseMenu.PauseMenuButton(
            me.game.viewport.width / 2,
            me.game.viewport.height * 0.58,
            "SAVE & EXIT")
        );

        me.event.subscribe(me.event.KEYDOWN, function (action) {
            if (action === "esc") {
                if (!me.state.isPaused()) {
                    me.state.pause(false);
                } else {
                    me.state.resume(true);
                }
            }
        }.bind(this));
    }
});

game.pauseMenu.PauseMenuButton = me.GUI_Object.extend({
    init: function (x, y, name) {
        settings = {
            "image": "menu_button"
        };

        this._super(me.GUI_Object, 'init', [x, y, settings]);
        this.alpha = 0;
        this.isPersistent = true;
        this.alwaysUpdate = true;
        this.updateWhenPaused = true;
        this.toggled = false;
        this.label = name;

        this.font = new me.BitmapFont(
            me.loader.getBinary('superstar'),
            me.loader.getImage('superstar')
        );
        this.font.textAlign = "center";
        this.font.textBaseline = "middle";

        me.event.subscribe(me.event.STATE_PAUSE, function () {
            this.alpha = 100;
            this.toggled = true;
        }.bind(this));

        me.event.subscribe(me.event.STATE_RESUME, function () {
            this.alpha = 0;
            this.toggled = true;
        }.bind(this));

    },

    update: function () {
        if (this.toggled) {
            this.toggled = false;
            return true;
        }
        return false;
    },

    onClick: function () {
        if (this.alpha === 0) {
            return;
        }
        if (this.label === "SAVE") {
            saveGame();
            game.data.alertMessage.add("GAME SAVED!");
            me.state.resume();
        } else if (this.label === "SAVE & EXIT") {
            saveGame();
            me.state.resume();
            me.state.change(me.state.MENU);
        }
    },

    draw: function (renderer) {
        this._super(me.GUI_Object, "draw", [renderer]);
        this.font.draw(renderer,
            this.label,
            this.pos.x + this.width / 2,
            this.pos.y + this.height / 2
        );
    }
});

var saveGame = function () {

    // Save player1 data & units
    me.save.add({ "player1data": {} });
    me.save.player1data = game.data.player1.getSaveState();

    // Save enemy data & units
    me.save.add({ "enemyData": {} });
    me.save.enemyData = game.data.enemy.getSaveState();

    // Save flag states
    var gFlags = me.game.world.getChildByType(game.flag);
    var flags = [];
    var f;
    for (var i = 0; i < gFlags.length; i++) {
        f = gFlags[i];
        flags.push(f.getSaveState());
    }
    me.save.add({ "flags": [] })
    me.save.flags = flags;

    // Save which level we were on

    // Save capture point statuses
    var points = [];
    var cPoints = me.game.world.getChildByType(game.capturePoint);
    console.log(cPoints);
    for (var i = 0; i < cPoints.length; i++) {
        point = cPoints[i];
        console.log(point.getSaveState());
        points.push(point.getSaveState());
    }
    me.save.add({ "capturePoints": {} });
    me.save.capturePoints = points;
}