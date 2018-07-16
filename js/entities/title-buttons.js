/**
 * UI Objects
 */

game.UI = game.UI || {};

/**
 * a basic button control
 */
game.UI.ButtonUI = me.GUI_Object.extend({
    /**
     * constructor
     */
    init: function(x, y, name, label) {
        this._super(me.GUI_Object, "init", [ x, y, {
            image: game.texture,
            region: name + "_up"
        } ]);

        // offset of the two used images in the texture
        this.unclicked_region = game.texture.getRegion(name + "_up");
        this.clicked_region = game.texture.getRegion(name + "_down");

        this.anchorPoint.set(0, 0);
        this.setOpacity(0.8);

        this.font = new me.Font("Arial", 24, "black");
        this.font.textAlign = "center";
        this.font.textBaseline = "middle";

        this.label = label;
    },

    /**
     * function called when the object is clicked on
     */
    onClick : function (/* event */) {
        this.setRegion(this.clicked_region);
        // account for the different sprite size
        this.pos.y += this.height - this.clicked_region.height ;
        this.height = this.clicked_region.height;

        // don't propagate the event
        return false;
    },

    /**
     * function called when the pointer button is released
     */
    onRelease : function (/* event */) {

        this.setRegion(game.texture.getRegion("button_up"));
        // account for the different sprite size
        this.pos.y -= this.unclicked_region.height - this.height;
        this.height = this.unclicked_region.height;


        if (this.label == "Easy") {
            this.label = "Hard";
            game.data.difficulty = "Hard";
        } else if (this.label == "Hard") {
            this.label = "Easy";
            game.data.difficulty = "Easy";
        } else {
            me.event.publish(me.event.KEYUP, [this.label, 0]);
        }

        // don't propagate the event
        return false;
    },

    draw: function(renderer) {
        this._super(me.GUI_Object, "draw", [ renderer ]);
        this.font.draw(renderer,
            this.label,
            this.pos.x + this.width / 2,
            this.pos.y + this.height / 2
        );
    }
});

