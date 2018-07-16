/*
 * Enemy AI controller entity
 */

game.AI = me.Renderable.extend({


    init: function (player, difficulty) {
        // call the parent constructor
        // (size does not matter here)
        this._super(me.Renderable, 'init', [0, 0, 10, 10]);

        // Always update even if this invisible entity is "off the screen"
        this.alwaysUpdate = true;

        // Don't call the draw method on this entity
        this.opacity = 0.0;

        // Perform a computation after elapsed number of frames
        // Since we don't really need to do computation every frame for high-level strategy
        // This is a parameter that we can maybe tweak to alter the difficulty
        this.frameAccumulator = 0;
        if (difficulty == "Easy") {
        	this.updateFrame = 120;
        } else {
        	this.updateFrame = 20;
        }
        
        this.player = player;
    },

    // Call the process function after a specified number of frames have elapsed
    update: function(dt) {
        this.frameAccumulator ++;
        if (this.frameAccumulator >= this.updateFrame) {
        	this.frameAccumulator = 0;
        	this.process();
        }
        return false;
    },


    // AI does processing in here
    process: function() {
    	//console.log("AI processing function");
     
    },
});