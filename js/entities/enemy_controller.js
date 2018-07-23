/*
 * Enemy AI controller entity
 */

game.AI = me.Renderable.extend({


    init: function (settings) {
        // call the parent constructor
        // (zero size makes this object non-renderable, so the Renderable.draw method won't get called)
        this._super(me.Renderable, 'init', [0, 0, 0, 0]);

        // Mark:
        // giving the enemy AI a resource count so it can buy units
        unitResources = settings.unitResources;
        units = settings.units; // initially this is empty list: []
        console.log("Enemy AI instantiated with " + unitResources + " resources.")

        // Always update even if this invisible entity is "off the screen"
        this.alwaysUpdate = true;
       
        //Mark:
        //test spawning 1 red civilian at game start manually
        unitName = "enemy_civilian";
        unit_settings = me.loader.getJSON(unitName);
        if (unit_settings !== null) {
            if (unitResources >= unit_settings.cost) {
                let unit = me.pool.pull(unitName, 10, 10, unit_settings);
                unit.pos.x = settings.spawnPoint.pos.x + unit.width * 0.1;
                unit.pos.y = settings.spawnPoint.pos.y - unit.height * 0.5;
                unit.player = "AI"; //not sure if we need to assign a player property for the AI enemy units?
                settings.unitResources -= unit_settings.cost;
                settings.units.push(unit);
                me.game.world.addChild(unit);
                // Mark:
                // Adding some trace statements to watch resources and unit purchasing
                console.log(unit_settings.name + " unit cost is " + unit_settings.cost);
                console.log("AI now has " + settings.unitResources + " resources remaining");

            } else {
                console.log("not enough money to buy unit");
                // TODO: display message on screen that there aren't
                // enough resources?
            }
        }
    
        // Perform a computation after elapsed number of milliseconds
        // Since we don't really need to do computation every frame for high-level strategy
        // This is a parameter that can be tweaked to hopefully alter the difficulty of the AI
        if (settings.difficulty == "Easy") {
            console.log("Easy difficulty.");
        	this.processInterval = 2500;
        } else {
        	this.processInterval = 300;
            console.log("Hard difficulty.");
        }

        // Set the recurring timer based on the interval
        me.timer.setInterval(this.process, this.processInterval, true);     


    },


    // AI does processing in here
    process: function() {
    	//console.log("AI processing function");

    },

});