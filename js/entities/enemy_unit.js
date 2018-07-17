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
        this.changeState('spawning');

        // testing out stuff
        this.health = 100;

    },


    /** When the entity is created */
    onActivateEvent: function () {
        //
    },

   
    // Maybe have enemy units be clickable, maybe not (TBD)
    pointerDown: function () {
        //
    },


    // Function to call when you want to switch unit states
    changeState: function(newState) {
        this.leaveState(this.state);
        this.enterState(newState);
    },

    // Called from changeState()
    enterState: function(newState) {
        // Maybe do something interesting here depending on the state
        

        if (newState == 'dying') {
            // Start a death animation or particle effect or something
            this.deathTimer = 0;
        } else if (newState == 'dead') {
            console.log("He's dead, Jim!");
        }

        this.state = newState;
    },

    // Called from changeState()
    leaveState: function(oldState) {
        // Maybe do something interesting here depending on the state
    },


    update: function (dt) {
        // testing out some state change mechanics
        this.health -= dt;
        
       


        if (this.state == 'idle') {
            console.log(this.state, this.health);

            if (this.health <= 0)
                this.changeState('dying');

        } else if (this.state == 'defending') {

            if (this.health <= 0)
                this.changeState('dying');

        } else if (this.state == 'moving') {

            if (this.health <= 0)
                this.changeState('dying');

        } else if (this.state == 'gathering') {

            if (this.health <= 0)
                this.changeState('dying');

        } else if (this.state == 'attacking') {

            if (this.health <= 0)
                this.changeState('dying');

        } else if (this.state == 'dying') {
            this.deathTimer++;
            console.log("Dying:", this.deathTimer);
            if (this.deathTimer == 30) {
                this.changeState('dead');
            }

        } else if (this.state == 'dead') {
            // Should be deleted from the map
            
        } else if (this.state == 'spawning') {
            // wait for some animation to finish before changing state to idle?
            console.log('spawning');

            this.changeState('idle');

        } else {
            // undefined state
        }


        return false;
    },




});

