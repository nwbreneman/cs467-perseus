/**
 * EnemyUnit Entity
 */
game.EnemyUnit = game.Unit.extend({
    init: function (x, y, settings) {

        // adjust the size setting information to match the sprite size
        // so that the entity object is created with the right size
        //settings.framewidth = settings.width = 88;
        //settings.frameheight = settings.height = 108;
      
        settings.frameheight = 108;
        settings.framewidth = 88;
        settings.height = settings.frameheight * 0.25;
        settings.width = settings.framewidth * 0.3;

        this._super(me.Entity, 'init', [x, y, settings]);


        this.name = settings.name;
        this.attack = settings.attack;
        this.range = settings.range;
        this.speed = settings.speed;
        this.defense = settings.defense;
        this.type = settings.type;

        this.body.setVelocity(this.speed, this.speed);

        // Always update even if this invisible entity is "off the screen"
        this.alwaysUpdate = true;

        this.renderable.anchorPoint.set(0.5, 0.7);
        
        
        //Mark:
        // trying to add enemy unit standing animations like blue units
        // if you uncomment the lines below, and change enemy_jetpack.json image property to "enemyjetpack_standing"
        // then the enemy jetpack spawns facing SW, but there is no hover effect with the animation(?)
        // despite the console log showing the animations added and the southewest animation set in the logs

        
        this.renderable.addAnimation(this.name + "STANDING_SE", [0, 1, 2, 3], 120);
        this.renderable.addAnimation(this.name + "STANDING_SW", [4, 5, 6, 7], 120);
        this.renderable.addAnimation(this.name + "STANDING_NW", [8, 9, 10, 11], 120);
        this.renderable.addAnimation(this.name + "STANDING_NE", [12, 13, 14, 15], 120);
        // init facing southeast
        this.renderable.setCurrentAnimation(this.name + "STANDING_NW");
        
        game.sylvanlog("enemy renderable: ");
        game.sylvanlog(this.renderable);
		

        // To be assigned by the enemy controller
        this.controller = settings.controller;
        this.team = game.data.enemy;

        this.state = settings.initialState;
        this.moveTo = null;
        this.body.bounce = 0;
        this.isHoldingFlag = false;
        this.escortTarget = {};

        // Orders take the form of an object, with a type, and some additional settings
        this.currentOrders = {};
        this.moveDestination = new me.Vector2d(0, 0);

        // Temporarily not colliding with WORLD_SHAPE because there are some pathfinding issues at the moment
        this.body.collisionType = game.collisionTypes.ENEMY_UNIT;
        this.body.setCollisionMask(
            game.collisionTypes.PLAYER_UNIT | me.collision.types.COLLECTABLE_OBJECT | me.collision.types.ACTION_OBJECT | me.collision.types.PROJECTILE_OBJECT);
    },


    /** When the entity is created */
    onActivateEvent: function () {
        game.sylvanlog("enemy unit is created");
        
        this.changeState(this.state);
    },


    // The enemy controller is issuing a command to this unit. The command is an object, consisting of:
    // { type: string,
    // other parameters: depending on the type }
    // TBD, the unit should act immediately upon receiving a command from the 'boss'
    command: function (order) {
        game.sylvanlog("Enemy unit received command:", order);
        this.currentOrders = order;
        switch (order.type) {
            case 'move to':
                this.moveDestination.set(order.x, order.y);
                this.changeState("moving");
                break;
            case 'capture resource':
                if (order.point != null) {
                    this.moveDestination.set(order.point.pos.x, order.point.pos.y + order.point.height * 0.5);
                    this.changeState("moving");
                }
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
                game.sylvanlog("command(): order type \'" + order.type + "\' not handled");
                break;
        }


    },


    // Enemy specific override
    die: function () {
        this.changeState('dying');
    },


    pickedUpFlag: function() {
        game.sylvanlog("Enemy unit: picked up the flag.");
        
        this.controller.report(this, 'got flag');
    },

    capturedResource: function(resourcePoint) {
        game.sylvanlog("Enemy Unit: captured a resource point:", resourcePoint);
        
        this.changeState("idle");

    },


    // Function to call when you want to switch unit states
    changeState: function (newState) {
        this.leaveState(this.state);
        this.enterState(newState);
    },



    // Called from changeState()
    enterState: function (newState) {
        // Maybe do something interesting here depending on the state
        this.state = newState;

        switch (this.state) {
            case 'spawning':
                game.sylvanlog("enemy unit spawning at spawn point:", this.pos.toString());
            
                this.spawnTimeout = me.timer.getTime() + 1000;
                break;
            case 'idle':
                game.sylvanlog("unit is now idle");
                
                break;
            case 'moving':
                game.sylvanlog("unit is now moving to", this.moveDestination.toString());
                
                this.move(this.moveDestination.x, this.moveDestination.y);
                break;
            case 'dying':
                // Start a death animation or particle effect or something
                this.deathTimeout = me.timer.getTime() + 1000;
                break;
            case 'dead':
                game.sylvanlog("He's dead, Jim!");
                
                this.controller.report(this, 'dead');
                me.game.world.removeChild(this);
                break;
            default:
                game.sylvanlog("enterState(): state \'" + newState + "\' not handled");
                
                break;
        }

    },


    // Called from changeState()
    leaveState: function (oldState) {
        // Maybe do something interesting here depending on the state

        switch (oldState) {
            default:
                game.sylvanlog("leaveState(): state \'" + oldState + "\' not handled");
                
                break;
        }

        this.state = null;
    },


    update: function (dt) {
        // testing out some state change mechanics

        //console.log("health:", this.health);

        // if (this.damage <= 0 && this.state != 'dying' && this.state != 'dead') {
        //     this.changeState('dying');
        // }

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
                if (this.isHoldingFlag) {
                    // get back to the base ASAP!
                }
                if (this.moveTo) {
                    // get the next xy coordinates
                    var newX = this.nextMove.x;
                    var newY = this.nextMove.y;

                    if (newX && newY) {
                        if (newX > this.pos.x && newY > this.pos.y) {
                            if (this.renderable.current.name != this.name + "STANDING_SE") {
                                this.renderable.setCurrentAnimation(this.name + "STANDING_SE");
                                console.log("set current animation to " + this.name + "STANDING_SE");
                            }
                        } else if (newX < this.pos.x && newY > this.pos.y) {
                            if (this.renderable.current.name != this.name + "STANDING_SW") {
                                this.renderable.setCurrentAnimation(this.name + "STANDING_SW");
                                console.log("set current animation to " + this.name + "STANDING_SW");
                            }

                        } else if (newX > this.pos.x && newY < this.pos.y) {
                            if (this.renderable.current.name != this.name + "STANDING_NE") {
                                this.renderable.setCurrentAnimation(this.name + "STANDING_NE");
                                console.log("set current animation to " + this.name + "STANDING_NE");
                            }

                        } else if (newX < this.pos.x && newY < this.pos.y) {
                            if (this.renderable.current.name != this.name + "STANDING_NW") {
                                this.renderable.setCurrentAnimation(this.name + "STANDING_NW");
                                console.log("set current animation to " + this.name + "STANDING_NW");
                            }

                        } else { //default
                            if (this.renderable.current.name != this.name + "STANDING_SE") {
                                this.renderable.setCurrentAnimation(this.name + "STANDING_SE");
                                console.log("defaulted to set current animation to " + this.name + "STANDING_SE");
                            }
                        }
                    }

                    // accelerate in the correct X direction
                    if (newX && newX > this.pos.x) {
                        this.body.vel.x += this.body.accel.x * dt;
                    } else if (newX && newX < this.pos.x) {
                        this.body.vel.x -= this.body.accel.x * dt;
                    }

                    // accelerate in the correct Y direction
                    if (newY && newY > this.pos.y) {
                        this.body.vel.y += this.body.accel.y * dt;
                    } else if (newY && newY < this.pos.y) {
                        this.body.vel.y -= this.body.accel.y * dt;
                    }

                    // stop accelerating on X axis when we reach the (rough) destination
                    if (this.atTargetPos(this.pos.x, newX, this.speed)) {
                        this.nextMove.x = null;
                        this.body.vel.x = 0;
                    }

                    // stop accelerating on Y axis when we reach the (rough) destination
                    if (this.atTargetPos(this.pos.y, newY, this.speed)) {
                        this.nextMove.y = null;
                        this.body.vel.y = 0;
                    }

                    // if we stopped accelerating on both axes, check if there's another
                    // point in our moveTo path; if not, set both to null to stop moving
                    if (this.nextMove.x === null && this.nextMove.y === null) {
                        if (this.moveTo.length > 0) {
                            this.nextMove = this.moveTo.shift();
                        } else {
                            this.nextMove = null;
                            this.moveTo = null;
                        }
                    }


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




        this.body.update(dt);

        me.collision.check(this);

        // return true to update if we are moving
        this._super(me.Entity, "update", [dt]); // For the animation to continue to work
        return true;
    },



    onCollision: function(response, other) {
        if (other.body.collisionType == me.collision.types.COLLECTABLE_OBJECT && other.team != this.team) {
            // Got the flag
            this.pickedUpFlag();
        }
        if (other.body.collisionType == me.collision.types.COLLECTABLE_OBJECT && other.team == this.team
            && !other.isHome()) {
            // Return the flag
            me.sylvanlog("Enemy unit: returned flag");
            this.changeState("idle");
            this.controller.report(this, 'returned flag');
        }

        return false;
    },


});

