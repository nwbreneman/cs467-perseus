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
    // reference to player's base for buying units & spawn point
    this.base = null;
    this.spawnPoint = null;

    this.buyUnit = function (unitName) {
        // TODO: use the unit Entity
        settings = me.loader.getJSON(unitName);
        if (settings !== null) {
            if (this.unitResources >= settings.cost) {
                let unit = me.pool.pull(unitName, 10, 10, settings);
                unit.pos.x = this.spawnPoint.pos.x + unit.width * 0.1;
                unit.pos.y = this.spawnPoint.pos.y - unit.height * 0.5;
                unit.player = this;
                this.unitResources -= unit.cost;
                this.units.push(unit);
                me.game.world.addChild(unit);
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

    this.moveUnits = function (x, y) {
        for (var i = 0; i < this.selectedUnits.length; i++) {
            this.selectedUnits[i].move(x, y);
        }
    }
}
