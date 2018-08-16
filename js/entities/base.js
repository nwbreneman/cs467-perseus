
/**
 * Base Entity
 */
game.Base = me.Entity.extend({
    init: function (x, y, settings) {
        this._super(me.Entity, 'init', [x, y, settings]);
        this.selected = false;
        this.playerType = settings.playerType;
        this.player = settings.player;
    },

    /**
     * If base owner is human, let human click on it
     */
    onActivateEvent: function () {
        if (this.playerType === "Human") {
            me.input.registerPointerEvent("pointerdown", this, this.pointerDown.bind(this));
        }
    },

    /**
     * Clicking a base displays the HUD to buy units.
     */
    pointerDown: function () {
        if (!this.selected) {
            this.select();
        } else {
            this.deselect();
        }
        return false;
    },

    select: function () {
        this.selected = true;
    },

    deselect: function () {
        this.selected = false;
    }
});