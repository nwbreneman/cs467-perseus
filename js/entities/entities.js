/**
 * Unit Entity
 */
game.Unit = me.Entity.extend({
    init: function (x, y, settings) {

        // below resizing was adapted from the enemy section of:
        // http://melonjs.org/en/home/platformer#part5

        // adjust the size setting information to match the sprite size
        // so that the entity object is created with the right size
        settings.framewidth = settings.width = 32;
        settings.frameheight = settings.height = 64;

        // redefine the default shape (used to define path) with a shape matching the renderable
        settings.shapes[0] = new me.Rect(0, 0, settings.framewidth, settings.frameheight);

        this._super(me.Entity, 'init', [x, y, settings]);

        // Nathan: Below is just for manual testing and will be removed next
        // week / fixed so units have player owners
        this.player = game.data.player1;
        this.player.units.push(this);
    },

    /** Registers this entity to pointer events when the entity is created */
    onActivateEvent: function () {
        me.input.registerPointerEvent("pointerdown", this, this.pointerDown.bind(this));
    },

    /** Sets the unit as the selected unit for the player */
    pointerDown: function () {
        if (me.input.isKeyPressed("shift")) {
            this.player.addSelectedUnit(this);
        } else {
            this.player.selectUnit(this);
        }
        return false;
    }
});
