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