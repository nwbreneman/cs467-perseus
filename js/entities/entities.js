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

        this.selected = false;
        this.selectedBox = null;

        // Nathan: Below is just for manual testing and will be removed next
        // week / fixed so units have player owners
        this.player = game.data.player1;
        this.player.units.push(this);
    },

    /** Registers this entity to pointer events when the entity is created */
    onActivateEvent: function () {
        me.input.registerPointerEvent("pointerdown", this, this.pointerDown.bind(this));
    },

    /**
     * Select single unit with a click; holding shift adds multiple units
     * to selection.
     */
    pointerDown: function () {
        if (me.input.isKeyPressed("shift")) {
            this.player.addSelectedUnit(this);
        } else {
            this.player.selectUnit(this);
        }
        this.selected = true;
        return false;
    },

    update: function () {
        if (this.selected) {
            if (!this.selectedBox) {
                pos = this.getBounds().pos;
                this.selectedBox = me.game.world.addChild(me.pool.pull("selectedShape", pos.x, pos.y), 2);
                return true;
            }
        } else {
            if (this.selectedBox) {
                me.game.world.removeChild(this.selectedBox);
                this.selectedBox = null;
                return true;
            }
        }
        return false;
    },

    deselect: function () {
        this.selected = false;
    },

    select: function () {
        this.selected = true;
    }

});


/**
 * Shape indicating a unit has been selected
 */
game.selectedShape = me.Sprite.extend({
    init: function (x, y) {
        this._super(me.Sprite, 'init', [x, y, { image: me.loader.getImage('select') }]);
        this.translate(16, 52);
    },

});
