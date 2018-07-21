/**
 * A player class to be used by adding to the game pool:
 * one for the human player, one for the AI.
 */
var player = function (name, ptype) {

    this.name = name;
    if (ptype !== "Human" && ptype !== "AI") {
        throw ("Error: player type must be 'Human' or 'AI");
    } else {
        this.ptype = ptype;
    }
    this.unitResources = 9999;
    this.units = [];
    this.selectedUnits = [];
    // reference to player's base for buying units
    this.base = null;

    this.buyUnit = function (unitName) {
        // TODO: use the unit Entity
        settings = me.loader.getJSON(unitName);
        if (settings !== null) {
            if (this.unitResources >= unit.cost) {
                unit = me.pool.pull(
                    settings.name,
                    this.base.pos.x + 50,
                    this.base.pos.y,
                    settings);
                unit.player = this;
                this.unitResources -= unit.cost;
                this.units.push(unit);
                me.game.world.addChild(unit);
                // TODO: render unit on map near base
            } else {
                console.log("not enough money to buy unit");
                // TODO: display message on screen that there aren't
                // enough resources?
            }
        }
    }

    this.selectUnit = function (unit) {
        this.selectedUnits = [unit];
        unit.select();
    }

    this.addSelectedUnit = function (unit) {
        this.selectedUnits.push(unit);
        unit.select();
    }

    this.clearSelectedUnits = function () {
        for (var i = 0; i < this.selectedUnits.length; i++) {
            this.selectedUnits[i].deselect();
        }
        this.selectedUnits = [];
    }

    this.getSelectedUnits = function () {
        return this.selectedUnits;
    }

    this.getUnits = function () {
        return this.units;
    }
}
