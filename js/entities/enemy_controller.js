/*
 * Enemy AI controller entity
 */
game.AI = me.Renderable.extend({

    init: function (settings) {
        // call the parent constructor
        // (zero size makes this object non-renderable, so the Renderable.draw method won't get called)
        this._super(me.Renderable, 'init', [0, 0, 0, 0]);

        console.log("Enemy AI instantiated")

        // Always update even if this invisible entity is "off the screen"
        this.alwaysUpdate = true;


        this.spawnPoint = settings.spawnPoint;
        this.resources = settings.resources;
        this.resourcePointsOnMap = settings.resourcePoints;
        this.resourcePointsCaptured = 0;
        this.unitList = [];

        // Perform a computation after elapsed number of frames (~ 60 frames per second).
        // Since we don't really need to do computation every frame for high-level strategy
        // This is a parameter that can be tweaked to hopefully alter the difficulty of the AI

        if (settings.difficulty == "Easy") {
            console.log("Easy difficulty.");

        	this.processInterval = 150;
            this.resourceRate = 1;
        } else {
            console.log("Hard difficulty.");

        	this.processInterval = 30;
            this.resourceRate = 4;
        }

        // Set the timing variables
        this.processAccumulator = 0;
        this.resourceAccumulator = 0;
        this.resourceInterval = 60;

    },


    // AI does processing in here
    process: function() {
    	console.log("AI processing function");
        
        if (this.unitList.length == 0) {
            this.buyUnit("enemy_civilian");
        }
    },


    update: function(dt) {
        // Dispatch timed functions
        this.processAccumulator++;
        this.resourceAccumulator++;
        if (this.processAccumulator >= this.processInterval) {
            this.processAccumulator = 0;
            this.process();
        }
        if (this.resourceAccumulator >= this.resourceInterval) {
            this.resourceAccumulator = 0;
            this.accumulate();
        }
        
    },



    buyUnit: function(name) {
        console.log("Trying to buy", name);
        let settings = me.loader.getJSON(name);

        if (settings !== null) {
            settings.controller = this;
            settings.initialState = 'spawning';

            if (this.resources >= settings.cost) {
                console.log("Purchasing unit", name);
                let unit = me.pool.pull(name, 10, 10, settings);
                unit.pos.x = this.spawnPoint.pos.x + unit.width * 0.1;
                unit.pos.y = this.spawnPoint.pos.y - unit.height * 0.5;
                this.resources -= settings.cost;
                this.unitList.push(unit);
                me.game.world.addChild(unit);
            }
        }
    },


    // Accumulate resources based on how many resource points we are in control of
    accumulate: function() {
        this.resources += this.resourceRate;
    },


    // Receive a message from a unit so we can act on the information
    report: function(unit, message) {
        if (message == 'dead') {
            console.log("AI Controller: Unit reporting as dead");
            this.removeUnitFromList(unit);
        }
    },


    removeUnitFromList: function(unit) {
        var pos = this.unitList.indexOf(unit);
        if (pos != -1) {
            this.unitList.splice(pos, 1);
        }
    },

    

});