/**
 * a HUD container and child items
 */

game.HUD = game.HUD || {};


game.HUD.Container = me.Container.extend({

    init: function () {
        // call the constructor
        this._super(me.Container, 'init');

        // persistent across level change
        this.isPersistent = true;

        // make sure we use screen coordinates
        this.floating = true;

        // give a name
        this.name = "HUD";

        // associate with human player base
        this.playerBase = me.game.world.getChildByName("bluebase")[0];

        this.addChild(new game.HUD.BaseBox());

        unitList = me.loader.getJSON("manifest");
        for (var i = 0; i < unitList.units.length; i++) {
            unit = me.loader.getJSON(unitList.units[i]);
            //console.log(unit);
            //console.log(unit.shopimage);
            this.addChild(new game.HUD.UnitPurchaser(
                (100 * (i + 1)),
                -50,
                unit
            ));
        }

        this.addChild(new game.HUD.ResourceCounter(0, 0));
        this.addChild(new game.HUD.FactoryControlCounter(0, 0));
        game.data.alertMessage = this.addChild(new game.HUD.alertMessage());
    },
});

/**
 * Base box for hud
 */
game.HUD.BaseBox = me.Renderable.extend({

    init: function () {
        width = 1920;
        height = me.game.viewport.getHeight() / 10;
        x = me.game.viewport.getWidth() / 2;
        y = me.game.viewport.getHeight() - (height / 2);
        this._super(me.Renderable, 'init', [x, y, width, height]);
    },

    update: function () {
        return false;
    },

    draw: function (renderer) {
        if (this.ancestor.playerBase.selected) {
            renderer.setColor("white");
            renderer.fillRect(this.pos.x, this.pos.y, this.width, this.height)
        }
    }
})


/**
 * Unit purchase renderable; clicking it buys a unit
 */
game.HUD.UnitPurchaser = me.GUI_Object.extend({
    init: function (x, y, settings) {

        //Mark:
        //using new shopimage property in unit's JSON files instead of "image" prop which is standing spritesheet
        image = me.loader.getImage(settings.shopimage);

        settings.width = image.width;
        settings.height = image.height;
        y = me.game.viewport.getHeight() + y;
        this._super(me.GUI_Object, 'init', [x, y, settings]);
        this.name = settings.name;
        this.cost = settings.cost;
        this.attack = settings.attack;
        this.defense = settings.defense;
        this.range = settings.range;
        this.speed = settings.speed;
        this.type = settings.type;
        this.floating = true;
        this.image = image;
        this.hover = false;

        this.font = new me.BitmapFont(
            me.loader.getBinary('superstar'),
            me.loader.getImage('superstar')
        );
    },

    onOver: function () {
        this.hover = true;
    },

    onOut: function () {
        this.hover = false;
    },

    update: function () {
        if (this.ancestor.playerBase.selected) {
            return true;
        }
        return false;
    },

    draw: function (renderer) {
        if (this.ancestor.playerBase.selected) {
            renderer.drawImage(this.image, this.pos.x, this.pos.y);
            if (this.hover) {
                var info = (
                    "Name: " + this.name +
                    "\n\nType: " + this.type +
                    "\n\nCost: " + this.cost +
                    "\n\nAttack: " + this.attack +
                    "\n\nDefense: " + this.defense +
                    "\n\nRange: " + this.range +
                    "\n\nSpeed: " + this.speed
                );
                this.font.draw(
                    renderer,
                    info,
                    this.pos.x,
                    this.pos.y - (this.height * 1.5)
                );
            }
        }
    },

    onClick: function () {
        if (this.ancestor.playerBase.selected) {
            player = this.ancestor.playerBase.player;
            player.buyUnit(this.name);
            this.ancestor.playerBase.deselect();
            return false;
        }
    },
});

game.HUD.ResourceCounter = me.Renderable.extend({
    init: function (x, y) {
        this._super(me.Renderable, 'init', [x, y, 0, 0]);
        this.resources = game.data.player1.unitResources;
        this.font = new me.BitmapFont(
            me.loader.getBinary('superstar'),
            me.loader.getImage('superstar')
        );
    },

    update: function () {
        if (this.resources != game.data.player1.unitResources) {
            this.resources = game.data.player1.unitResources;
            return true;
        }
        return false;
    },

    draw: function (renderer) {
        var resourceDisplay = (
            "RESOURCES: " + this.resources +
            "\n\nGAINING " + game.data.player1.resourceRate + "/s"
        );
        this.font.draw(renderer, resourceDisplay, 0, 0);
    }
});

game.HUD.FactoryControlCounter = me.Renderable.extend({
    init: function (x, y) {
        this._super(me.Renderable, 'init', [x, y, 0, 0]);
        this.controlledFactories = game.data.player1.controlledFactories;
        this.totalFactories = me.game.world.getChildByName("factory_1").length;
        this.totalFactories += me.game.world.getChildByName("factory_2").length;
        this.font = new me.BitmapFont(
            me.loader.getBinary('superstar'),
            me.loader.getImage('superstar')
        );
        this.font.textAlign = "right";
    },

    update: function () {
        if (this.controlledFactories != game.data.player1.controlledFactories) {
            this.controlledFactories = game.data.player1.controlledFactories;
            return true;
        }
        return false;
    },

    draw: function (renderer) {
        var msg = (
            "[" + this.controlledFactories +
            "/" + this.totalFactories +
            " CONTROL POINTS]"
        );
        var size = this.font.measureText(msg);
        this.font.draw(
            renderer,
            msg,
            me.game.viewport.width,
            me.game.viewport.height - (size.height * 2)
        );
    }
});

game.HUD.alertMessage = me.Renderable.extend({
    init: function () {
        this._super(me.Renderable, 'init', [0, 0, 0, 0]);
        this.messages = [];
        this.font = new me.BitmapFont(
            me.loader.getBinary('superstar'),
            me.loader.getImage('superstar')
        );
        this.font.textAlign = "center";
        this.font.textBaseline = "middle";
        this.timerPromise = null;
    },

    add: function (message) {
        this.messages.push(message);
    },

    update: function () {
        if (this.messages.length > 0) {
            return true;
        }
        return false;
    },

    draw: function (renderer) {
        if (this.messages.length > 0) {
            var msg = this.messages[0];
            var size = this.font.measureText(msg);
            this.font.draw(
                renderer,
                msg,
                (me.game.viewport.width / 2),
                size.height * 2
            );

            if (!this.timerPromise) {
                this.timerPromise = me.timer.setTimeout(function () {
                    this.messages.shift();
                    this.timerPromise = null;
                }.bind(this), 3000);
            }
        }
    }
});
