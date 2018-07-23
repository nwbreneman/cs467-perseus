/**
 * EnemyUnit Entity
 */
game.EnemyUnit = me.Entity.extend({
    init: function (x, y, settings) {

        // below resizing was adapted from the enemy section of:
        // http://melonjs.org/en/home/platformer#part5

        // adjust the size setting information to match the sprite size
        // so that the entity object is created with the right size
        //settings.framewidth = settings.width = 64;
        //settings.frameheight = settings.height = 64;
        settings.framewidth = settings.width = 88;
        settings.frameheight = settings.height = 108;

        // redefine the default shape (used to define path) with a shape matching the renderable
        //settings.shapes[0] = new me.Rect(0, 0, settings.framewidth, settings.frameheight);

        this._super(me.Entity, 'init', [x, y, settings]);

        // Always update even if this invisible entity is "off the screen"
        this.alwaysUpdate = true;

        // testing out stuff
        this.health = 100;

        // To be assigned by the enemy controller
        this.controller = settings.controller;

        // Go to the first state
        this.changeState(settings.initialState);
    },


    /** When the entity is created */
    onActivateEvent: function () {
        //
    },

   
    // Maybe have enemy units be clickable, maybe not (TBD)
    pointerDown: function () {
        //
    },


    command: function(order) {
        //console.log("Enemy unit received command:", order);

        
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

        switch (this.state) {
            case 'spawning':
                console.log("enemy unit spawning at spawn point:", this.pos.x, this.pos.y);
                this.spawnTimeout = me.timer.getTime() + 1000;
                break;
            case 'idle':
                console.log("unit is now idle");
                break;
            case 'dying':
                // Start a death animation or particle effect or something
                this.deathTimeout = me.timer.getTime() + 1000;
                break;
            case 'dead':
                console.log("He's dead, Jim!");
                this.controller.report(this, 'dead');
                me.game.world.removeChild(this);
                break;
            default:

                break;
        }
       
    },


    // Called from changeState()
    leaveState: function(oldState) {
        // Maybe do something interesting here depending on the state
    },


    update: function (dt) {
        // testing out some state change mechanics
        
       //console.log("health:", this.health);

        if (this.health <= 0 && this.state != 'dying' && this.state != 'dead') {
            this.changeState('dying');
        }
    
        switch (this.state) {
            case 'spawning':
                if (me.timer.getTime() > this.spawnTimeout) {
                    this.changeState('idle');
                }
                break;
            case 'idle':
                this.health -= 1;
                break;
            case 'defending':

                break;
            case 'moving':

                break;
            case 'gathering':

                break;
            case 'attacking':

                break;
            case 'dying':
                if (me.timer.getTime() > this.deathTimeout) {
                    this.changeState('dead');
                }
                break;
         
            default:

                break;
        }




        return false;
    },




});

