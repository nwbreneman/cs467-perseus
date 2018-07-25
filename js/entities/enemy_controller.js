/*
 * Enemy AI controller entity
 */
game.AI = me.Renderable.extend({

    init: function (settings) {
        // call the parent constructor
        // (zero size makes this object non-renderable, so the Renderable.draw method won't get called)
        this._super(me.Renderable, 'init', [0, 0, 0, 0]);

        console.log("Enemy AI instantiated");

        // Always update even if this invisible entity is "off the screen"
        this.alwaysUpdate = true;

        this.spawnPoint = settings.spawnPoint;
        this.resources = settings.resources;
        this.resourcePointsOnMap = settings.resourcePoints;
        this.resourcePointsCaptured = 0;
        this.flag = settings.flag;
        this.playerFlag = settings.playerFlag;
        this.flagHomePosition = settings.flagHomePosition;
        this.playerFlagHomePosition = settings.playerFlagHomePosition;
        this.flagAtHome = true;
        this.playerFlagAtHome = true;
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


    // Set up the intervals to call certain functions. Most AI processing won't be done in here
    // because this function is being called 60 times/sec and that is overkill for high-level AI processing.
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


    // Purchase a unit by name, and place him at the spawn point, subtracting the cost from current resources
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
        this.resources += this.resourceRate * (1 + this.resourcePointsCaptured);
    },


    // Receive a message from a unit so we can act on the information
    report: function(unit, message) {
        if (message == 'dead') {
            console.log("AI Controller: Unit reporting as dead");
            this.removeUnitFromList(unit);
        }
        if (message == "return flag") {
            this.sendFlagHome();
        }

    },


    // If a unit dies, we need to remove the reference to that unit from the array
    removeUnitFromList: function(unit) {
        var pos = this.unitList.indexOf(unit);
        if (pos != -1) {
            this.unitList.splice(pos, 1);
        }
    },


    // Determine where the player's flag currently is (and note if it is at its base)
    getOtherFlagPosition: function() {
        this.playerFlagAtHome = this.playerFlag.pos.equals(this.playerFlagHomePosition);
        
    },


    // Determine where my flag currently is (and note if it is at my base)
    getMyFlagPosition: function() {
        this.flagAtHome = this.flag.pos.equals(this.flagHomePosition);

    },


    // When one of my friendly units touches our flag, it should get returned to base
    sendFlagHome: function() {
        this.flag.pos.set(this.flagHomePosition.x, this.flagHomePosition.y);
        console.log("Enemy AI: flag returned!");
    },


    // AI does processing in here
    process: function() {
    	console.log("AI processing function");

        
        
        if (this.unitList.length == 0) {
            this.buyUnit("enemy_civilian");
        }

        // Get location of other flag
        if (this.playerFlagAtHome) {
            //console.log("player flag is at home");
        }
        //console.log("Enemy AI: other flag is at", otherflagpos.x, otherflagpos.y);

        // Get location of my flag
        if (this.flagAtHome) {
            //console.log("my flag is at home");
        }
        //console.log("Enemy AI: my flag is at", myflagpos.x, myflagpos.y, " home position", this.flagHomePosition.x, this.flagHomePosition.y);
        //console.log(this.flagHomePosition.x - myflagpos.x, this.flagHomePosition.y - myflagpos.y);
    },


    



    


    


    




    

    

});