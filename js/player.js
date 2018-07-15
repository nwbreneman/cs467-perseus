/**
 * A player class to be used by adding to the game pool:
 * one for the human player, one for the AI.
 */
var player = function (name) {

    this.name = name;
    this.unitResources = 2;
    this.units = [];
    this.selectedUnits = [];

    this.buyUnit = function (unitName) {
        // TODO: use the unit Entity
        unit = me.loader.getJSON(unitName);
        if (unit !== null) {
            if (this.unitResources >= unit.cost) {
                this.unitResources -= unit.cost;
                this.units.push(unit);
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
            // console.log("deselecting unit:");
            // console.log(this.selectedUnits[i]);
            // console.log(this.selectedUnits[i]['selected']);
            this.selectedUnits[i].deselect();
            // console.log("now deselected:");
            // console.log(this.selectedUnits[i]);
            // console.log(this.selectedUnits[i]['selected']);
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
