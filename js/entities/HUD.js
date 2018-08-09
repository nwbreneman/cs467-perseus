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
            console.log(unit);
            console.log(unit.shopimage);
            this.addChild(new game.HUD.UnitPurchaser(
                (100 * (i + 1)),
                -50,
                unit
            ));
        }

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
        this.floating = true;
        this.image = image;


        //Mark:
        // trying to fix HUD unit images
        console.log(this.image);
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
