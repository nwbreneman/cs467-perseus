// Define how many pixels to pan for all panning functions
const AMOUNT_TO_PAN = 10;

var mapPanner = new (me.Renderable.extend({
    init: function () {
        this._super(me.Renderable, 'init', [0, 0, 0, 0]);
        this.alwaysUpdate = true;
        this.persistent = true;

        // viewport height/width for brevity
        this.vpWidth = me.game.viewport.getWidth();
        this.vpHeight = me.game.viewport.getHeight();
    },

    // Pan the camera when WASD/left down up right pressed
    update: function () {
        var panned = false;
        if (me.input.isKeyPressed("left")) {
            me.game.viewport.move(-AMOUNT_TO_PAN, 0);
            panned = true;
        } else if (me.input.isKeyPressed("right")) {
            me.game.viewport.move(AMOUNT_TO_PAN, 0);
            panned = true;
        } else if (me.input.isKeyPressed("up")) {
            me.game.viewport.move(0, -AMOUNT_TO_PAN);
            panned = true;
        } else if (me.input.isKeyPressed("down")) {
            me.game.viewport.move(0, AMOUNT_TO_PAN);
            panned = true;
        }

        return panned;
    }
}));
console.log("foobar");
console.log(mapPanner);

/**
 * Unit-selection box drawn by clicking mouse and dragging, then
 * releasing mouse. Adapted)-ish) from:
 * https://github.com/melonjs/melonJS/blob/master/examples/isometric_rpg/js/screens/play.js
 */
var selectionBox = new (me.Renderable.extend({

    init: function () {

        this._super(me.Renderable, 'init', [0, 0, 0, 0]);

        this.floating = true;
        this.anchorPoint.set(0, 0);
        this.polyPoints = [];  // array of polygon points to draw
        this.selectBox = this.clone().toPolygon().toIso();
        this.startSelection = false;
        this.finalDraw = false;
        this.player = game.data.player1;
        this.persistent = true;

        // Subscribe to pointerclick and pointermove events
        this.pointerClickEvent = me.event.subscribe("pointerclick",
            this.pointerClick.bind(this));
        this.pointerMoveEvent = me.event.subscribe("pointermove",
            this.pointerMove.bind(this));
    },

    /** Callback for selecting units on the level:
     * pointerdown resets the player's selected units
     * and starts tracking the rectangle's coordinates to draw.
     * pointerup clears out the last three rectangle coordinates
     * and adds the final three; then we check to see if any
     * player units are in the rectangle and select them if so.
     */
    pointerClick: function (event) {

        if (me.input.isKeyPressed("shift")) {
            return;
        }

        if (event.type === "pointerdown") {
            this.polyPoints = [];
            this.player.clearSelectedUnits();
            this.player.base.deselect();
            this.polyPoints.push(new me.Vector2d(event.gameScreenX, event.gameScreenY));
            this.startSelection = true;
        }

        if (event.type === "pointerup") {
            this.polyPoints.splice(1, this.polyPoints.length);
            this.polyPoints.push(new me.Vector2d(this.polyPoints[0].x, event.gameScreenY));
            this.polyPoints.push(new me.Vector2d(event.gameScreenX, event.gameScreenY));
            this.polyPoints.push(new me.Vector2d(event.gameScreenX, this.polyPoints[0].y));

            // Selects player units
            units = this.player.getUnits();
            for (var i = 0; i < units.length; i++) {
                unit = units[i];
                if (unit.pos) {  // this if statement will be removed next week
                    pos = me.game.viewport.worldToLocal(unit.pos._x, unit.pos._y);
                    if (this.selectBox.containsPoint(pos.x, pos.y)) {
                        this.player.addSelectedUnit(unit);
                    }
                }
            }

            // Reset the rectangle coordinates to remove the selectbox
            this.polyPoints = [];
            this.startSelection = false;
            this.finalDraw = true;
        }

        return false;
    },

    /** Callback to draw the rectangle as the mouse moves;
     * quite similar to the pointerup handling above.
     */
    pointerMove: function (event) {
        if (this.polyPoints.length >= 1) {
            this.polyPoints.splice(1, this.polyPoints.length);
            this.polyPoints.push(new me.Vector2d(this.polyPoints[0].x, event.gameScreenY));
            this.polyPoints.push(new me.Vector2d(event.gameScreenX, event.gameScreenY));
            this.polyPoints.push(new me.Vector2d(event.gameScreenX, this.polyPoints[0].y));
        }
    },

    /** Update function: always returns true to draw the select box
     * while dragging */
    update: function () {
        if (this.finalDraw) {
            this.finalDraw = false;
            return true;
        }
        return this.startSelection;
    },

    /** Function to render a white rectangle */
    draw: function (renderer) {
        if (this.polyPoints.length === 4) {
            renderer.save();
            renderer.setColor("#FFFFFF");
            this.selectBox.points = this.polyPoints;
            this.selectBox.recalc();
            renderer.drawShape(this.selectBox);
            renderer.restore();
        }
    }

}));