/**
 * EnemyUnit Entity
 */
game.EnemyUnit = me.Entity.extend({
    init: function (x, y, settings) {

        // below resizing was adapted from the enemy section of:
        // http://melonjs.org/en/home/platformer#part5

        // adjust the size setting information to match the sprite size
        // so that the entity object is created with the right size
        settings.framewidth = settings.width = 32;
        settings.frameheight = settings.height = 64;

        // redefine the default shape (used to define path) with a shape matching the renderable
        //settings.shapes[0] = new me.Rect(0, 0, settings.framewidth, settings.frameheight);

        this._super(me.Entity, 'init', [x, y, settings]);

        // Define an initial 'state' for this entity, which at the moment hasn't been issued 
        // any command by the AI controller
        this.changeState('idle');

    },


    /** When the entity is created */
    onActivateEvent: function () {
        //
    },

   
    // Maybe have enemy units be clickable, maybe not (TBD)
    pointerDown: function () {
        //
    },


    update: function () {
        // 
        //console.log(this.state);
        if (this.state == 'idle') {
            return false;
        } else if (this.state == 'defending') {
            
        } else if (this.state == 'moving') {

        } else if (this.state == 'gathering') {

        } else if (this.state == 'attacking') {

        } else {
            // undefined state
        }


        return false;
    },


    // Function to call when you want to switch unit states
    changeState: function(newState) {
        this.leaveState(this.state);
        this.enterState(newState);
    },

    // Called from changeState()
    enterState: function(newState) {
        // Maybe do something interesting here depending on the state

        this.state = newState;
    },

    // Called from changeState()
    leaveState: function(oldState) {
        // Maybe do something interesting here depending on the state
    },

});

