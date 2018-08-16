/**
 * A player class to be used by adding to the game pool:
 * one for the human player, one for the AI.
 */
game.Player = me.Renderable.extend({

    init: function (name, ptype) {

        this._super(me.Renderable, 'init', [0, 0, 0, 0]);
        this.name = name;
        this.alwaysUpdate = true;
        if (ptype !== "Human" && ptype !== "AI") {
            throw ("Error: player type must be 'Human' or 'AI");
        } else {
            this.ptype = ptype;
        }
        this.unitResources = 360;
        this.resourceRate = 0;
        this.resourceRateBoost = 1.0;   // AI can gain a boost in resource rate with HARD difficulty
        // Mark: I'm adding trace statements throughout to monitor unit purchasing
        // console.log("player: " + name + " " + ptype + " starts with " + this.unitResources + " resources. ");
        this.unitList = [];
        this.selectedUnits = [];
        // reference to player's base for buying units & spawn point
        this.base = null;
        this.spawnPoint = null;

        // interval in milliseconds to gain resources
        this.resourceGainInterval = 1000;

        // simple factory control counter
        this.controlledFactories = 0;
    },

    // Buys a unit given a unit name (equivalent to JSON file name)
    buyUnit: function (unitName, loadingSave) {
        settings = me.loader.getJSON(unitName);
        if (settings !== null) {
            if (this.unitResources >= settings.cost) {

                //sound effect
                if (!loadingSave) {
                    me.audio.play("unit_purchase");
                }

                //change resource rate to player if buying an engineer
                if (settings.name == "engineer" && !loadingSave) {
                    this.changeResourceRate(5);
                    game.data.alertMessage.add("ENGINEER BUILT: +5 RESOURCES PER SECOND ");
                }


                var unit = me.pool.pull(unitName, 10, 10, settings);
                unit.pos.x = this.spawnPoint.pos.x - unit.width * 0.5;
                unit.pos.y = this.spawnPoint.pos.y - unit.height * 1.0;
                unit.player = this;
                this.unitResources -= settings.cost;
                this.unitList.push(unit);
                me.game.world.addChild(unit, me.game.world.getChildByName("units")[0].pos.z);
            } else {
                //sound effect
                if (!loadingSave) {
                    me.audio.play("insufficient_resources");
                    game.data.alertMessage.add("INSUFFICIENT FUNDS TO PURCHASE " + unitName);
                }
            }
        }
    },

    selectUnit: function (unit) {
        this.selectedUnits = [unit];
        unit.select();
    },

    addSelectedUnit: function (unit) {
        this.selectedUnits.push(unit);
        unit.select();
    },

    clearSelectedUnits: function () {
        for (var i = 0; i < this.selectedUnits.length; i++) {
            this.selectedUnits[i].deselect();
        }
        this.selectedUnits = [];
    },

    getSelectedUnits: function () {
        return this.selectedUnits;
    },

    getUnits: function () {
        return this.unitList;
    },

    moveUnits: function (x, y) {
        for (var i = 0; i < this.selectedUnits.length; i++) {
            this.selectedUnits[i].move(x, y);
        }
    },

    removeUnit: function (unit) {
        var pos = this.unitList.indexOf(unit);
        if (pos != -1) {
            this.unitList.splice(pos, 1);
        }
    },

    orderAttack: function (x, y) {
        for (var i = 0; i < this.selectedUnits.length; i++) {
            this.selectedUnits[i].unitAttack(x, y);
        }
    },

    changeResourceRate: function (rate) {
        this.resourceRate += (rate * this.resourceRateBoost);
        if (this.ratePromise) {
            me.timer.clearInterval(this.ratePromise);
        }

        this.ratePromise = me.timer.setInterval(
            this.increaseResource.bind(this),
            this.resourceGainInterval
        );
    },

    increaseResource: function () {
        this.unitResources += this.resourceRate;
    },

    cancelMovement: function () {
        for (var i = 0; i < this.selectedUnits.length; i++) {
            this.selectedUnits[i].cancelMovement();
        }
    },

    getSaveState: function () {
        console.log("player " + this.name + " saving state");
        console.log(this.unitList);
        console.log(this.unitList);
        var units = [];
        for (var i = 0; i < this.unitList.length; i++) {
            units.push(this.unitList[i].getSaveState());
        }

        return {
            "name": this.name,
            "ptype": this.ptype,
            "unitResources": this.unitResources,
            "resourceRate": this.resourceRate,
            "resourceRateBoost": this.resourceRateBoost,
            "units": units
        }
    },

    loadSaveState: function (data) {
        this.name = data.name;
        this.ptype = data.ptype;
        this.resourceRate = data.resourceRate;
        this.resourceRateBoost = data.resourceRateBoost;

        for (var i = 0; i < data.units.length; i++) {
            this.unitResources = 99999;
            var unit = data.units[i];
            this.buyUnit(unit.name, true);
            this.unitList[i].loadSaveState(unit);
        }

        this.unitResources = data.unitResources;
    },
});
