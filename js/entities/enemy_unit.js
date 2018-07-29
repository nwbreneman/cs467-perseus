/**
 * EnemyUnit Entity
 */
game.EnemyUnit = me.Entity.extend({
    init: function (x, y, settings) {

        // adjust the size setting information to match the sprite size
        // so that the entity object is created with the right size
        settings.framewidth = settings.width = 88;
        settings.frameheight = settings.height = 108;

        this._super(me.Entity, 'init', [x, y, settings]);

        // Always update even if this invisible entity is "off the screen"
        this.alwaysUpdate = true;

        // testing out stuff
        this.health = 100;

        // To be assigned by the enemy controller
        this.controller = settings.controller;
        this.team = settings.team;

        this.state = settings.initialState;

        this.isHoldingFlag = false;
        this.escortTarget = {};

        // Orders take the form of an object, with a type, and some additional settings
        this.currentOrders = {};
        this.moveDestination = new me.Vector2d(0, 0);

        this.body.collisionType = me.collision.types.ENEMY_OBJECT;

    },


    /** When the entity is created */
    onActivateEvent: function () {
        console.log("enemy unit is created");
        this.changeState(this.state);
    },


    // The enemy controller is issuing a command to this unit. The command is an object, consisting of:
    // { type: string,
    // other parameters: depending on the type }
    // TBD, the unit should act immediately upon receiving a command from the 'boss'
    command: function(order) {
        console.log("Enemy unit received command:", order);
        this.currentOrders = order;
        switch (order.type) {
            case 'move to':
                this.moveDestination.set(order.x, order.y);
                this.changeState("moving");
                break;
            case 'capture flag':
                this.moveDestination.set(order.x, order.y);
                this.changeState("moving");
                break;
            case 'escort':
                this.escortTarget = order.target;
                this.moveDestination.set(order.target.pos.x, order.target.pos.y);
                this.changeState("moving");
                break;
            case 'return flag':
                this.moveDestination.set(order.x, order.y);
                this.changeState("moving");
                break;
            default:
                console.log("command(): order type \'" + order.type + "\' not handled");
                break;
        }
       

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
                console.log("enterState(): state \'" + newState + "\' not handled");
                break;
        }
       
    },


    // Called from changeState()
    leaveState: function(oldState) {
        // Maybe do something interesting here depending on the state

        switch (oldState) {
            default:
                console.log("leaveState(): state \'" + oldState + "\' not handled");
                break;
        }

        this.state = null;
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
                //this.health -= 1; // stop unit from dying for now. Too many console messages
                break;
            case 'defending':

                break;
            case 'moving':
                if (isHoldingFlag) {
                    // get back to the base ASAP!
                }
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

